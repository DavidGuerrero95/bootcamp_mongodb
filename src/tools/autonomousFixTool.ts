import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Final step of the autonomous remediation flow.
 *
 * After the agent executes all remediation actions via execute_remediation,
 * it calls this tool to generate a structured incident resolution report
 * confirming the adjustments were applied autonomously.
 */
export const autonomousFix = tool(
  async ({ incidentId, clusterId, actionsTaken, systemStatus, mttrMinutes }): Promise<string> => {
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
    const statusIcon = systemStatus === "stable" ? "✅" : systemStatus === "degraded" ? "⚠️" : "🔄";

    const lines = [
      `╔══════════════════════════════════════════════════════╗`,
      `║       COREX — REMEDIACIÓN AUTÓNOMA COMPLETADA        ║`,
      `╚══════════════════════════════════════════════════════╝`,
      ``,
      `Incidente  : ${incidentId}`,
      `Cluster    : ${clusterId}`,
      `Timestamp  : ${timestamp}`,
      `MTTR       : ${mttrMinutes} min`,
      `Estado     : ${statusIcon} ${systemStatus.toUpperCase()}`,
      ``,
      `── Acciones ejecutadas ────────────────────────────────`,
      ...actionsTaken.map((a, i) => `  ${i + 1}. ✓ ${a}`),
      ``,
      `── Resultado ──────────────────────────────────────────`,
      systemStatus === "stable"
        ? `  Sistema estabilizado. Todas las métricas dentro del umbral.`
        : systemStatus === "degraded"
        ? `  Sistema parcialmente estabilizado. Monitorear por 15 min.`
        : `  Remediación aplicada. Esperando confirmación de métricas.`,
      ``,
      `  Playbook guardado en memoria para futuros incidentes.`,
      `══════════════════════════════════════════════════════`,
    ];

    return lines.join("\n");
  },
  {
    name: "autonomous_fix_applied",
    description:
      "Call this as the FINAL step after executing all remediation actions to confirm " +
      "the autonomous fix is complete and generate a structured incident resolution report. " +
      "Summarize every action taken, the cluster, the incident ID, estimated MTTR, and final system status. " +
      "Always call this after execute_remediation and remember_remediation to close the remediation loop.",
    schema: z.object({
      incidentId: z
        .string()
        .describe("Primary incident ID, e.g. 'inc_0299'."),
      clusterId: z
        .string()
        .describe("Cluster where remediation was applied, e.g. 'prod-us-east-1'."),
      actionsTaken: z
        .array(z.string())
        .describe(
          "Ordered list of actions executed, e.g. " +
          "['Logs revisados: circuit breaker abierto por DB', 'Conexiones idle eliminadas (47)', 'Pod payment-service reiniciado'].",
        ),
      systemStatus: z
        .enum(["stable", "degraded", "recovering"])
        .describe(
          "stable = all metrics within thresholds; " +
          "degraded = partially mitigated, still monitoring; " +
          "recovering = actions applied, waiting for metrics to normalize.",
        ),
      mttrMinutes: z
        .number()
        .describe("Estimated time from incident detection to remediation completion, in minutes."),
    }),
  },
);
