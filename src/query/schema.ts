/**
 * Plain-language descriptions of the structured collections, fed to the model
 * so it generates better MongoDB pipelines. This is a PROMPT AID, not a gate:
 * it improves query quality; it does not validate or restrict anything.
 *
 * ---------------------------------------------------------------------------
 * ADAPTING THIS FILE TO YOUR DATA
 *
 * This is the highest-leverage file for a structured or hybrid team. The model
 * writes its pipeline from this text alone; it never sees your documents. A
 * vague description here produces confidently wrong answers, which is the
 * failure mode that costs the most time to notice.
 *
 * Replace ALERT_EVENTS_DESCRIPTION with your own, and cover five things:
 *
 * 1. One line saying what a single document IS. "One document per support
 *    ticket" tells the model whether to count documents or group them.
 * 2. Every field the model may need, with its type. Call out Date fields and
 *    anything stored differently from how people say it: cents vs dollars,
 *    seconds vs milliseconds, ids vs display names.
 * 3. Enum values verbatim. The model cannot guess that you write "IN_PROGRESS"
 *    and not "in progress", and a wrong literal silently matches nothing.
 * 4. Guidance mapping the questions you actually expect to the fields that
 *    answer them. "Open tickets" means status in X and Y, not resolvedAt null.
 *    Two or three of these are worth more than any amount of field detail.
 * 5. The traps. Anything where the obvious pipeline is wrong: soft-deleted rows
 *    that must be filtered out, a status that looks final but is not, a field
 *    that is null for a whole class of records.
 *
 * Write it for a competent new colleague who has never seen your data. If a
 * sentence would not help them, it will not help the model.
 *
 * The Phase 1 prompts have Claude Code write this for you. Read what it wrote:
 * it can infer 1 through 3 from your data, but only your team knows 4 and 5.
 * ---------------------------------------------------------------------------
 *
 * The enums here are the single source of truth, imported by the synthetic data
 * generator so the data and the description never drift.
 *
 * BILINGUAL NOTE: this description stays in English in every language, on
 * purpose, not by oversight. It is almost entirely field names, enum values, and
 * pipeline guidance; models read it fine cross-lingually, and translating it
 * would risk drifting against the generator that imports these enums. Only the
 * surrounding prompt prose in src/query/prompts/ is localised, which is enough
 * to get a Spanish `explanation` back.
 */

export const ALERT_TYPES = [
  "HIGH_LATENCY",
  "HTTP_500",
  "OOM_KILLED",
  "CONNECTION_POOL_EXHAUSTED",
  "POD_RESTART",
  "CPU_THROTTLING",
] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export const SEVERITIES = ["P1", "P2", "P3"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const ALERT_STATUSES = ["ACTIVE", "INVESTIGATING", "RESOLVED"] as const;
export type AlertStatus = (typeof ALERT_STATUSES)[number];

export const CLUSTER_IDS = ["prod-us-east-1", "prod-us-west-2"] as const;
export type ClusterId = (typeof CLUSTER_IDS)[number];

/**
 * Alert types that may carry P1 severity. P2 and P3 are valid for all six types;
 * P1 is restricted to these three. Used by the generator and by load-time
 * assertions to keep severity and alertType consistent.
 */
export const P1_ALERT_TYPES = [
  "HIGH_LATENCY",
  "HTTP_500",
  "CONNECTION_POOL_EXHAUSTED",
] as const satisfies readonly AlertType[];

export const P1_ALERT_TYPE_SET: ReadonlySet<AlertType> = new Set<AlertType>(P1_ALERT_TYPES);

const ALERT_EVENTS_DESCRIPTION = `Collection: alert_events
One document per monitoring alert fired by a microservice in production. Fields:
  _id               string   stable id like "inc_0001"
  serviceId         string   machine identifier of the affected service,
                             e.g. "payment-service", "postgres-main", "orders-api", "auth-service"
  serviceName       string   readable service name, e.g. "Payment Service"
  alertType         string   one of: ${ALERT_TYPES.join(", ")}
  metricValue       number   observed metric value: ms for HIGH_LATENCY; percent (0-100)
                             for CPU_THROTTLING and OOM_KILLED; integer count for HTTP_500
                             and POD_RESTART; connection count for CONNECTION_POOL_EXHAUSTED.
  threshold         number   configured threshold the metric exceeded; same units as metricValue.
  severity          string   one of: ${SEVERITIES.join(", ")}
                             P1 is only assigned to HIGH_LATENCY, HTTP_500, and
                             CONNECTION_POOL_EXHAUSTED alerts.
  status            string   one of: ${ALERT_STATUSES.join(", ")}
                             State machine: ACTIVE -> INVESTIGATING -> RESOLVED.
  clusterId         string   one of: ${CLUSTER_IDS.join(", ")}
  timestamp         Date     BSON date when the alert fired (UTC)
  investigatingAt   Date     BSON date when the alert entered INVESTIGATING; null if not yet.
  resolvedAt        Date     BSON date when the alert was resolved; null if not yet resolved.

Guidance for pipelines:
  - "which service has the most P1 alerts" => $match severity:"P1", $group by serviceId,
    $sort count desc. For ACTIVE only, also filter status:"ACTIVE".
  - "alerts right now" or "current alerts" => $match status:"ACTIVE".
    ACTIVE means no investigation has started; the service is still degraded.
  - "in progress" or "being investigated" => $match status:"INVESTIGATING".
  - "average resolution time" => $match resolvedAt non-null, $project
    {resolutionMs:{$subtract:["$resolvedAt","$timestamp"]}}, $group with $avg.
    Divide ms by 60000 to get minutes.
  - "P1 incidents this month" => $match severity:"P1" plus timestamp within the
    current calendar month using $$NOW:
    {"$match":{"$expr":{"$gte":["$timestamp",{"$dateTrunc":{"date":"$$NOW","unit":"month"}}]}}}
  - timestamp, investigatingAt, and resolvedAt are real BSON Dates. Always write
    date literals as Extended JSON: {"$date":"2026-08-01T00:00:00Z"}.
    A bare string never matches a BSON Date.
  - investigatingAt and resolvedAt are null when the alert has not entered that phase.
    Always filter {resolvedAt:{$ne:null}} before computing resolvedAt - timestamp,
    or the subtraction returns null and skews aggregations.
  - Do not assume "resolved" means resolvedAt equals timestamp; the gap is
    typically minutes to hours. Use $subtract to compute durations.`;

/**
 * Return a plain-language description of the target collection for the query
 * prompt. Unknown collections get a generic note so teams can point the tool at
 * their own data without editing this file first.
 */
export function describeCollection(name: string): string {
  if (name === "alert_events") return ALERT_EVENTS_DESCRIPTION;
  // Falling through to this generic note means the model is guessing at your
  // fields. It usually still answers, which is exactly why this is easy to miss.
  // Register your collection above, following the checklist at the top.
  return `Collection: ${name}\n(No schema description registered. Infer fields and types from the question; prefer a conservative read-only pipeline.)`;
}
