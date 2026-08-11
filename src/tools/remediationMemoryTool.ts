import { tool } from "@langchain/core/tools";
import { getStore, getConfig } from "@langchain/langgraph";
import { z } from "zod";
import { saveUserMemory } from "../memory/store";

/**
 * The `rememberRemediation` tool: persist a remediation playbook entry.
 *
 * When the agent resolves an incident it calls this tool to record:
 * - which cluster and services were affected
 * - what root cause was identified
 * - what action was taken
 * - what the outcome was
 *
 * On the next incident in the same cluster, the system prompt will include
 * this entry so the agent can reuse the known-good playbook.
 *
 * Reference discipline: store ids and a short summary only, never raw log
 * contents or sensitive infrastructure data.
 */
export const rememberRemediation = tool(
  async ({ incidentId, clusterId, services, rootCause, actionTaken, outcome }): Promise<string> => {
    const store = getStore();
    const userId = getConfig().configurable?.user_id as string | undefined;
    if (!store) return "Long-term memory store is not available in this context.";
    if (!userId) return "No user_id in the run context; cannot persist remediation memory.";

    const key = `remediation_${incidentId}`;
    const summary =
      `${clusterId} / ${services.join(", ")}: ${actionTaken} → ${outcome}` +
      (rootCause ? ` (root cause: ${rootCause})` : "");

    await saveUserMemory(store, userId, key, {
      kind: "remediation",
      summary,
      references: [incidentId, ...services],
    });

    return `Remediation for incident ${incidentId} saved to playbook.`;
  },
  {
    name: "remember_remediation",
    description:
      "Save a remediation action to the long-term playbook so it can be reused in future incidents. " +
      "Call this AFTER successfully mitigating or resolving an incident. " +
      "Stores: cluster, affected services, root cause, action taken, and outcome. " +
      "The next time a similar incident occurs, this entry will appear in context automatically.",
    schema: z.object({
      incidentId: z
        .string()
        .describe("Identifier of the incident being resolved, e.g. 'inc_0042' or an alert _id."),
      clusterId: z
        .string()
        .describe("Kubernetes cluster where the incident occurred, e.g. 'prod-us-east-1'."),
      services: z
        .array(z.string())
        .describe("List of service ids or names affected by this incident."),
      rootCause: z
        .string()
        .optional()
        .describe("Short root cause label, e.g. 'DB_CONNECTION_EXHAUSTION' or 'HPA_MISCONFIGURATION'."),
      actionTaken: z
        .string()
        .describe(
          "One or two sentences describing the remediation action(s) applied, " +
          "e.g. 'Restarted payment-service pod and set HPA maxReplicas to 10.'",
        ),
      outcome: z
        .enum(["resolved", "partially_resolved", "escalated"])
        .describe(
          "resolved = incident fully mitigated; " +
          "partially_resolved = degraded service stabilized but root cause not yet fixed; " +
          "escalated = action taken but incident handed off for deeper investigation.",
        ),
    }),
  },
);
