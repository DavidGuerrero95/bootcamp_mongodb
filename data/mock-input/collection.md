# My structured collection

---

## Data Details

- **Source:** datos sintéticos que simulan eventos de Prometheus/Alertmanager exportados a MongoDB Atlas
- **Content type:** eventos de monitoreo estructurados (time-series de alertas de microservicios)
- **Size:** ~300 registros
- **Format:** documentos BSON, colección `alert_events` en MongoDB Atlas
- **Structured data source route:** `EVENTS_COLLECTION=alert_events` en `.env`
- **Access status:** datos sintéticos locales, sin conexión a infraestructura de producción
- **Data classification:** sintético, sin PII, aprobado para demo de bootcamp
- **Data owner:** equipo de plataforma SRE (uso interno de bootcamp)

---

## Collection

- **Name:** `alert_events`  (must match `EVENTS_COLLECTION` in `.env`)
- **One document is:** una alerta de monitoreo disparada por un microservicio en producción (latencia alta, error HTTP 500, reinicio de pod, agotamiento de recursos).
- **Approximate volume for the demo:** ~300 records

## Fields

| Field | Type | Notes / units |
|---|---|---|
| `_id` | string | stable id, e.g. `inc_0001` |
| `serviceId` | string | identificador del microservicio afectado, e.g. `payment-service` |
| `serviceName` | string | nombre legible del servicio, e.g. `Payment Service` |
| `namespace` | string | namespace de Kubernetes donde corre el servicio (ver enums) |
| `podName` | string | nombre del pod que disparó la alerta, e.g. `payment-service-7f4b8c-xk2mn` |
| `alertType` | string | tipo de alerta disparada (ver enums) |
| `metricValue` | number | valor observado de la métrica (ms para latencia, % para CPU/memoria/circuit-breaker, count para errores) |
| `threshold` | number | umbral configurado que fue superado; mismas unidades que `metricValue` |
| `severity` | string | nivel de severidad del incidente (ver enums) |
| `status` | string | estado actual de la alerta (ver enums) |
| `clusterId` | string | cluster de Kubernetes donde ocurrió, e.g. `prod-us-east-1` |
| `meshError` | string\|null | falla detectada en la capa de service mesh (ver enums); null si no involucra mesh |
| `timestamp` | Date | BSON UTC — momento en que se disparó la alerta |
| `investigatingAt` | Date | BSON UTC — momento en que el sistema pasó a estado `INVESTIGATING`; null si no aplica |
| `resolvedAt` | Date | BSON UTC — momento en que el sistema pasó a estado `RESOLVED`; null si aún no resuelto |
| `rootCauseCategory` | string\|null | causa raíz identificada (ver enums); null en alertas ACTIVE, asignado al pasar a INVESTIGATING o RESOLVED |

## Enums

- `alertType`: `HIGH_LATENCY`, `HTTP_500`, `OOM_KILLED`, `CONNECTION_POOL_EXHAUSTED`, `POD_RESTART`, `CPU_THROTTLING`, `HTTP_4XX_SPIKE`, `CIRCUIT_BREAKER_OPEN`, `SERVICE_MESH_TIMEOUT`
- `severity`: `P1`, `P2`, `P3` — P1 solo para `HIGH_LATENCY`, `HTTP_500`, `CONNECTION_POOL_EXHAUSTED`, `CIRCUIT_BREAKER_OPEN`, `SERVICE_MESH_TIMEOUT`
- `status`: `ACTIVE`, `INVESTIGATING`, `RESOLVED`
- `namespace`: `payments-ns`, `auth-ns`, `orders-ns`, `data-ns`, `platform-ns`
- `meshError`: `CIRCUIT_BREAKER_OPEN`, `TIMEOUT`, `RETRY_EXCEEDED`, `CONNECTION_REFUSED` — solo no-null en alertas `CIRCUIT_BREAKER_OPEN` y `SERVICE_MESH_TIMEOUT`
- `rootCauseCategory`: `code_defect`, `resource_exhaustion`, `configuration_drift`, `dependency`, `unknown`

## Units and conventions

- `metricValue` depende del `alertType`: milisegundos para `HIGH_LATENCY`, porcentaje (0-100) para `CPU_THROTTLING` y `OOM_KILLED`, conteo entero para `HTTP_500` y `POD_RESTART`, conteo de conexiones para `CONNECTION_POOL_EXHAUSTED`.
- `threshold` usa las mismas unidades que `metricValue`.
- Todos los timestamps (`timestamp`, `investigatingAt`, `resolvedAt`) son BSON dates en UTC.
- El flujo de estados es secuencial: `ACTIVE` → `INVESTIGATING` → `RESOLVED`.

## Consistency rules

- Una alerta con `status = RESOLVED` siempre tiene `resolvedAt` no nulo.
- Una alerta con `status = INVESTIGATING` siempre tiene `investigatingAt` no nulo y `resolvedAt` nulo.
- Una alerta con `status = ACTIVE` tiene `investigatingAt`, `resolvedAt` y `rootCauseCategory` nulos.
- Una alerta con `severity = P1` siempre tiene `alertType` en `HIGH_LATENCY`, `HTTP_500`, o `CONNECTION_POOL_EXHAUSTED`.
- `rootCauseCategory` es null en alertas `ACTIVE`; debe ser no nulo en `INVESTIGATING` y `RESOLVED`.
- El `clusterId` es siempre uno de los clusters definidos en el dataset.
- `investigatingAt` < `resolvedAt` cuando ambos están presentes.

## Verifiable facts (the anchors)

- **Fact 1** — "¿Qué servicio tiene más alertas P1 activas ahora mismo?" → exactamente `payment-service` con 3 alertas P1 en `status = ACTIVE`, todos con `timestamp` dentro de las últimas 2 horas. Ningún otro servicio supera 2 alertas P1 activas simultáneas.
- **Fact 2** — "¿Hay alertas correlacionadas en los últimos 15 minutos que sugieran un problema en cadena?" → exactamente 2 registros sembrados: `inc_0051` (`payment-service`, `HIGH_LATENCY`, P1, ACTIVE) y `inc_0052` (`postgres-main`, `CONNECTION_POOL_EXHAUSTED`, P1, ACTIVE), con timestamps separados por menos de 5 minutos, ambos en `prod-us-east-1`. Ningún otro par cumple esa condición en esa ventana.
- **Fact 3** — "¿Cuál fue el tiempo promedio de resolución de incidentes P1 este mes?" → exactamente 37 minutos, calculado sobre 3 incidentes P1 con `status = RESOLVED` y `timestamp` dentro del mes actual. Sus tiempos individuales de resolución (`resolvedAt - timestamp`) suman 111 minutos (30, 40 y 41 minutos), promediando 37.
- **Fact 4** — "¿Cuántos incidentes están en estado INVESTIGATING en este momento?" → exactamente 4 registros con `status = INVESTIGATING`, distribuidos en al menos 2 servicios distintos.
- **Fact 5** — "¿Cuántos incidentes P1 resueltos este mes tuvieron `rootCauseCategory = resource_exhaustion`?" → exactamente 2 (auth-service HIGH_LATENCY y payment-service CONNECTION_POOL_EXHAUSTED); el tercero tiene `code_defect`.

## Sample records (hand-author 3 to 5)

```json
[
  {
    "_id": "inc_0001",
    "serviceId": "payment-service",
    "serviceName": "Payment Service",
    "alertType": "HIGH_LATENCY",
    "metricValue": 1240,
    "threshold": 500,
    "severity": "P1",
    "status": "ACTIVE",
    "clusterId": "prod-us-east-1",
    "timestamp": "2026-08-11T02:13:00Z",
    "investigatingAt": null,
    "resolvedAt": null
  },
  {
    "_id": "inc_0002",
    "serviceId": "postgres-main",
    "serviceName": "Main Database",
    "alertType": "CONNECTION_POOL_EXHAUSTED",
    "metricValue": 98,
    "threshold": 80,
    "severity": "P1",
    "status": "INVESTIGATING",
    "clusterId": "prod-us-east-1",
    "timestamp": "2026-08-11T02:14:00Z",
    "investigatingAt": "2026-08-11T02:18:00Z",
    "resolvedAt": null
  },
  {
    "_id": "inc_0003",
    "serviceId": "orders-api",
    "serviceName": "Orders API",
    "alertType": "POD_RESTART",
    "metricValue": 5,
    "threshold": 3,
    "severity": "P2",
    "status": "INVESTIGATING",
    "clusterId": "prod-us-east-1",
    "timestamp": "2026-08-11T02:15:00Z",
    "investigatingAt": "2026-08-11T02:20:00Z",
    "resolvedAt": null
  },
  {
    "_id": "inc_0004",
    "serviceId": "auth-service",
    "serviceName": "Auth Service",
    "alertType": "HTTP_500",
    "metricValue": 320,
    "threshold": 50,
    "severity": "P1",
    "status": "RESOLVED",
    "clusterId": "prod-us-west-2",
    "timestamp": "2026-08-10T18:45:00Z",
    "investigatingAt": "2026-08-10T19:05:00Z",
    "resolvedAt": "2026-08-10T19:42:00Z"
  }
]
```

---

## Reference: the shipped bank scenario, filled in

This is what a completed `collection.md` looks like, matching `data/sample/activity_events.ts`.

- **Name:** `activity_events`
- **One document is:** one operational event at a bank (a login, a balance query, a transfer, a user change).
- **Approximate volume:** ~60 records.

Fields: `_id` (string, `evt_0001`), `userId` / `userName` (string, the actor), `action` (string enum), `amount` (number, minor units, non-zero only for transfers), `channel` (string enum), `status` (string enum), `timestamp` (Date, UTC).

Enums: `action` = `LOGIN`, `BALANCE_QUERY`, `TRANSFER_INITIATED`, `TRANSFER_APPROVED`, `USER_CREATED`, `USER_MODIFIED`; `channel` = `WEB`, `MOBILE`, `API`, `BRANCH`; `status` = `SUCCESS`, `FAILED`, `PENDING`.

Units: `amount` in minor units (cents); `1500000` means 15,000.00.

Consistency rules: only `TRANSFER_INITIATED` and `TRANSFER_APPROVED` carry a non-zero `amount`; per-user successful-transfer totals sum to the global total.

Verifiable facts: "largest transfer this month" is a single $25,000.00 transfer dated this month, with a larger $30,000.00 transfer dated last month so the month filter matters; a dual-control violation where one operator both initiates and approves the same high-value transfer, for the hybrid demo.
