import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getDb } from "../db/client";
import { getConfig } from "../config";

/**
 * Pure chain-building logic. Exported for unit tests.
 *
 * Groups `sorted` items into contiguous chains where the gap between
 * consecutive items is <= `windowMs`. Chains with only one item (isolated
 * alerts) are NOT included — callers handle them as the `isolatedCount`.
 */
export function buildAlertChains<T>(
  sorted: T[],
  windowMs: number,
  getTimestamp: (item: T) => Date,
): T[][] {
  if (sorted.length === 0) return [];
  const chains: T[][] = [];
  let chain: T[] = [sorted[0]!];
  for (let i = 1; i < sorted.length; i++) {
    const prev = chain[chain.length - 1]!;
    const curr = sorted[i]!;
    const gap = getTimestamp(curr).getTime() - getTimestamp(prev).getTime();
    if (gap <= windowMs) {
      chain.push(curr);
    } else {
      if (chain.length > 1) chains.push(chain);
      chain = [curr];
    }
  }
  if (chain.length > 1) chains.push(chain);
  return chains;
}

/**
 * Finds P1 alerts that fired close together in the same cluster.
 *
 * Groups alerts into "chains" where consecutive alerts (by timestamp) fired
 * within `windowMinutes` of each other. A chain with more than one alert
 * indicates a cascade failure — multiple services degrading in quick succession
 * from a common root cause. Use this tool when an incident may involve
 * correlated failures across services in the same cluster.
 */
export const correlateAlerts = tool(
  async ({ clusterId, severity, windowMinutes = 15, lookbackHours = 24 }): Promise<string> => {
    const cfg = getConfig();
    const db = await getDb();
    const collection = db.collection(cfg.EVENTS_COLLECTION);

    const cutoff = new Date(Date.now() - lookbackHours * 3_600_000);

    const alerts = await collection
      .find(
        { clusterId, severity: severity ?? "P1", timestamp: { $gte: cutoff } },
        {
          projection: {
            _id: 1,
            serviceId: 1,
            serviceName: 1,
            alertType: 1,
            metricValue: 1,
            threshold: 1,
            severity: 1,
            status: 1,
            clusterId: 1,
            timestamp: 1,
            rootCauseCategory: 1,
          },
        },
      )
      .sort({ timestamp: 1 })
      .toArray();

    if (alerts.length === 0) {
      return JSON.stringify({
        clusterId,
        windowMinutes,
        lookbackHours,
        correlatedChains: [],
        isolatedAlerts: 0,
        summary: `No ${severity ?? "P1"} alerts found in ${clusterId} within the last ${lookbackHours} hours.`,
      });
    }

    const windowMs = windowMinutes * 60_000;
    type AlertRow = (typeof alerts)[number];
    const chains = buildAlertChains<AlertRow>(alerts, windowMs, (a) => a["timestamp"] as Date);

    const isolatedCount = alerts.length - chains.reduce((s, c) => s + c.length, 0);

    return JSON.stringify(
      {
        clusterId,
        windowMinutes,
        lookbackHours,
        totalP1AlertsFound: alerts.length,
        correlatedChains: chains.map((c) => ({
          alertCount: c.length,
          services: [...new Set(c.map((a) => a["serviceId"] as string))],
          spanMinutes: Math.round(
            ((c[c.length - 1]!["timestamp"] as Date).getTime() -
              (c[0]!["timestamp"] as Date).getTime()) /
              60_000,
          ),
          alerts: c.map((a) => ({
            _id: a["_id"],
            serviceId: a["serviceId"],
            alertType: a["alertType"],
            severity: a["severity"],
            status: a["status"],
            timestamp: a["timestamp"],
            rootCauseCategory: (a["rootCauseCategory"] as string | null) ?? null,
          })),
        })),
        isolatedAlerts: isolatedCount,
        summary:
          chains.length > 0
            ? `Found ${chains.length} cascade chain(s) of ${severity ?? "P1"} alerts in ${clusterId} within a ${windowMinutes}-minute window. ` +
              `Largest chain has ${Math.max(...chains.map((c) => c.length))} alerts across ` +
              `${Math.max(...chains.map((c) => new Set(c.map((a) => a["serviceId"])).size))} service(s).`
            : `No cascade chains detected in ${clusterId}. ${isolatedCount} isolated ${severity ?? "P1"} alert(s) found.`,
      },
      null,
      2,
    );
  },
  {
    name: "correlate_alerts",
    description:
      "Find P1 alerts that fired close together in the same cluster to detect cascade failures. " +
      "Groups alerts into chains where consecutive alerts fired within windowMinutes of each other. " +
      "A chain with multiple services indicates a cross-service degradation from a common root cause. " +
      "Use this when investigating an active incident to understand whether a single service is failing " +
      "or whether a cascade is propagating through the cluster.",
    schema: z.object({
      clusterId: z
        .string()
        .describe(
          "Kubernetes cluster to search, e.g. 'prod-us-east-1' or 'prod-us-west-2'.",
        ),
      severity: z
        .enum(["P1", "P2", "P3"])
        .optional()
        .describe("Severity level to filter alerts. Default: P1."),
      windowMinutes: z
        .number()
        .int()
        .positive()
        .optional()
        .describe(
          "Maximum gap in minutes between consecutive alerts to consider them correlated. Default: 15.",
        ),
      lookbackHours: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("How many hours back to search for alerts. Default: 24."),
    }),
  },
);
