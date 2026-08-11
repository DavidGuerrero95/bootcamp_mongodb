import {
  ALERT_TYPES,
  SEVERITIES,
  ALERT_STATUSES,
  CLUSTER_IDS,
  ROOT_CAUSE_CATEGORIES,
  P1_ALERT_TYPES,
  P1_ALERT_TYPE_SET,
  type AlertType,
  type Severity,
  type AlertStatus,
  type ClusterId,
  type RootCauseCategory,
} from "../../src/query/schema";

/**
 * Synthetic, internally consistent monitoring alert events for microservices.
 *
 * Deterministic: a fixed seed produces the same dataset every run, so the
 * verify script can assert exact answers. The generator seeds one anchor record
 * per verifiable fact from data/mock-input/collection.md, then ASSERTS every
 * fact and every consistency rule before returning. If any assertion fails, load
 * stops with a clear error message.
 *
 * All values are synthetic. No real infrastructure data.
 *
 * Filler records are always P2 or P3 and never INVESTIGATING, which keeps all
 * P1 counts and INVESTIGATING counts under tight generator control.
 */

export interface AlertEvent {
  _id: string;
  serviceId: string;
  serviceName: string;
  alertType: AlertType;
  metricValue: number;
  threshold: number;
  severity: Severity;
  status: AlertStatus;
  clusterId: ClusterId;
  timestamp: Date;
  investigatingAt: Date | null;
  resolvedAt: Date | null;
  /** null on ACTIVE alerts; assigned once the team begins INVESTIGATING or resolves. */
  rootCauseCategory: RootCauseCategory | null;
}

const SERVICES = [
  { serviceId: "payment-service", serviceName: "Payment Service" },
  { serviceId: "postgres-main", serviceName: "Main Database" },
  { serviceId: "orders-api", serviceName: "Orders API" },
  { serviceId: "auth-service", serviceName: "Auth Service" },
  { serviceId: "inventory-service", serviceName: "Inventory Service" },
  { serviceId: "notification-service", serviceName: "Notification Service" },
] as const;

const SEED = 424242;
/** Filler count: 300 total - 11 anchors = 289 filler records. */
const FILLER_COUNT = 289;
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MIN_MS = 60_000;

/**
 * Canonical root cause for each alert type, used when a record transitions to
 * INVESTIGATING or RESOLVED. Deterministic — no rng call needed.
 */
function rootCauseForAlertType(alertType: AlertType): RootCauseCategory {
  switch (alertType) {
    case "HIGH_LATENCY": return "resource_exhaustion";
    case "HTTP_500": return "code_defect";
    case "OOM_KILLED": return "resource_exhaustion";
    case "CONNECTION_POOL_EXHAUSTED": return "resource_exhaustion";
    case "POD_RESTART": return "configuration_drift";
    case "CPU_THROTTLING": return "resource_exhaustion";
  }
}

/** Configured alert thresholds by alertType (same units as metricValue). */
const THRESHOLDS: Record<AlertType, number> = {
  HIGH_LATENCY: 500, // ms
  HTTP_500: 50, // error count
  OOM_KILLED: 75, // percent
  CONNECTION_POOL_EXHAUSTED: 80, // connection count
  POD_RESTART: 3, // restart count
  CPU_THROTTLING: 75, // percent
};

/** Small deterministic PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  const item = arr[Math.floor(rng() * arr.length)];
  if (item === undefined) throw new Error("pick from empty array");
  return item;
}

function startOfMonthUTC(now: Date): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
}

/**
 * Observed metric value above the configured threshold. Units match THRESHOLDS.
 * Each alertType consumes exactly one rng call.
 */
function observedMetric(rng: () => number, alertType: AlertType): number {
  const t = THRESHOLDS[alertType];
  switch (alertType) {
    case "HIGH_LATENCY":
      return t + Math.floor(rng() * 4500) + 100; // 600–5100 ms
    case "HTTP_500":
      return t + Math.floor(rng() * 450) + 10; // 60–510 errors
    case "OOM_KILLED":
      return t + Math.floor(rng() * 24) + 1; // 76–99 %
    case "CONNECTION_POOL_EXHAUSTED":
      return t + Math.floor(rng() * 120) + 1; // 81–200 connections
    case "POD_RESTART":
      return t + Math.floor(rng() * 17) + 1; // 4–20 restarts
    case "CPU_THROTTLING":
      return t + Math.floor(rng() * 24) + 1; // 76–99 %
  }
}

// ---- Draft type for records before IDs are assigned ----------------------

/** Record whose _id may be pre-assigned (anchors inc_0051/inc_0052) or pending. */
type PreAssignedDraft = AlertEvent; // _id already set
type RegularDraft = Omit<AlertEvent, "_id">;

function buildEvents(now: Date): AlertEvent[] {
  const rng = mulberry32(SEED);
  const SOM = startOfMonthUTC(now);

  const preAssigned: PreAssignedDraft[] = [];
  const regular: RegularDraft[] = [];

  // ---- Anchors: Verifiable Facts 1 + 2 ------------------------------------
  //
  // Fact 1: payment-service has exactly 3 P1 ACTIVE alerts in the last 2 h.
  // Fact 2: inc_0051 (payment-service, HIGH_LATENCY, P1, ACTIVE) and
  //         inc_0052 (postgres-main, CONNECTION_POOL_EXHAUSTED, P1, ACTIVE)
  //         are < 5 min apart, both in prod-us-east-1.
  //
  // inc_0051 is one of the three payment-service P1 ACTIVE anchors.

  preAssigned.push({
    _id: "inc_0051",
    serviceId: "payment-service",
    serviceName: "Payment Service",
    alertType: "HIGH_LATENCY",
    metricValue: 1420,
    threshold: THRESHOLDS.HIGH_LATENCY,
    severity: "P1",
    status: "ACTIVE",
    clusterId: "prod-us-east-1",
    timestamp: new Date(now.getTime() - 10 * MIN_MS),
    investigatingAt: null,
    resolvedAt: null,
    rootCauseCategory: null,
  });

  preAssigned.push({
    _id: "inc_0052",
    serviceId: "postgres-main",
    serviceName: "Main Database",
    alertType: "CONNECTION_POOL_EXHAUSTED",
    metricValue: 97,
    threshold: THRESHOLDS.CONNECTION_POOL_EXHAUSTED,
    severity: "P1",
    status: "ACTIVE",
    clusterId: "prod-us-east-1",
    timestamp: new Date(now.getTime() - 7 * MIN_MS), // 3 min after inc_0051
    investigatingAt: null,
    resolvedAt: null,
    rootCauseCategory: null,
  });

  // Two more payment-service P1 ACTIVE (+ inc_0051 = exactly 3 for Fact 1).
  regular.push({
    serviceId: "payment-service",
    serviceName: "Payment Service",
    alertType: "HTTP_500",
    metricValue: 312,
    threshold: THRESHOLDS.HTTP_500,
    severity: "P1",
    status: "ACTIVE",
    clusterId: "prod-us-east-1",
    timestamp: new Date(now.getTime() - 75 * MIN_MS),
    investigatingAt: null,
    resolvedAt: null,
    rootCauseCategory: null,
  });

  regular.push({
    serviceId: "payment-service",
    serviceName: "Payment Service",
    alertType: "HIGH_LATENCY",
    metricValue: 2150,
    threshold: THRESHOLDS.HIGH_LATENCY,
    severity: "P1",
    status: "ACTIVE",
    clusterId: "prod-us-west-2",
    timestamp: new Date(now.getTime() - 45 * MIN_MS),
    investigatingAt: null,
    resolvedAt: null,
    rootCauseCategory: null,
  });

  // ---- Anchors: Verifiable Fact 3 -----------------------------------------
  //
  // Exactly 3 P1 RESOLVED incidents this calendar month, with resolution times
  // of 30 min, 40 min, and 41 min (sum 111 min, average exactly 37 min).
  // Timestamps are placed early in the month (SOM + 2 h / 26 h / 50 h) so they
  // are well before any reasonable "now" when the demo runs.

  const res1Ts = new Date(SOM + 2 * HOUR_MS);
  regular.push({
    serviceId: "auth-service",
    serviceName: "Auth Service",
    alertType: "HIGH_LATENCY",
    metricValue: 1800,
    threshold: THRESHOLDS.HIGH_LATENCY,
    severity: "P1",
    status: "RESOLVED",
    clusterId: "prod-us-east-1",
    timestamp: res1Ts,
    investigatingAt: new Date(res1Ts.getTime() + 5 * MIN_MS),
    resolvedAt: new Date(res1Ts.getTime() + 30 * MIN_MS),
    rootCauseCategory: "resource_exhaustion", // HIGH_LATENCY caused by DB saturation
  });

  const res2Ts = new Date(SOM + 26 * HOUR_MS);
  regular.push({
    serviceId: "orders-api",
    serviceName: "Orders API",
    alertType: "HTTP_500",
    metricValue: 425,
    threshold: THRESHOLDS.HTTP_500,
    severity: "P1",
    status: "RESOLVED",
    clusterId: "prod-us-west-2",
    timestamp: res2Ts,
    investigatingAt: new Date(res2Ts.getTime() + 8 * MIN_MS),
    resolvedAt: new Date(res2Ts.getTime() + 40 * MIN_MS),
    rootCauseCategory: "code_defect", // HTTP 500 traced to a bad deploy
  });

  const res3Ts = new Date(SOM + 50 * HOUR_MS);
  regular.push({
    serviceId: "payment-service",
    serviceName: "Payment Service",
    alertType: "CONNECTION_POOL_EXHAUSTED",
    metricValue: 153,
    threshold: THRESHOLDS.CONNECTION_POOL_EXHAUSTED,
    severity: "P1",
    status: "RESOLVED",
    clusterId: "prod-us-east-1",
    timestamp: res3Ts,
    investigatingAt: new Date(res3Ts.getTime() + 10 * MIN_MS),
    resolvedAt: new Date(res3Ts.getTime() + 41 * MIN_MS),
    rootCauseCategory: "resource_exhaustion", // connection pool undersized for traffic spike
  });

  // ---- Anchors: Verifiable Fact 4 -----------------------------------------
  //
  // Exactly 4 INVESTIGATING records across at least 2 different services.
  // All P2/P3; OOM_KILLED and POD_RESTART/CPU_THROTTLING are fine for those.

  regular.push({
    serviceId: "payment-service",
    serviceName: "Payment Service",
    alertType: "CPU_THROTTLING",
    metricValue: 92,
    threshold: THRESHOLDS.CPU_THROTTLING,
    severity: "P2",
    status: "INVESTIGATING",
    clusterId: "prod-us-east-1",
    timestamp: new Date(now.getTime() - 3 * DAY_MS - 4 * HOUR_MS),
    investigatingAt: new Date(now.getTime() - 3 * DAY_MS - 3 * HOUR_MS),
    resolvedAt: null,
    rootCauseCategory: rootCauseForAlertType("CPU_THROTTLING"),
  });

  regular.push({
    serviceId: "orders-api",
    serviceName: "Orders API",
    alertType: "POD_RESTART",
    metricValue: 7,
    threshold: THRESHOLDS.POD_RESTART,
    severity: "P2",
    status: "INVESTIGATING",
    clusterId: "prod-us-west-2",
    timestamp: new Date(now.getTime() - 3 * DAY_MS - 2 * HOUR_MS),
    investigatingAt: new Date(now.getTime() - 3 * DAY_MS - 1 * HOUR_MS),
    resolvedAt: null,
    rootCauseCategory: rootCauseForAlertType("POD_RESTART"),
  });

  regular.push({
    serviceId: "auth-service",
    serviceName: "Auth Service",
    alertType: "OOM_KILLED",
    metricValue: 89,
    threshold: THRESHOLDS.OOM_KILLED,
    severity: "P3",
    status: "INVESTIGATING",
    clusterId: "prod-us-east-1",
    timestamp: new Date(now.getTime() - 2 * DAY_MS - 3 * HOUR_MS),
    investigatingAt: new Date(now.getTime() - 2 * DAY_MS - 2 * HOUR_MS),
    resolvedAt: null,
    rootCauseCategory: rootCauseForAlertType("OOM_KILLED"),
  });

  regular.push({
    serviceId: "postgres-main",
    serviceName: "Main Database",
    alertType: "CPU_THROTTLING",
    metricValue: 88,
    threshold: THRESHOLDS.CPU_THROTTLING,
    severity: "P3",
    status: "INVESTIGATING",
    clusterId: "prod-us-west-2",
    timestamp: new Date(now.getTime() - 2 * DAY_MS - 1 * HOUR_MS),
    investigatingAt: new Date(now.getTime() - 2 * DAY_MS),
    resolvedAt: null,
    rootCauseCategory: rootCauseForAlertType("CPU_THROTTLING"),
  });

  // ---- Filler records ------------------------------------------------------
  //
  // Always P2 or P3, never INVESTIGATING. Timestamps start at least 3 h before
  // now (avoiding the last-2-h window used by Fact 1) and spread across the
  // past 30 days. Resolved filler records always have investigatingAt set and
  // investigatingAt < resolvedAt.

  const FILLER_SVRTS = ["P2", "P3"] as const satisfies readonly Severity[];
  const FILLER_STATS = ["ACTIVE", "RESOLVED"] as const satisfies readonly AlertStatus[];

  for (let i = 0; i < FILLER_COUNT; i++) {
    const svc = pick(rng, SERVICES);
    const severity = pick(rng, FILLER_SVRTS);
    const alertType = pick(rng, ALERT_TYPES);
    const status = pick(rng, FILLER_STATS);
    const clusterId = pick(rng, CLUSTER_IDS);
    // Timestamp: at least 3 h old, spread across last 30 days.
    const tsOffsetMs =
      Math.floor(rng() * 30) * DAY_MS +
      Math.floor(rng() * DAY_MS) +
      3 * HOUR_MS;
    const timestamp = new Date(now.getTime() - tsOffsetMs);
    const metric = observedMetric(rng, alertType);

    let investigatingAt: Date | null = null;
    let resolvedAt: Date | null = null;

    if (status === "RESOLVED") {
      const resolutionMs = (Math.floor(rng() * 240) + 10) * MIN_MS; // 10–250 min
      // investigatingAt is in the first half of the resolution window (>= 1 min after alert).
      const investigatingOffsetMs =
        Math.floor(rng() * (resolutionMs / 2 - MIN_MS)) + MIN_MS;
      investigatingAt = new Date(timestamp.getTime() + investigatingOffsetMs);
      resolvedAt = new Date(timestamp.getTime() + resolutionMs);
    }

    regular.push({
      serviceId: svc.serviceId,
      serviceName: svc.serviceName,
      alertType,
      metricValue: metric,
      threshold: THRESHOLDS[alertType],
      severity,
      status,
      clusterId,
      timestamp,
      investigatingAt,
      resolvedAt,
      rootCauseCategory: status === "RESOLVED" ? rootCauseForAlertType(alertType) : null,
    });
  }

  // ---- ID assignment -------------------------------------------------------
  //
  // Pre-assigned records keep inc_0051 / inc_0052. All others are sorted by
  // timestamp and assigned inc_0001 … inc_0300 in order, skipping the reserved
  // IDs so the total remains exactly 300 unique, sequential identifiers.

  const reservedIds = new Set(preAssigned.map((d) => d._id));
  regular.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  let counter = 1;
  const assigned: AlertEvent[] = [];
  for (const draft of regular) {
    const padded = () => `inc_${String(counter).padStart(4, "0")}`;
    while (reservedIds.has(padded())) counter++;
    assigned.push({ _id: padded(), ...draft });
    counter++;
  }

  return [...preAssigned, ...assigned];
}

// ---- Expectations -----------------------------------------------------------

export interface Expectations {
  totalEvents: number;
  /**
   * Number of P1 ACTIVE alerts for payment-service (all time, not windowed).
   * Stable: filler never generates P1, so this equals the anchor count = 3.
   */
  paymentServiceP1ActiveCount: number;
  /** The correlated anchor pair (Fact 2). */
  correlatedPair: {
    first: { _id: string; serviceId: string; clusterId: string };
    second: { _id: string; serviceId: string; clusterId: string };
    diffMs: number;
  };
  /** P1 RESOLVED facts for this calendar month (Fact 3). */
  p1ResolvedThisMonth: {
    count: number;
    resolutionMinutes: [number, number, number];
    avgResolutionMinutes: number;
  };
  /** Count of INVESTIGATING incidents (Fact 4). */
  investigatingCount: number;
  /** How many P1 RESOLVED this month have rootCauseCategory "resource_exhaustion" (Fact 5). */
  p1ResourceExhaustionThisMonth: number;
  /** ID of an anchor record suitable for the hybrid assess demo. */
  assessSubjectId: string;
}

/** Derive the verifiable facts from a generated event set. */
export function computeExpectations(events: AlertEvent[], now: Date = new Date()): Expectations {
  const SOM = startOfMonthUTC(now);

  const paymentP1Active = events.filter(
    (e) => e.serviceId === "payment-service" && e.severity === "P1" && e.status === "ACTIVE",
  );

  const inc51 = events.find((e) => e._id === "inc_0051");
  const inc52 = events.find((e) => e._id === "inc_0052");
  if (!inc51 || !inc52) throw new Error("inc_0051 or inc_0052 missing; generator broken.");

  const p1Resolved = events.filter(
    (e) =>
      e.severity === "P1" && e.status === "RESOLVED" && e.timestamp.getTime() >= SOM,
  );

  const resolutionMins = p1Resolved
    .map((e) => (e.resolvedAt !== null ? (e.resolvedAt.getTime() - e.timestamp.getTime()) / MIN_MS : 0))
    .sort((a, b) => a - b);

  const [m0 = 0, m1 = 0, m2 = 0] = resolutionMins;

  const investigating = events.filter((e) => e.status === "INVESTIGATING");
  const p1ResourceExhaustion = p1Resolved.filter((e) => e.rootCauseCategory === "resource_exhaustion");

  return {
    totalEvents: events.length,
    paymentServiceP1ActiveCount: paymentP1Active.length,
    correlatedPair: {
      first: { _id: inc51._id, serviceId: inc51.serviceId, clusterId: inc51.clusterId },
      second: { _id: inc52._id, serviceId: inc52.serviceId, clusterId: inc52.clusterId },
      diffMs: Math.abs(inc51.timestamp.getTime() - inc52.timestamp.getTime()),
    },
    p1ResolvedThisMonth: {
      count: p1Resolved.length,
      resolutionMinutes: [m0, m1, m2],
      avgResolutionMinutes:
        resolutionMins.length > 0
          ? resolutionMins.reduce((s, m) => s + m, 0) / resolutionMins.length
          : 0,
    },
    investigatingCount: investigating.length,
    p1ResourceExhaustionThisMonth: p1ResourceExhaustion.length,
    assessSubjectId: "inc_0051",
  };
}

/**
 * Generate the synthetic alert events and assert internal consistency. Throws if
 * any verifiable fact or consistency rule is violated so callers never load bad
 * data.
 */
export function generateAlertEvents(now: Date = new Date()): AlertEvent[] {
  const events = buildEvents(now);
  const SOM = startOfMonthUTC(now);
  const twoHoursAgo = now.getTime() - 2 * HOUR_MS;

  // ---- Consistency rules (all records) -------------------------------------

  for (const e of events) {
    // Enum guards
    if (!ALERT_TYPES.includes(e.alertType))
      throw new Error(`${e._id}: unknown alertType "${e.alertType}"`);
    if (!SEVERITIES.includes(e.severity))
      throw new Error(`${e._id}: unknown severity "${e.severity}"`);
    if (!ALERT_STATUSES.includes(e.status))
      throw new Error(`${e._id}: unknown status "${e.status}"`);
    if (!CLUSTER_IDS.includes(e.clusterId))
      throw new Error(`${e._id}: unknown clusterId "${e.clusterId}"`);

    // P1 only for allowed alertTypes
    if (e.severity === "P1" && !P1_ALERT_TYPE_SET.has(e.alertType))
      throw new Error(
        `${e._id}: P1 severity with alertType "${e.alertType}" is not allowed (only HIGH_LATENCY, HTTP_500, CONNECTION_POOL_EXHAUSTED)`,
      );

    // rootCauseCategory must be null on ACTIVE; non-null once investigating/resolved
    if (e.status === "ACTIVE" && e.rootCauseCategory !== null)
      throw new Error(`${e._id}: ACTIVE record must have null rootCauseCategory`);
    if ((e.status === "INVESTIGATING" || e.status === "RESOLVED") && e.rootCauseCategory === null)
      throw new Error(`${e._id}: ${e.status} record must have a non-null rootCauseCategory`);
    if (e.rootCauseCategory !== null && !(ROOT_CAUSE_CATEGORIES as readonly string[]).includes(e.rootCauseCategory))
      throw new Error(`${e._id}: unknown rootCauseCategory "${e.rootCauseCategory}"`);

    // Status / timestamp invariants
    if (e.status === "RESOLVED" && e.resolvedAt === null)
      throw new Error(`${e._id}: RESOLVED record has null resolvedAt`);
    if (e.status === "INVESTIGATING") {
      if (e.investigatingAt === null)
        throw new Error(`${e._id}: INVESTIGATING record has null investigatingAt`);
      if (e.resolvedAt !== null)
        throw new Error(`${e._id}: INVESTIGATING record has non-null resolvedAt`);
    }
    if (e.status === "ACTIVE") {
      if (e.investigatingAt !== null)
        throw new Error(`${e._id}: ACTIVE record has non-null investigatingAt`);
      if (e.resolvedAt !== null)
        throw new Error(`${e._id}: ACTIVE record has non-null resolvedAt`);
    }

    // investigatingAt < resolvedAt when both present
    if (e.investigatingAt !== null && e.resolvedAt !== null) {
      if (e.investigatingAt.getTime() >= e.resolvedAt.getTime())
        throw new Error(`${e._id}: investigatingAt >= resolvedAt`);
    }
  }

  // ---- Verifiable Fact 1 ---------------------------------------------------
  // payment-service has exactly 3 P1 ACTIVE alerts within the last 2 h; no other
  // service exceeds 2.

  const p1ActiveIn2h = events.filter(
    (e) => e.severity === "P1" && e.status === "ACTIVE" && e.timestamp.getTime() >= twoHoursAgo,
  );

  const byService = new Map<string, number>();
  for (const e of p1ActiveIn2h) {
    byService.set(e.serviceId, (byService.get(e.serviceId) ?? 0) + 1);
  }

  const paymentCount = byService.get("payment-service") ?? 0;
  if (paymentCount !== 3)
    throw new Error(
      `Fact 1: payment-service has ${paymentCount} P1 ACTIVE in last 2 h, expected 3`,
    );

  for (const [svcId, count] of byService) {
    if (svcId !== "payment-service" && count > 2)
      throw new Error(
        `Fact 1: service "${svcId}" has ${count} P1 ACTIVE in last 2 h (max allowed for non-payment-service is 2)`,
      );
  }

  // ---- Verifiable Fact 2 ---------------------------------------------------
  // inc_0051 and inc_0052 exist, are < 5 min apart, both in prod-us-east-1.

  const inc51 = events.find((e) => e._id === "inc_0051");
  const inc52 = events.find((e) => e._id === "inc_0052");
  if (!inc51) throw new Error("Fact 2: inc_0051 not found");
  if (!inc52) throw new Error("Fact 2: inc_0052 not found");

  const diffMs = Math.abs(inc51.timestamp.getTime() - inc52.timestamp.getTime());
  if (diffMs >= 5 * MIN_MS)
    throw new Error(
      `Fact 2: inc_0051 and inc_0052 are ${diffMs / MIN_MS} min apart; expected < 5 min`,
    );
  if (inc51.clusterId !== "prod-us-east-1")
    throw new Error(`Fact 2: inc_0051 is in "${inc51.clusterId}", expected prod-us-east-1`);
  if (inc52.clusterId !== "prod-us-east-1")
    throw new Error(`Fact 2: inc_0052 is in "${inc52.clusterId}", expected prod-us-east-1`);

  // ---- Verifiable Fact 3 ---------------------------------------------------
  // Exactly 3 P1 RESOLVED this month; resolution times = 30, 40, 41 min (avg 37).

  const p1ResolvedThisMonth = events.filter(
    (e) =>
      e.severity === "P1" && e.status === "RESOLVED" && e.timestamp.getTime() >= SOM,
  );
  if (p1ResolvedThisMonth.length !== 3)
    throw new Error(
      `Fact 3: ${p1ResolvedThisMonth.length} P1 RESOLVED incidents this month, expected 3`,
    );

  const resMins = p1ResolvedThisMonth
    .map((e) =>
      e.resolvedAt !== null ? (e.resolvedAt.getTime() - e.timestamp.getTime()) / MIN_MS : 0,
    )
    .sort((a, b) => a - b);

  const [r0 = -1, r1 = -1, r2 = -1] = resMins;
  if (r0 !== 30 || r1 !== 40 || r2 !== 41)
    throw new Error(
      `Fact 3: resolution minutes are [${resMins.join(", ")}], expected [30, 40, 41]`,
    );

  const avg = resMins.reduce((s, m) => s + m, 0) / resMins.length;
  if (Math.abs(avg - 37) > 0.001)
    throw new Error(`Fact 3: average resolution time is ${avg} min, expected 37`);

  // ---- Verifiable Fact 4 ---------------------------------------------------
  // Exactly 4 INVESTIGATING, spanning at least 2 different services.

  const investigating = events.filter((e) => e.status === "INVESTIGATING");
  if (investigating.length !== 4)
    throw new Error(`Fact 4: ${investigating.length} INVESTIGATING records, expected 4`);

  const invServices = new Set(investigating.map((e) => e.serviceId));
  if (invServices.size < 2)
    throw new Error(
      `Fact 4: INVESTIGATING records only span ${invServices.size} service(s), expected >= 2`,
    );

  return events;
}

// Keep the old export name so existing callers (load.ts, verify.ts) can migrate
// at their own pace. Both names generate the same data.
export { generateAlertEvents as generateActivityEvents };
