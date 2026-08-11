import { tool } from "@langchain/core/tools";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import type { Document, Filter } from "mongodb";
import { z } from "zod";
import { getChatModel } from "../llm/model";
import { getDb } from "../db/client";
import { getConfig } from "../config";
import { retrievePassages, formatPassages } from "../retrieval/retrieverTool";
import { messageContentToString } from "../util/message";
import { JUDGMENT_SYSTEM, DEFAULT_QUESTION, LABELS } from "./prompts/index";

/**
 * The hybrid example: `assess`.
 *
 * The flagship pattern. Given the id of a structured record, it does both legs
 * in one tool: query the structured collection for the record, retrieve the
 * relevant policy passages, then hand both to the model for a grounded, cited
 * judgment. This is the "single data layer" story: one answer drawing on
 * structured records and unstructured policy together.
 */

/** How far either side of the subject event to look for related records. */
const RELATED_WINDOW_MS = 24 * 60 * 60 * 1000;
const RELATED_LIMIT = 8;

/**
 * Find the records that plausibly belong to the same real-world transaction as
 * the subject: same actor, or same amount, within a day either side. Adapt this
 * to your own data; it is the one piece of `assess` that encodes what "related"
 * means in your domain.
 */
async function findRelatedRecords(record: Document): Promise<Document[]> {
  const cfg = getConfig();
  const db = await getDb();

  const at = record.timestamp instanceof Date ? record.timestamp : null;
  // Related alerts: same service or same cluster, close in time — likely part of the same incident.
  const sameScope: Filter<Document>[] = [];
  if (record.serviceId) sameScope.push({ serviceId: record.serviceId });
  if (record.clusterId) sameScope.push({ clusterId: record.clusterId });

  const filter: Filter<Document> = {
    _id: { $ne: record._id },
    ...(sameScope.length > 0 ? { $or: sameScope } : {}),
    ...(at
      ? {
          timestamp: {
            $gte: new Date(at.getTime() - RELATED_WINDOW_MS),
            $lte: new Date(at.getTime() + RELATED_WINDOW_MS),
          },
        }
      : {}),
  };

  return db
    .collection(cfg.EVENTS_COLLECTION)
    .find(filter)
    .sort({ timestamp: 1 })
    .limit(RELATED_LIMIT)
    .toArray();
}

export const assess = tool(
  async ({ subjectId, question }): Promise<string> => {
    const cfg = getConfig();
    const db = await getDb();

    // Leg 1: structured lookup. Our synthetic _id values are strings ("evt_0001").
    const record = await db
      .collection(cfg.EVENTS_COLLECTION)
      .findOne({ _id: subjectId } as unknown as Filter<Document>);

    if (!record) {
      return `No record found in ${cfg.EVENTS_COLLECTION} with _id "${subjectId}".`;
    }

    const focus = question?.trim() || DEFAULT_QUESTION;

    // Leg 1b: correlated records. Policies like dual control are about a PAIR of
    // events, so judging one record alone can only ever hedge. Pull the handful
    // of events that plausibly belong to the same transaction: same actor or
    // same amount, close in time. This heuristic is the obvious thing to adapt
    // to your own schema; "related" means something different in every domain.
    const related = await findRelatedRecords(record);

    // Leg 2: retrieval. Seed the query with the record's salient fields so the
    // most relevant policy passages surface.
    const retrievalQuery = `${focus} alertType=${String(record.alertType)} severity=${String(record.severity)} serviceId=${String(record.serviceId)} clusterId=${String(record.clusterId)} status=${String(record.status)}`;
    const passages = await retrievePassages(retrievalQuery);

    // Fusion: reason over both, cite the passages.
    const model = getChatModel({ temperature: 0 });
    // Prompt text is localised (src/hybrid/prompts/); the verdict tokens it asks
    // for are not. CONSISTENT / INCONSISTENT / NEEDS REVIEW are enum-like values
    // that scripts/verify.ts matches on, so they stay uppercase English.
    const system = new SystemMessage(JUDGMENT_SYSTEM);
    const human = new HumanMessage(
      `${LABELS.record(cfg.EVENTS_COLLECTION)}\n${JSON.stringify(record, null, 2)}\n\n` +
        `${LABELS.related}\n${related.length > 0 ? JSON.stringify(related, null, 2) : LABELS.noneRelated}\n\n` +
        `${LABELS.passages}\n${formatPassages(passages)}\n\n` +
        `${LABELS.question} ${focus}`,
    );
    const res = await model.invoke([system, human]);
    const judgment = messageContentToString(res.content);

    return JSON.stringify(
      {
        subjectId,
        question: focus,
        citations: passages.map((p, i) => ({ ref: i + 1, source: p.source, section: p.section })),
        judgment,
      },
      null,
      2,
    );
  },
  {
    name: "assess",
    description:
      "Assess a specific alert against SRE runbooks and operational policies by fusing both legs: look up the " +
      "alert record and its related alerts (same service or cluster), retrieve relevant runbook passages, then " +
      "produce a grounded, cited diagnosis. Use for questions like 'is alert evt_0007 consistent with expected " +
      "behavior per the SLO policy?' or 'what does the runbook say about this OOM_KILLED alert?'.",
    schema: z.object({
      subjectId: z.string().describe("The _id of the alert record to assess, e.g. 'evt_0007'."),
      question: z
        .string()
        .optional()
        .describe("Optional specific question. Defaults to checking runbook and SLO policy consistency."),
    }),
  },
);
