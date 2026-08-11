import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Simulated remediation executor for the SRE demo environment.
 *
 * Returns realistic terminal output for kubectl/psql actions so the agent
 * can present an end-to-end autonomous remediation without real cluster access.
 * The output is coherent with the incident data in MongoDB (pod names,
 * namespaces, metric values from activity_events).
 */

const POD_META: Record<string, { namespace: string; pod: string; deployment: string }> = {
  "payment-service":      { namespace: "payments-ns",  pod: "payment-service-7f4b8c-xk2mn",      deployment: "payment-service"      },
  "postgres-main":        { namespace: "data-ns",       pod: "postgres-main-6d3a91-wj5pq",         deployment: "postgres-main"        },
  "orders-api":           { namespace: "orders-ns",     pod: "orders-api-5c2f87-rv4nt",            deployment: "orders-api"           },
  "auth-service":         { namespace: "auth-ns",       pod: "auth-service-8a1e45-bz7qw",          deployment: "auth-service"         },
  "inventory-service":    { namespace: "orders-ns",     pod: "inventory-service-3b9d62-hs8lc",     deployment: "inventory-service"    },
  "notification-service": { namespace: "platform-ns",   pod: "notification-service-4e7c30-tp6rx",  deployment: "notification-service" },
  "karpenter":            { namespace: "karpenter",     pod: "karpenter-controller-5d8b74-zq9xm",  deployment: "karpenter-controller" },
};

function getMeta(serviceId: string) {
  return POD_META[serviceId] ?? { namespace: "default", pod: `${serviceId}-unknown`, deployment: serviceId };
}

function simulateRestartPod(serviceId: string, clusterId: string): string {
  const m = getMeta(serviceId);
  return [
    `$ kubectl rollout restart deployment/${m.deployment} -n ${m.namespace} --context=${clusterId}`,
    `deployment.apps/${m.deployment} restarted`,
    ``,
    `$ kubectl rollout status deployment/${m.deployment} -n ${m.namespace} --context=${clusterId}`,
    `Waiting for deployment "${m.deployment}" rollout to finish: 0 of 3 updated replicas are available...`,
    `Waiting for deployment "${m.deployment}" rollout to finish: 1 of 3 updated replicas are available...`,
    `Waiting for deployment "${m.deployment}" rollout to finish: 2 of 3 updated replicas are available...`,
    `deployment "${m.deployment}" successfully rolled out`,
    ``,
    `$ kubectl get pods -n ${m.namespace} --context=${clusterId} | grep ${serviceId}`,
    `${m.pod.replace(/[a-z0-9]{5}$/, "a8f2k")}   1/1   Running   0   12s`,
    `${m.pod.replace(/[a-z0-9]{5}$/, "b3j9p")}   1/1   Running   0   18s`,
    `${m.pod.replace(/[a-z0-9]{5}$/, "c7m4r")}   1/1   Running   0   24s`,
    ``,
    `✅ Rollout completado. 3/3 réplicas Running. Pod anterior (${m.pod}) terminado.`,
  ].join("\n");
}

function simulateCheckLogs(serviceId: string, clusterId: string): string {
  const m = getMeta(serviceId);
  const ts = "2026-08-11T19:";
  return [
    `$ kubectl logs ${m.pod} -n ${m.namespace} --context=${clusterId} --tail=50 --timestamps`,
    ``,
    `${ts}33:02Z [ERROR] Connection pool exhausted: max_connections=100 active=97`,
    `${ts}33:04Z [ERROR] HTTP 500 - upstream connect error: postgres-main:5432 connection refused`,
    `${ts}33:05Z [WARN]  Retry attempt 1/3 for request POST /payments/process`,
    `${ts}33:06Z [ERROR] HTTP 500 - upstream connect error (retry 1)`,
    `${ts}33:07Z [ERROR] HTTP 500 - upstream connect error (retry 2)`,
    `${ts}33:08Z [ERROR] HTTP 500 - Circuit breaker OPEN for dependency: postgres-main`,
    `${ts}33:10Z [ERROR] HTTP 500 x47 — circuit breaker rejecting requests`,
    `${ts}33:15Z [ERROR] HTTP 500 x89 — circuit breaker rejecting requests`,
    `${ts}33:20Z [ERROR] HTTP 500 x124 — circuit breaker rejecting requests`,
    ``,
    `🔍 Causa identificada: el servicio no puede conectar a postgres-main (circuit breaker abierto).`,
    `   Root cause real: CONNECTION_POOL_EXHAUSTED en postgres-main, no un defecto en ${serviceId}.`,
  ].join("\n");
}

function simulateGetPodStatus(serviceId: string, clusterId: string): string {
  const m = getMeta(serviceId);
  return [
    `$ kubectl get pods -n ${m.namespace} --context=${clusterId} -l app=${serviceId} -o wide`,
    ``,
    `NAME                                         READY   STATUS      RESTARTS   AGE   IP            NODE`,
    `${m.pod}   0/1     OOMKilled   3          47m   10.0.1.142    ip-10-0-1-245.ec2.internal`,
    `${m.pod.replace(/[a-z0-9]{5}$/, "rv2qx")}   1/1     Running     0          47m   10.0.2.88     ip-10-0-2-118.ec2.internal`,
    `${m.pod.replace(/[a-z0-9]{5}$/, "tz8lw")}   1/1     Running     0          47m   10.0.3.201    ip-10-0-3-092.ec2.internal`,
    ``,
    `⚠️  Pod ${m.pod} en OOMKilled (3 reinicios). Replica en nodo spot interrumpido.`,
  ].join("\n");
}

function simulateCheckConnections(serviceId: string, clusterId: string): string {
  const m = getMeta(serviceId);
  return [
    `$ kubectl exec ${m.pod} -n ${m.namespace} --context=${clusterId} -- psql -U postgres -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state ORDER BY count DESC;"`,
    ``,
    ` count |        state        `,
    `-------+---------------------`,
    `    47 | idle`,
    `    33 | active`,
    `    12 | idle in transaction`,
    `     5 | (null)`,
    `(4 rows)`,
    ``,
    `Total: 97/100 conexiones usadas (97% — umbral: 80%)`,
    `⚠️  47 conexiones idle + 12 idle in transaction bloqueando el pool.`,
    `   Acción recomendada: terminar idle connections para liberar capacidad.`,
  ].join("\n");
}

function simulateKillIdleConnections(serviceId: string, clusterId: string): string {
  const m = getMeta(serviceId);
  return [
    `$ kubectl exec ${m.pod} -n ${m.namespace} --context=${clusterId} -- psql -U postgres -c \\`,
    `  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < NOW() - INTERVAL '5 minutes';"`,
    ``,
    ` pg_terminate_backend `,
    `----------------------`,
    ` t`,
    ` t`,
    ` t`,
    ` [... 44 filas más ...]`,
    `(47 rows)`,
    ``,
    `$ kubectl exec ${m.pod} -n ${m.namespace} --context=${clusterId} -- psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"`,
    ``,
    ` count `,
    `-------`,
    `    44`,
    `(1 row)`,
    ``,
    `✅ 47 conexiones idle terminadas. Pool liberado: 44/100 (44%). Servicio estabilizándose.`,
  ].join("\n");
}

function simulateScaleDeployment(serviceId: string, clusterId: string, replicas: number): string {
  const m = getMeta(serviceId);
  return [
    `$ kubectl scale deployment/${m.deployment} -n ${m.namespace} --context=${clusterId} --replicas=${replicas}`,
    `deployment.apps/${m.deployment} scaled`,
    ``,
    `$ kubectl rollout status deployment/${m.deployment} -n ${m.namespace}`,
    `Waiting for deployment "${m.deployment}" rollout to finish: 0 of ${replicas} updated replicas are available...`,
    `Waiting for deployment "${m.deployment}" rollout to finish: ${Math.floor(replicas / 2)} of ${replicas} updated replicas are available...`,
    `deployment "${m.deployment}" successfully rolled out`,
    ``,
    `✅ Deployment escalado a ${replicas} réplicas. Carga distribuida.`,
  ].join("\n");
}

function simulateCheckKarpenter(clusterId: string): string {
  return [
    `$ kubectl get nodeclaims --context=${clusterId} -o wide`,
    ``,
    `NAME                            TYPE          ZONE         NODE                           READY   AGE`,
    `spot-workers-7fkqx              m5.2xlarge    us-east-1a   ip-10-0-1-245.ec2.internal     False   0s    ← INTERRUMPIDO`,
    `spot-workers-9prtm              c5.4xlarge    us-east-1b   ip-10-0-2-118.ec2.internal     False   0s    ← INTERRUMPIDO`,
    `spot-workers-2vbnz              m5.xlarge     us-east-1c   (pending)                      False   3s`,
    ``,
    `$ kubectl get nodes --context=${clusterId}`,
    `NAME                           STATUS     ROLES    AGE   VERSION`,
    `ip-10-0-1-245.ec2.internal     NotReady   <none>   47m   v1.29.3  ← SPOT INTERRUMPIDO`,
    `ip-10-0-2-118.ec2.internal     NotReady   <none>   47m   v1.29.3  ← SPOT INTERRUMPIDO`,
    `ip-10-0-3-092.ec2.internal     Ready      <none>   2d    v1.29.3`,
    `ip-10-0-4-207.ec2.internal     Ready      <none>   2d    v1.29.3`,
    `ip-10-0-karpenter-od-x4f2      Ready      <none>   18s   v1.29.3  ← ON-DEMAND provisionado`,
    ``,
    `✅ Karpenter provisionó 1 nodo On-Demand (ip-10-0-karpenter-od-x4f2). Pods rescheduling en progreso.`,
  ].join("\n");
}

export const executeRemediation = tool(
  async ({ action, serviceId, clusterId, replicas }): Promise<string> => {
    switch (action) {
      case "restart_pod":
        return simulateRestartPod(serviceId ?? "payment-service", clusterId);
      case "check_logs":
        return simulateCheckLogs(serviceId ?? "payment-service", clusterId);
      case "get_pod_status":
        return simulateGetPodStatus(serviceId ?? "payment-service", clusterId);
      case "check_connections":
        return simulateCheckConnections(serviceId ?? "postgres-main", clusterId);
      case "kill_idle_connections":
        return simulateKillIdleConnections(serviceId ?? "postgres-main", clusterId);
      case "scale_deployment":
        return simulateScaleDeployment(serviceId ?? "payment-service", clusterId, replicas ?? 5);
      case "check_karpenter":
        return simulateCheckKarpenter(clusterId);
      default:
        return `Acción desconocida: ${action as string}`;
    }
  },
  {
    name: "execute_remediation",
    description:
      "Execute a remediation action on the Kubernetes cluster and return the command output. " +
      "Use this tool to take direct action on incidents: restart a failing pod, check its logs, " +
      "kill idle database connections, scale a deployment, or check Karpenter node status. " +
      "Always call this tool when the user asks to fix, restart, remediate, or investigate a pod/service. " +
      "Chain multiple calls to execute a full remediation sequence autonomously.",
    schema: z.object({
      action: z
        .enum([
          "restart_pod",
          "check_logs",
          "get_pod_status",
          "check_connections",
          "kill_idle_connections",
          "scale_deployment",
          "check_karpenter",
        ])
        .describe(
          "restart_pod: rollout restart a deployment. " +
          "check_logs: fetch recent pod logs. " +
          "get_pod_status: list pods and their status. " +
          "check_connections: show pg_stat_activity connection counts. " +
          "kill_idle_connections: terminate idle postgres connections to free the pool. " +
          "scale_deployment: change replica count. " +
          "check_karpenter: show node claims and node readiness.",
        ),
      clusterId: z
        .string()
        .describe("Target cluster, e.g. 'prod-us-east-1'."),
      serviceId: z
        .string()
        .optional()
        .describe(
          "Service to act on: 'payment-service', 'postgres-main', 'orders-api', " +
          "'auth-service', 'inventory-service', 'notification-service', 'karpenter'.",
        ),
      replicas: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Target replica count for scale_deployment action."),
    }),
  },
);
