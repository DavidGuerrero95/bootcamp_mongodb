# Runbook de Incidentes: Degradación de Servicio en Kubernetes

## Cuándo usar este runbook

Usar cuando el monitoreo detecte alta latencia, errores HTTP 500, pods en OOMKilled, o agotamiento del pool de conexiones en producción. Este es un documento de referencia sintético para el bootcamp.

## Paso 1: Contener

Evaluar si el servicio afectado debe ser aislado del tráfico. Si los errores superan el 5 % de las peticiones, activar el circuit breaker o redirigir tráfico al cluster secundario. La contención es reversible y limita el impacto mientras se investiga.

## Paso 2: Correlacionar señales

Recopilar alertas activas en el mismo cluster durante la última hora: latencia (`HIGH_LATENCY`), errores (`HTTP_500`), escalado HPA (`HPA_SCALING`), OOM (`OOM_KILLED`), y agotamiento de conexiones (`CONNECTION_POOL_EXHAUSTED`). Si varias alertas de distintos tipos comparten `serviceId` o `clusterId` y un intervalo de tiempo cercano, el origen probable es un recurso compartido (base de datos, red, nodo).

## Paso 3: Clasificar la causa raíz

Clasificar el incidente en una de las siguientes categorías:

- `CODE`: bug introducido en un despliegue reciente; revisar logs del pod y el hash del commit.
- `INFRA_CONFIG`: parámetro incorrecto en el manifiesto (límites de CPU/memoria, variables de entorno, réplicas).
- `RESOURCE_EXHAUSTION`: agotamiento de un recurso externo (pool de conexiones, memoria del nodo, disco).
- `DEPENDENCY`: fallo o degradación en un servicio dependiente (base de datos, cola de mensajes, servicio downstream).

Registrar la categoría como `rootCauseCategory` en la alerta y vincular las alertas correlacionadas.

## Paso 4: Remediar y reportar

Para `RESOURCE_EXHAUSTION`: aumentar el pool de conexiones o reiniciar los pods saturados.
Para `INFRA_CONFIG`: aplicar el parche al manifiesto (`kubectl apply`) y verificar el rollout.
Para `CODE`: iniciar rollback (`kubectl rollout undo deployment/<nombre>`) y crear ticket de postmortem.
Para `DEPENDENCY`: activar el modo degradado o el fallback del servicio.

Todo incidente cierra con el campo `resolvedAt`, el `rootCauseCategory` registrado, y un resumen de la acción ejecutada vinculado a los IDs de alerta que lo dispararon.
