import {
  ALERT_TYPES,
  SEVERITIES,
  ALERT_STATUSES,
  CLUSTER_IDS,
  NAMESPACES,
  MESH_ERRORS,
  ROOT_CAUSE_CATEGORIES,
  P1_ALERT_TYPES,
  P1_ALERT_TYPE_SET,
  NODE_ALERT_TYPE_SET,
  NODE_POOLS,
  INSTANCE_TYPES,
  DISRUPTION_REASONS,
  type AlertType,
  type Severity,
  type AlertStatus,
  type ClusterId,
  type Namespace,
  type MeshError,
  type NodePool,
  type InstanceType,
  type DisruptionReason,
  type RootCauseCategory,
} from "../../src/query/schema";

/**
 * Synthetic, internally consistent monitoring alert events for microservices
 * and Kubernetes nodes.
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
  namespace: Namespace;
  /** null for node-level alertTypes (SPOT_INTERRUPTION, NODE_NOT_READY, NODE_PRESSURE). */
  podName: string | null;
  alertType: AlertType;
  metricValue: number;
  threshold: number;
  severity: Severity;
  status: AlertStatus;
  clusterId: ClusterId;
  /** Non-null only for CIRCUIT_BREAKER_OPEN and SERVICE_MESH_TIMEOUT alertTypes. */
  meshError: MeshError | null;
  /** Non-null for all node-level alertTypes and for pod alerts caused by node eviction. */
  nodeId: string | null;
  /** EC2 instance type of the node. Non-null iff nodeId is non-null. */
  instanceType: InstanceType | null;
  /** Karpenter node pool. Non-null iff nodeId is non-null. */
  nodePool: NodePool | null;
  /** Karpenter disruption reason. Non-null only for SPOT_INTERRUPTION alerts. */
  disruptionReason: DisruptionReason | null;
  timestamp: Date;
  investigatingAt: Date | null;
  resolvedAt: Date | null;
  /** null on ACTIVE alerts; assigned once the team begins INVESTIGATING or resolves. */
  rootCauseCategory: RootCauseCategory | null;
}

// ---- Static data maps -------------------------------------------------------

const SERVICES = [
  { serviceId: "payment-service",      serviceName: "Payment Service",      namespace: "payments-ns" as Namespace, podName: "payment-service-7f4b8c-xk2mn" },
  { serviceId: "postgres-main",        serviceName: "Main Database",         namespace: "data-ns"     as Namespace, podName: "postgres-main-6d3a91-wj5pq"     },
  { serviceId: "orders-api",           serviceName: "Orders API",            namespace: "orders-ns"   as Namespace, podName: "orders-api-5c2f87-rv4nt"         },
  { serviceId: "auth-service",         serviceName: "Auth Service",          namespace: "auth-ns"     as Namespace, podName: "auth-service-8a1e45-bz7qw"       },
  { serviceId: "inventory-service",    serviceName: "Inventory Service",     namespace: "orders-ns"   as Namespace, podName: "inventory-service-3b9d62-hs8lc"  },
  { serviceId: "notification-service", serviceName: "Notification Service",  namespace: "platform-ns" as Namespace, podName: "notification-service-4e7c30-tp6rx" },
] as const;

/** Infrastructure service used for node-level alerts (no pod — the subject is the node). */
const KARPENTER_SVC = {
  serviceId: "karpenter",
  serviceName: "Karpenter Node Manager",
  namespace: "platform-ns" as Namespace,
  podName: null as null,
} as const;

const NODES = [
  { nodeId: "ip-10-0-1-245.ec2.internal", instanceType: "m5.2xlarge" as InstanceType, nodePool: "spot-workers"     as NodePool },
  { nodeId: "ip-10-0-2-118.ec2.internal", instanceType: "c5.4xlarge" as InstanceType, nodePool: "spot-workers"     as NodePool },
  { nodeId: "ip-10-0-3-092.ec2.internal", instanceType: "m5.xlarge"  as InstanceType, nodePool: "general-purpose"  as NodePool },
  { nodeId: "ip-10-0-4-207.ec2.internal", instanceType: "r5.xlarge"  as InstanceType, nodePool: "memory-optimized" as NodePool },
  { nodeId: "ip-10-0-5-163.ec2.internal", instanceType: "t3.medium"  as InstanceType, nodePool: "general-purpose"  as NodePool },
] as const;

/** The spot-worker node used by the anchor cascade (inc_0053/0054/0055). */
const ANCHOR_NODE = NODES[0];

const SEED = 424242;
/**
 * Filler count: 300 total - 14 anchors = 286 filler records.
 * Anchors: 5 pre-assigned (inc_0051–inc_0055) + 9 regular anchor records.
 */
const FILLER_COUNT = 286;
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MIN_MS = 60_000;

// ---- Domain helpers ---------------------------------------------------------

function rootCauseForAlertType(alertType: AlertType): RootCauseCategory {
  switch (alertType) {
    case "HIGH_LATENCY":             return "resource_exhaustion";
    case "HTTP_500":                 return "code_defect";
    case "OOM_KILLED":               return "resource_exhaustion";
    case "CONNECTION_POOL_EXHAUSTED":return "resource_exhaustion";
    case "POD_RESTART":              return "configuration_drift";
    case "CPU_THROTTLING":           return "resource_exhaustion";
    case "HTTP_4XX_SPIKE":           return "configuration_drift";
    case "CIRCUIT_BREAKER_OPEN":     return "dependency";
    case "SERVICE_MESH_TIMEOUT":     return "dependency";
    case "SPOT_INTERRUPTION":        return "node_disruption";
    case "NODE_NOT_READY":           return "node_disruption";
    case "NODE_PRESSURE":            return "node_disruption";
  }
}

/** meshError is non-null only for CIRCUIT_BREAKER_OPEN and SERVICE_MESH_TIMEOUT. */
function meshErrorForAlertType(alertType: AlertType): MeshError | null {
  switch (alertType) {
    case "CIRCUIT_BREAKER_OPEN": return "CIRCUIT_BREAKER_OPEN";
    case "SERVICE_MESH_TIMEOUT": return "TIMEOUT";
    default:                     return null;
  }
}

/** disruptionReason is non-null only for Karpenter-triggered SPOT_INTERRUPTION alerts. */
function disruptionReasonForAlertType(alertType: AlertType): DisruptionReason | null {
  return alertType === "SPOT_INTERRUPTION" ? "SPOT_INTERRUPTION" : null;
}

const THRESHOLDS: Record<AlertType, number> = {
  HIGH_LATENCY:              500,   // ms
  HTTP_500:                   50,   // error count
  OOM_KILLED:                 75,   // percent
  CONNECTION_POOL_EXHAUSTED:  80,   // connection count
  POD_RESTART:                 3,   // restart count
  CPU_THROTTLING:             75,   // percent
  HTTP_4XX_SPIKE:            200,   // request count
  CIRCUIT_BREAKER_OPEN:       60,   // percent error rate
  SERVICE_MESH_TIMEOUT:     2000,   // ms
  SPOT_INTERRUPTION:           0,   // pods affected (count); threshold = 0 (any interruption fires)
  NODE_NOT_READY:              2,   // minutes NotReady before alert fires
  NODE_PRESSURE:              80,   // percent (DiskPressure / MemoryPressure)
};

function observedMetric(rng: () => number, alertType: AlertType): number {
  const t = THRESHOLDS[alertType];
  switch (alertType) {
    case "HIGH_LATENCY":
      return t + Math.floor(rng() * 4500) + 100;  // 600–5100 ms
    case "HTTP_500":
      return t + Math.floor(rng() * 450)  + 10;   // 60–510 errors
    case "OOM_KILLED":
      return t + Math.floor(rng() * 24)   + 1;    // 76–99 %
    case "CONNECTION_POOL_EXHAUSTED":
      return t + Math.floor(rng() * 120)  + 1;    // 81–200 connections
    case "POD_RESTART":
      return t + Math.floor(rng() * 17)   + 1;    // 4–20 restarts
    case "CPU_THROTTLING":
      return t + Math.floor(rng() * 24)   + 1;    // 76–99 %
    case "HTTP_4XX_SPIKE":
      return t + Math.floor(rng() * 600)  + 10;   // 210–810 requests
    case "CIRCUIT_BREAKER_OPEN":
      return t + Math.floor(rng() * 39)   + 1;    // 61–99 % error rate
    case "SERVICE_MESH_TIMEOUT":
      return t + Math.floor(rng() * 6000) + 100;  // 2100–8100 ms
    case "SPOT_INTERRUPTION":
      return Math.floor(rng() * 18)       + 3;    // 3–20 pods on the reclaimed node
    case "NODE_NOT_READY":
      return t + Math.floor(rng() * 58)   + 1;    // 3–60 min NotReady
    case "NODE_PRESSURE":
      return t + Math.floor(rng() * 19)   + 1;    // 81–99 %
  }
}

// ---- PRNG -------------------------------------------------------------------

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

// ---- Draft types ------------------------------------------------------------

type PreAssignedDraft = AlertEvent;
type RegularDraft = Omit<AlertEvent, "_id">;

// ---- Builder ----------------------------------------------------------------

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
    namespace: "payments-ns",
    podName: "payment-service-7f4b8c-xk2mn",
    alertType: "HIGH_LATENCY",
    metricValue: 1420,
    threshold: THRESHOLDS.HIGH_LATENCY,
    severity: "P1",
    status: "ACTIVE",
    clusterId: "prod-us-east-1",
    meshError: null,
    nodeId: null, instanceType: null, nodePool: null, disruptionReason: null,
    timestamp: new Date(now.getTime() - 10 * MIN_MS),
    investigatingAt: null,
    resolvedAt: null,
    rootCauseCategory: null,
  });

  preAssigned.push({
    _id: "inc_0052",
    serviceId: "postgres-main",
    serviceName: "Main Database",
    namespace: "data-ns",
    podName: "postgres-main-6d3a91-wj5pq",
    alertType: "CONNECTION_POOL_EXHAUSTED",
    metricValue: 97,
    threshold: THRESHOLDS.CONNECTION_POOL_EXHAUSTED,
    severity: "P1",
    status: "ACTIVE",
    clusterId: "prod-us-east-1",
    meshError: null,
    nodeId: null, instanceType: null, nodePool: null, disruptionReason: null,
    timestamp: new Date(now.getTime() - 7 * MIN_MS),
    investigatingAt: null,
    resolvedAt: null,
    rootCauseCategory: null,
  });

  // ---- Anchors: Node disruption cascade (Fact 6) --------------------------
  //
  // inc_0053: Karpenter spot interruption on node ip-10-0-1-245 (m5.2xlarge,
  //           spot-workers pool). Fires 2 min before the pod restarts below.
  // inc_0054: payment-service POD_RESTART caused by node eviction.
  // inc_0055: orders-api POD_RESTART caused by same node eviction.
  //
  // All three share nodeId "ip-10-0-1-245.ec2.internal" so the agent can
  // correlate them with a nodeId filter or correlate_alerts on the same cluster.

  preAssigned.push({
    _id: "inc_0053",
    serviceId: KARPENTER_SVC.serviceId,
    serviceName: KARPENTER_SVC.serviceName,
    namespace: KARPENTER_SVC.namespace,
    podName: null,                          // node-level event; no pod
    alertType: "SPOT_INTERRUPTION",
    metricValue: 8,                         // 8 pods running on this node
    threshold: THRESHOLDS.SPOT_INTERRUPTION,
    severity: "P1",
    status: "ACTIVE",
    clusterId: "prod-us-east-1",
    meshError: null,
    nodeId: ANCHOR_NODE.nodeId,
    instanceType: ANCHOR_NODE.instanceType,
    nodePool: ANCHOR_NODE.nodePool,
    disruptionReason: "SPOT_INTERRUPTION",
    timestamp: new Date(now.getTime() - 12 * MIN_MS),
    investigatingAt: null,
    resolvedAt: null,
    rootCauseCategory: null,
  });

  preAssigned.push({
    _id: "inc_0054",
    serviceId: "payment-service",
    serviceName: "Payment Service",
    namespace: "payments-ns",
    podName: "payment-service-7f4b8c-xk2mn",
    alertType: "POD_RESTART",
    metricValue: 1,
    threshold: THRESHOLDS.POD_RESTART,
    severity: "P2",
    status: "ACTIVE",
    clusterId: "prod-us-east-1",
    meshError: null,
    nodeId: ANCHOR_NODE.nodeId,            // same node — eviction cascade
    instanceType: ANCHOR_NODE.instanceType,
    nodePool: ANCHOR_NODE.nodePool,
    disruptionReason: null,                // the pod restart itself is not the Karpenter event
    timestamp: new Date(now.getTime() - 9 * MIN_MS),
    investigatingAt: null,
    resolvedAt: null,
    rootCauseCategory: null,
  });

  preAssigned.push({
    _id: "inc_0055",
    serviceId: "orders-api",
    serviceName: "Orders API",
    namespace: "orders-ns",
    podName: "orders-api-5c2f87-rv4nt",
    alertType: "POD_RESTART",
    metricValue: 1,
    threshold: THRESHOLDS.POD_RESTART,
    severity: "P2",
    status: "ACTIVE",
    clusterId: "prod-us-east-1",
    meshError: null,
    nodeId: ANCHOR_NODE.nodeId,            // same node
    instanceType: ANCHOR_NODE.instanceType,
    nodePool: ANCHOR_NODE.nodePool,
    disruptionReason: null,
    timestamp: new Date(now.getTime() - 8 * MIN_MS),
    investigatingAt: null,
    resolvedAt: null,
    rootCauseCategory: null,
  });

  // Two more payment-service P1 ACTIVE (+ inc_0051 = exactly 3 for Fact 1).
  regular.push({
    serviceId: "payment-service",
    serviceName: "Payment Service",
    namespace: "payments-ns",
    podName: "payment-service-7f4b8c-xk2mn",
    alertType: "HTTP_500",
    metricValue: 312,
    threshold: THRESHOLDS.HTTP_500,
    severity: "P1",
    status: "ACTIVE",
    clusterId: "prod-us-east-1",
    meshError: null,
    nodeId: null, instanceType: null, nodePool: null, disruptionReason: null,
    timestamp: new Date(now.getTime() - 75 * MIN_MS),
    investigatingAt: null,
    resolvedAt: null,
    rootCauseCategory: null,
  });

  regular.push({
    serviceId: "payment-service",
    serviceName: "Payment Service",
    namespace: "payments-ns",
    podName: "payment-service-7f4b8c-xk2mn",
    alertType: "HIGH_LATENCY",
    metricValue: 2150,
    threshold: THRESHOLDS.HIGH_LATENCY,
    severity: "P1",
    status: "ACTIVE",
    clusterId: "prod-us-west-2",
    meshError: null,
    nodeId: null, instanceType: null, nodePool: null, disruptionReason: null,
    timestamp: new Date(now.getTime() - 45 * MIN_MS),
    investigatingAt: null,
    resolvedAt: null,
    rootCauseCategory: null,
  });

  // ---- Anchors: Verifiable Fact 3 -----------------------------------------

  const res1Ts = new Date(SOM + 2 * HOUR_MS);
  regular.push({
    serviceId: "auth-service",
    serviceName: "Auth Service",
    namespace: "auth-ns",
    podName: "auth-service-8a1e45-bz7qw",
    alertType: "HIGH_LATENCY",
    metricValue: 1800,
    threshold: THRESHOLDS.HIGH_LATENCY,
    severity: "P1",
    status: "RESOLVED",
    clusterId: "prod-us-east-1",
    meshError: null,
    nodeId: null, instanceType: null, nodePool: null, disruptionReason: null,
    timestamp: res1Ts,
    investigatingAt: new Date(res1Ts.getTime() + 5 * MIN_MS),
    resolvedAt: new Date(res1Ts.getTime() + 30 * MIN_MS),
    rootCauseCategory: "resource_exhaustion",
  });

  const res2Ts = new Date(SOM + 26 * HOUR_MS);
  regular.push({
    serviceId: "orders-api",
    serviceName: "Orders API",
    namespace: "orders-ns",
    podName: "orders-api-5c2f87-rv4nt",
    alertType: "HTTP_500",
    metricValue: 425,
    threshold: THRESHOLDS.HTTP_500,
    severity: "P1",
    status: "RESOLVED",
    clusterId: "prod-us-west-2",
    meshError: null,
    nodeId: null, instanceType: null, nodePool: null, disruptionReason: null,
    timestamp: res2Ts,
    investigatingAt: new Date(res2Ts.getTime() + 8 * MIN_MS),
    resolvedAt: new Date(res2Ts.getTime() + 40 * MIN_MS),
    rootCauseCategory: "code_defect",
  });

  const res3Ts = new Date(SOM + 50 * HOUR_MS);
  regular.push({
    serviceId: "payment-service",
    serviceName: "Payment Service",
    namespace: "payments-ns",
    podName: "payment-service-7f4b8c-xk2mn",
    alertType: "CONNECTION_POOL_EXHAUSTED",
    metricValue: 153,
    threshold: THRESHOLDS.CONNECTION_POOL_EXHAUSTED,
    severity: "P1",
    status: "RESOLVED",
    clusterId: "prod-us-east-1",
    meshError: null,
    nodeId: null, instanceType: null, nodePool: null, disruptionReason: null,
    timestamp: res3Ts,
    investigatingAt: new Date(res3Ts.getTime() + 10 * MIN_MS),
    resolvedAt: new Date(res3Ts.getTime() + 41 * MIN_MS),
    rootCauseCategory: "resource_exhaustion",
  });

  // ---- Anchors: Verifiable Fact 4 -----------------------------------------

  regular.push({
    serviceId: "payment-service",
    serviceName: "Payment Service",
    namespace: "payments-ns",
    podName: "payment-service-7f4b8c-xk2mn",
    alertType: "CPU_THROTTLING",
    metricValue: 92,
    threshold: THRESHOLDS.CPU_THROTTLING,
    severity: "P2",
    status: "INVESTIGATING",
    clusterId: "prod-us-east-1",
    meshError: null,
    nodeId: null, instanceType: null, nodePool: null, disruptionReason: null,
    timestamp: new Date(now.getTime() - 3 * DAY_MS - 4 * HOUR_MS),
    investigatingAt: new Date(now.getTime() - 3 * DAY_MS - 3 * HOUR_MS),
    resolvedAt: null,
    rootCauseCategory: rootCauseForAlertType("CPU_THROTTLING"),
  });

  regular.push({
    serviceId: "orders-api",
    serviceName: "Orders API",
    namespace: "orders-ns",
    podName: "orders-api-5c2f87-rv4nt",
    alertType: "POD_RESTART",
    metricValue: 7,
    threshold: THRESHOLDS.POD_RESTART,
    severity: "P2",
    status: "INVESTIGATING",
    clusterId: "prod-us-west-2",
    meshError: null,
    nodeId: null, instanceType: null, nodePool: null, disruptionReason: null,
    timestamp: new Date(now.getTime() - 3 * DAY_MS - 2 * HOUR_MS),
    investigatingAt: new Date(now.getTime() - 3 * DAY_MS - 1 * HOUR_MS),
    resolvedAt: null,
    rootCauseCategory: rootCauseForAlertType("POD_RESTART"),
  });

  regular.push({
    serviceId: "auth-service",
    serviceName: "Auth Service",
    namespace: "auth-ns",
    podName: "auth-service-8a1e45-bz7qw",
    alertType: "OOM_KILLED",
    metricValue: 89,
    threshold: THRESHOLDS.OOM_KILLED,
    severity: "P3",
    status: "INVESTIGATING",
    clusterId: "prod-us-east-1",
    meshError: null,
    nodeId: null, instanceType: null, nodePool: null, disruptionReason: null,
    timestamp: new Date(now.getTime() - 2 * DAY_MS - 3 * HOUR_MS),
    investigatingAt: new Date(now.getTime() - 2 * DAY_MS - 2 * HOUR_MS),
    resolvedAt: null,
    rootCauseCategory: rootCauseForAlertType("OOM_KILLED"),
  });

  regular.push({
    serviceId: "postgres-main",
    serviceName: "Main Database",
    namespace: "data-ns",
    podName: "postgres-main-6d3a91-wj5pq",
    alertType: "CPU_THROTTLING",
    metricValue: 88,
    threshold: THRESHOLDS.CPU_THROTTLING,
    severity: "P3",
    status: "INVESTIGATING",
    clusterId: "prod-us-west-2",
    meshError: null,
    nodeId: null, instanceType: null, nodePool: null, disruptionReason: null,
    timestamp: new Date(now.getTime() - 2 * DAY_MS - 1 * HOUR_MS),
    investigatingAt: new Date(now.getTime() - 2 * DAY_MS),
    resolvedAt: null,
    rootCauseCategory: rootCauseForAlertType("CPU_THROTTLING"),
  });

  // ---- Filler records ------------------------------------------------------
  //
  // Always P2 or P3, never INVESTIGATING. Node-type alerts use KARPENTER_SVC and
  // a random node from NODES. All other alerts use SERVICES and have null node fields.
  // The rng call for SERVICES is always consumed (even for node alerts) to keep
  // the sequence stable if the alert-type mix changes.

  const FILLER_SVRTS = ["P2", "P3"] as const satisfies readonly Severity[];
  const FILLER_STATS = ["ACTIVE", "RESOLVED"] as const satisfies readonly AlertStatus[];

  for (let i = 0; i < FILLER_COUNT; i++) {
    const rawSvc  = pick(rng, SERVICES);           // always consumed
    const severity = pick(rng, FILLER_SVRTS);
    const alertType = pick(rng, ALERT_TYPES);
    const status   = pick(rng, FILLER_STATS);
    const clusterId = pick(rng, CLUSTER_IDS);

    const tsOffsetMs =
      Math.floor(rng() * 30) * DAY_MS +
      Math.floor(rng() * DAY_MS) +
      3 * HOUR_MS;
    const timestamp = new Date(now.getTime() - tsOffsetMs);
    const metric = observedMetric(rng, alertType);

    const isNodeAlert = NODE_ALERT_TYPE_SET.has(alertType);
    const svc = isNodeAlert ? KARPENTER_SVC : rawSvc;

    // For node-type alerts pick a node; for others all node fields stay null.
    let nodeId: string | null = null;
    let instanceType: InstanceType | null = null;
    let nodePool: NodePool | null = null;
    if (isNodeAlert) {
      const node = pick(rng, NODES);
      nodeId = node.nodeId;
      instanceType = node.instanceType;
      nodePool = node.nodePool;
    }

    let investigatingAt: Date | null = null;
    let resolvedAt: Date | null = null;
    if (status === "RESOLVED") {
      const resolutionMs = (Math.floor(rng() * 240) + 10) * MIN_MS;
      const investigatingOffsetMs =
        Math.floor(rng() * (resolutionMs / 2 - MIN_MS)) + MIN_MS;
      investigatingAt = new Date(timestamp.getTime() + investigatingOffsetMs);
      resolvedAt      = new Date(timestamp.getTime() + resolutionMs);
    }

    regular.push({
      serviceId:   svc.serviceId,
      serviceName: svc.serviceName,
      namespace:   svc.namespace,
      podName:     isNodeAlert ? null : rawSvc.podName,
      alertType,
      metricValue: metric,
      threshold:   THRESHOLDS[alertType],
      severity,
      status,
      clusterId,
      meshError:         meshErrorForAlertType(alertType),
      nodeId,
      instanceType,
      nodePool,
      disruptionReason:  disruptionReasonForAlertType(alertType),
      timestamp,
      investigatingAt,
      resolvedAt,
      rootCauseCategory: status === "RESOLVED" ? rootCauseForAlertType(alertType) : null,
    });
  }

  // ---- ID assignment -------------------------------------------------------

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
  paymentServiceP1ActiveCount: number;
  correlatedPair: {
    first:  { _id: string; serviceId: string; clusterId: string };
    second: { _id: string; serviceId: string; clusterId: string };
    diffMs: number;
  };
  p1ResolvedThisMonth: {
    count: number;
    resolutionMinutes: [number, number, number];
    avgResolutionMinutes: number;
  };
  investigatingCount: number;
  p1ResourceExhaustionThisMonth: number;
  assessSubjectId: string;
  /** Node disruption cascade anchors (Fact 6). */
  nodeCascade: {
    spotInterruptionId: string;
    podRestartIds: [string, string];
    nodeId: string;
    /** Total ACTIVE alerts on the anchor node (inc_0053 + inc_0054 + inc_0055 = 3). */
    alertsOnAnchorNode: number;
    /** Count of ACTIVE SPOT_INTERRUPTION alerts in the whole dataset. */
    spotInterruptionActiveCount: number;
  };
}

export function computeExpectations(events: AlertEvent[], now: Date = new Date()): Expectations {
  const SOM = startOfMonthUTC(now);

  const paymentP1Active = events.filter(
    (e) => e.serviceId === "payment-service" && e.severity === "P1" && e.status === "ACTIVE",
  );

  const inc51 = events.find((e) => e._id === "inc_0051");
  const inc52 = events.find((e) => e._id === "inc_0052");
  if (!inc51 || !inc52) throw new Error("inc_0051 or inc_0052 missing; generator broken.");

  const p1Resolved = events.filter(
    (e) => e.severity === "P1" && e.status === "RESOLVED" && e.timestamp.getTime() >= SOM,
  );

  const resolutionMins = p1Resolved
    .map((e) => (e.resolvedAt !== null ? (e.resolvedAt.getTime() - e.timestamp.getTime()) / MIN_MS : 0))
    .sort((a, b) => a - b);

  const [m0 = 0, m1 = 0, m2 = 0] = resolutionMins;

  const investigating         = events.filter((e) => e.status === "INVESTIGATING");
  const p1ResourceExhaustion  = p1Resolved.filter((e) => e.rootCauseCategory === "resource_exhaustion");

  const alertsOnAnchorNode = events.filter(
    (e) => e.nodeId === ANCHOR_NODE.nodeId && e.status === "ACTIVE",
  );
  const spotInterruptionActive = events.filter(
    (e) => e.alertType === "SPOT_INTERRUPTION" && e.status === "ACTIVE",
  );

  return {
    totalEvents: events.length,
    paymentServiceP1ActiveCount: paymentP1Active.length,
    correlatedPair: {
      first:  { _id: inc51._id, serviceId: inc51.serviceId, clusterId: inc51.clusterId },
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
    investigatingCount:            investigating.length,
    p1ResourceExhaustionThisMonth: p1ResourceExhaustion.length,
    assessSubjectId:               "inc_0051",
    nodeCascade: {
      spotInterruptionId:       "inc_0053",
      podRestartIds:            ["inc_0054", "inc_0055"],
      nodeId:                   ANCHOR_NODE.nodeId,
      alertsOnAnchorNode:       alertsOnAnchorNode.length,
      spotInterruptionActiveCount: spotInterruptionActive.length,
    },
  };
}

// ---- Generator with full consistency checks ---------------------------------

export function generateAlertEvents(now: Date = new Date()): AlertEvent[] {
  const events = buildEvents(now);
  const SOM = startOfMonthUTC(now);
  const twoHoursAgo = now.getTime() - 2 * HOUR_MS;

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
    if (!NAMESPACES.includes(e.namespace))
      throw new Error(`${e._id}: unknown namespace "${e.namespace}"`);

    // Node-level vs pod-level invariants
    const isNodeType = NODE_ALERT_TYPE_SET.has(e.alertType);
    if (isNodeType && e.podName !== null)
      throw new Error(`${e._id}: node-type "${e.alertType}" must have null podName`);
    if (!isNodeType && e.podName === null)
      throw new Error(`${e._id}: pod-level "${e.alertType}" must have non-null podName`);
    if (isNodeType && e.nodeId === null)
      throw new Error(`${e._id}: node-type "${e.alertType}" must have non-null nodeId`);

    // nodeId / instanceType / nodePool must be all null or all non-null
    const hasNode = e.nodeId !== null;
    if (hasNode !== (e.instanceType !== null) || hasNode !== (e.nodePool !== null))
      throw new Error(`${e._id}: nodeId, instanceType, nodePool must all be null or all non-null`);

    // disruptionReason only for SPOT_INTERRUPTION
    if (e.disruptionReason !== null && e.alertType !== "SPOT_INTERRUPTION")
      throw new Error(`${e._id}: disruptionReason must be null for alertType "${e.alertType}"`);
    if (e.alertType === "SPOT_INTERRUPTION" && e.disruptionReason === null)
      throw new Error(`${e._id}: SPOT_INTERRUPTION must have a non-null disruptionReason`);

    // meshError only for CIRCUIT_BREAKER_OPEN / SERVICE_MESH_TIMEOUT
    const expectsMesh = e.alertType === "CIRCUIT_BREAKER_OPEN" || e.alertType === "SERVICE_MESH_TIMEOUT";
    if (expectsMesh && e.meshError === null)
      throw new Error(`${e._id}: "${e.alertType}" requires non-null meshError`);
    if (!expectsMesh && e.meshError !== null)
      throw new Error(`${e._id}: "${e.alertType}" must have null meshError`);

    // P1 only for allowed alertTypes
    if (e.severity === "P1" && !P1_ALERT_TYPE_SET.has(e.alertType))
      throw new Error(`${e._id}: P1 not allowed for alertType "${e.alertType}"`);

    // rootCauseCategory lifecycle
    if (e.status === "ACTIVE" && e.rootCauseCategory !== null)
      throw new Error(`${e._id}: ACTIVE record must have null rootCauseCategory`);
    if ((e.status === "INVESTIGATING" || e.status === "RESOLVED") && e.rootCauseCategory === null)
      throw new Error(`${e._id}: ${e.status} record must have non-null rootCauseCategory`);
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
    if (e.investigatingAt !== null && e.resolvedAt !== null) {
      if (e.investigatingAt.getTime() >= e.resolvedAt.getTime())
        throw new Error(`${e._id}: investigatingAt >= resolvedAt`);
    }
  }

  // ---- Fact 1 ---------------------------------------------------------------
  const p1ActiveIn2h = events.filter(
    (e) => e.severity === "P1" && e.status === "ACTIVE" && e.timestamp.getTime() >= twoHoursAgo,
  );
  const byService = new Map<string, number>();
  for (const e of p1ActiveIn2h) byService.set(e.serviceId, (byService.get(e.serviceId) ?? 0) + 1);

  const paymentCount = byService.get("payment-service") ?? 0;
  if (paymentCount !== 3)
    throw new Error(`Fact 1: payment-service has ${paymentCount} P1 ACTIVE in last 2 h, expected 3`);
  for (const [svcId, count] of byService)
    if (svcId !== "payment-service" && count > 2)
      throw new Error(`Fact 1: service "${svcId}" has ${count} P1 ACTIVE in last 2 h (max 2 for non-payment)`);

  // ---- Fact 2 ---------------------------------------------------------------
  const inc51 = events.find((e) => e._id === "inc_0051");
  const inc52 = events.find((e) => e._id === "inc_0052");
  if (!inc51) throw new Error("Fact 2: inc_0051 not found");
  if (!inc52) throw new Error("Fact 2: inc_0052 not found");
  const diffMs = Math.abs(inc51.timestamp.getTime() - inc52.timestamp.getTime());
  if (diffMs >= 5 * MIN_MS)
    throw new Error(`Fact 2: inc_0051/inc_0052 are ${diffMs / MIN_MS} min apart; expected < 5`);
  if (inc51.clusterId !== "prod-us-east-1") throw new Error("Fact 2: inc_0051 not in prod-us-east-1");
  if (inc52.clusterId !== "prod-us-east-1") throw new Error("Fact 2: inc_0052 not in prod-us-east-1");

  // ---- Fact 3 ---------------------------------------------------------------
  const p1ResolvedThisMonth = events.filter(
    (e) => e.severity === "P1" && e.status === "RESOLVED" && e.timestamp.getTime() >= SOM,
  );
  if (p1ResolvedThisMonth.length !== 3)
    throw new Error(`Fact 3: ${p1ResolvedThisMonth.length} P1 RESOLVED this month, expected 3`);
  const resMins = p1ResolvedThisMonth
    .map((e) => e.resolvedAt !== null ? (e.resolvedAt.getTime() - e.timestamp.getTime()) / MIN_MS : 0)
    .sort((a, b) => a - b);
  const [r0 = -1, r1 = -1, r2 = -1] = resMins;
  if (r0 !== 30 || r1 !== 40 || r2 !== 41)
    throw new Error(`Fact 3: resolution minutes are [${resMins.join(", ")}], expected [30, 40, 41]`);
  const avg = resMins.reduce((s, m) => s + m, 0) / resMins.length;
  if (Math.abs(avg - 37) > 0.001)
    throw new Error(`Fact 3: average resolution time is ${avg} min, expected 37`);

  // ---- Fact 4 ---------------------------------------------------------------
  const investigating = events.filter((e) => e.status === "INVESTIGATING");
  if (investigating.length !== 4)
    throw new Error(`Fact 4: ${investigating.length} INVESTIGATING records, expected 4`);
  const invServices = new Set(investigating.map((e) => e.serviceId));
  if (invServices.size < 2)
    throw new Error(`Fact 4: INVESTIGATING spans only ${invServices.size} service(s), expected >= 2`);

  // ---- Fact 6: node cascade ------------------------------------------------
  const inc53 = events.find((e) => e._id === "inc_0053");
  const inc54 = events.find((e) => e._id === "inc_0054");
  const inc55 = events.find((e) => e._id === "inc_0055");
  if (!inc53) throw new Error("Fact 6: inc_0053 (SPOT_INTERRUPTION) not found");
  if (!inc54) throw new Error("Fact 6: inc_0054 (POD_RESTART payment-service) not found");
  if (!inc55) throw new Error("Fact 6: inc_0055 (POD_RESTART orders-api) not found");
  if (inc53.nodeId !== ANCHOR_NODE.nodeId || inc54.nodeId !== ANCHOR_NODE.nodeId || inc55.nodeId !== ANCHOR_NODE.nodeId)
    throw new Error("Fact 6: inc_0053/0054/0055 must share the same nodeId");
  if (inc53.alertType !== "SPOT_INTERRUPTION")
    throw new Error("Fact 6: inc_0053 must be SPOT_INTERRUPTION");

  return events;
}

export { generateAlertEvents as generateActivityEvents };
