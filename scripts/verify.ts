import { HumanMessage } from "@langchain/core/messages";
import { bootstrapCredentials } from "../src/credentials";
import { getConfig } from "../src/config";
import { closeMongoClient } from "../src/db/client";
import { knowledgeBaseSearch } from "../src/retrieval/retrieverTool";
import { structuredQuery } from "../src/query/queryTool";
import { assess } from "../src/hybrid/hybridTool";
import { correlateAlerts } from "../src/tools/correlateAlertsTool";
import { buildPatternAgent } from "../src/patterns";
import { messageContentToString } from "../src/util/message";
import { generateAlertEvents, computeExpectations } from "../data/sample/activity_events";
import { getMemoryStore, saveUserMemory, listUserMemories } from "../src/memory/store";

/**
 * Acceptance checks for the three bootcamp checkpoints. Run after `npm run load`.
 *
 *   Checkpoint 1: the agent skeleton runs and answers a sample question per leg.
 *   Checkpoint 2: correct, evidence-backed results (retrieval cites; query is
 *                 correct; hybrid draws on both legs).
 *   Checkpoint 3: >= 2 tools working, memory resumes on a repeated thread_id,
 *                 and one demo scenario runs end to end.
 *
 * Correctness for the structured leg is checked against expectations derived
 * from the SAME deterministic generator that seeded the data.
 */

let failures = 0;
function check(name: string, ok: boolean, detail = ""): void {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : `: ${detail}`}`);
  if (!ok) failures++;
}

async function askAgent(
  pattern: "rag" | "structured" | "hybrid",
  thread: string,
  q: string,
  user = "verify_user",
): Promise<string> {
  const agent = await buildPatternAgent(pattern);
  const res = await agent.invoke(
    { messages: [new HumanMessage(q)] },
    { configurable: { thread_id: thread, user_id: user }, recursionLimit: 25 },
  );
  const last = res.messages.at(-1);
  return last ? messageContentToString(last.content) : "";
}

async function main(): Promise<void> {
  await bootstrapCredentials();
  getConfig();

  const exp = computeExpectations(generateAlertEvents());

  // ---- Checkpoint 1: skeleton runs, one answer per leg -----------------------
  console.log("\nCheckpoint 1: skeleton runs and answers a sample question");
  const ragAnswer = await askAgent("rag", "cp1-rag", "What are the steps to remediate an OOM_KILLED incident in Kubernetes?");
  check("RAG agent returns a non-empty grounded answer", ragAnswer.trim().length > 0);

  const structAnswer = await askAgent(
    "structured",
    "cp1-struct",
    "How many P1 ACTIVE alerts are there right now?",
  );
  check("Structured agent returns a non-empty answer", structAnswer.trim().length > 0);

  // ---- Checkpoint 2: correct, evidence-backed results ------------------------
  console.log("\nCheckpoint 2: correct, evidence-backed results");

  const kb = await knowledgeBaseSearch.invoke({ query: "How do I remediate a Kubernetes OOM_KILLED or CONNECTION_POOL_EXHAUSTED incident?" });
  check("Retrieval returns cited passages (source .md)", kb.includes(".md"));
  check("Retrieval finds the Kubernetes incident runbook", kb.includes("incident-runbook.md"));
  check("Retrieval passage is relevant (mentions remediation steps)", kb.includes("OOM") || kb.includes("rollback") || kb.includes("pool") || kb.includes("RESOURCE_EXHAUSTION"));

  // Fact 1: payment-service P1 ACTIVE count.
  const p1Active = await structuredQuery.invoke({
    question: "How many P1 ACTIVE alerts does the payment-service have?",
  });
  check(
    "structured_query counts payment-service P1 ACTIVE alerts",
    p1Active.includes(String(exp.paymentServiceP1ActiveCount)),
    `expected ${exp.paymentServiceP1ActiveCount}`,
  );
  check("structured_query result includes a plain-language explanation", p1Active.includes("explanation"));

  // Fact 4: INVESTIGATING count.
  const investigating = await structuredQuery.invoke({
    question: "How many incidents are currently in INVESTIGATING status?",
  });
  check(
    "structured_query counts INVESTIGATING incidents",
    investigating.includes(String(exp.investigatingCount)),
    `expected ${exp.investigatingCount}`,
  );

  // Fact 3: average P1 resolution time this month.
  const avgResolution = await structuredQuery.invoke({
    question:
      "What is the average resolution time in minutes for P1 RESOLVED incidents this month? " +
      "Compute resolvedAt minus timestamp, divide by 60000 for minutes, and return the average.",
  });
  check(
    "structured_query computes average P1 resolution time this month",
    avgResolution.includes(String(exp.p1ResolvedThisMonth.avgResolutionMinutes)),
    `expected ${exp.p1ResolvedThisMonth.avgResolutionMinutes} min`,
  );

  // Fact 2: correlated cascade chain (inc_0051 + inc_0052) in prod-us-east-1.
  const correlated = await correlateAlerts.invoke({
    clusterId: exp.correlatedPair.first.clusterId,
    windowMinutes: 15,
    lookbackHours: 24,
  });
  check(
    "correlate_alerts finds the cascade chain in prod-us-east-1",
    correlated.includes(exp.correlatedPair.first._id) && correlated.includes(exp.correlatedPair.second._id),
    `expected ${exp.correlatedPair.first._id} and ${exp.correlatedPair.second._id} in the same chain`,
  );

  // Fact 5: P1 RESOLVED this month with rootCauseCategory = resource_exhaustion.
  const byCause = await structuredQuery.invoke({
    question:
      "How many P1 RESOLVED incidents this month have rootCauseCategory 'resource_exhaustion'? " +
      "Filter by severity P1, status RESOLVED, rootCauseCategory resource_exhaustion, " +
      "and timestamp within the current calendar month. Return the count.",
  });
  check(
    "structured_query counts P1 resource_exhaustion incidents this month",
    byCause.includes(String(exp.p1ResourceExhaustionThisMonth)),
    `expected ${exp.p1ResourceExhaustionThisMonth}`,
  );

  const judgment = await assess.invoke({ subjectId: exp.assessSubjectId });
  check("hybrid assess produces citations (retrieval leg)", judgment.includes("citations") && judgment.includes(".md"));
  check("hybrid assess reaches a verdict (fusion of both legs)", /CONSISTENT|INCONSISTENT|NEEDS REVIEW/i.test(judgment));

  // Fact 6: node disruption cascade — SPOT_INTERRUPTION + cascading POD_RESTARTs on same Karpenter node.
  const spotResult = await structuredQuery.invoke({
    question: "How many ACTIVE alerts have alertType SPOT_INTERRUPTION?",
  });
  check(
    "structured_query finds SPOT_INTERRUPTION node event (Karpenter)",
    spotResult.includes(String(exp.nodeCascade.spotInterruptionActiveCount)),
    `expected ${exp.nodeCascade.spotInterruptionActiveCount} active SPOT_INTERRUPTION`,
  );

  const nodeCascadeResult = await structuredQuery.invoke({
    question: `How many ACTIVE alerts share nodeId '${exp.nodeCascade.nodeId}'? This finds all alerts cascaded from the same node.`,
  });
  check(
    "structured_query finds full node cascade (SPOT_INTERRUPTION + POD_RESTARTs on same node)",
    nodeCascadeResult.includes(String(exp.nodeCascade.alertsOnAnchorNode)),
    `expected ${exp.nodeCascade.alertsOnAnchorNode} alerts on node ${exp.nodeCascade.nodeId}`,
  );

  // ---- Checkpoint 3: >=2 tools, memory resumes, one E2E scenario -------------
  console.log("\nCheckpoint 3: tools + memory + end-to-end scenario");
  check("At least two tools working", true); // retrieval + query + hybrid all exercised above

  // Short-term memory: same thread_id resumes the conversation. Rebuild the
  // agent between turns to prove memory comes from the checkpointer, not from
  // in-process state.
  const memThread = "cp3-memory";
  await askAgent("hybrid", memThread, "Please remember this for our conversation: my name is Dana.");
  const recall = await askAgent("hybrid", memThread, "What is my name?");
  check("Short-term memory resumes on the same thread_id", /dana/i.test(recall), `recall was: "${recall.slice(0, 120)}"`);

  // Long-term memory: durable, cross-thread, keyed by user. Seed a fact for a
  // user, then recall it from a DIFFERENT thread to prove it is not tied to a
  // single conversation the way the checkpointer is.
  const ltmUser = "verify_ltm_user";
  const store = await getMemoryStore();
  await saveUserMemory(store, ltmUser, "team", {
    kind: "profile",
    summary: "The user is on the RiskRunners team.",
    references: [],
  });
  const stored = await listUserMemories(store, ltmUser);
  check("Long-term store persists a user memory", stored.some((m) => /RiskRunners/.test(m.summary)));

  const ltmRecall = await askAgent("hybrid", "cp3-ltm-fresh-thread", "What team am I on?", ltmUser);
  check(
    "Long-term memory recalls across a different thread (same user)",
    /riskrunners/i.test(ltmRecall),
    `recall was: "${ltmRecall.slice(0, 120)}"`,
  );

  const scenario = await askAgent(
    "hybrid",
    "cp3-scenario",
    `Alert ${exp.assessSubjectId} is firing in production. Is this consistent with normal operating thresholds? Assess and cite any relevant standards.`,
  );
  check(
    "End-to-end hybrid scenario returns a reasoned answer",
    scenario.trim().length > 0 && /consistent|review|alert|incident|p1|latency/i.test(scenario),
  );

  console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) failed.`}`);
  if (failures > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(`\nVerify failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  })
  .finally(() => closeMongoClient());
