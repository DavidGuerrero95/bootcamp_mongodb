# Política de SLO y Presupuesto de Error

## Propósito y alcance

Esta política define los Objetivos de Nivel de Servicio (SLO) y cómo se gestiona el presupuesto de error para los microservicios en producción. Aplica a todos los servicios del clúster de producción. Es un documento de referencia sintético para el bootcamp.

## SLOs por criticidad de servicio

Los servicios se clasifican en tres niveles de criticidad, cada uno con su SLO de disponibilidad mensual:

- **P0 – Crítico**: disponibilidad ≥ 99,9 % (≤ 43 min de downtime al mes). Ejemplos: payment-service, auth-service.
- **P1 – Alto**: disponibilidad ≥ 99,5 % (≤ 3,6 h de downtime al mes). Ejemplos: notification-service, order-service.
- **P2 – Estándar**: disponibilidad ≥ 99,0 % (≤ 7,2 h de downtime al mes). Ejemplos: reporting-service, analytics-service.

## Presupuesto de error y alertas

El presupuesto de error es el tiempo de downtime permitido en el período. Cuando el consumo del presupuesto supera el 50 % en la primera mitad del período, se activa la alerta `BUDGET_BURN_RATE` y el equipo propietario debe revisar los cambios recientes.

Cuando el presupuesto se agota (consumo ≥ 100 %), se congela el despliegue de cambios no críticos hasta que el presupuesto se restablezca en el siguiente período.

## Latencia objetivo

- P99 de latencia de respuesta para servicios P0: ≤ 500 ms.
- P99 de latencia de respuesta para servicios P1: ≤ 1 000 ms.
- Una alerta `HIGH_LATENCY` en un servicio P0 con P99 > 1 000 ms se trata como incidente de severidad `critical`.

## Umbrales de tasa de error

Una tasa de errores HTTP 5xx superior al 1 % sostenida por más de 5 minutos dispara una alerta `HTTP_500` y abre automáticamente un incidente. El equipo SRE tiene hasta 15 minutos para la primera respuesta y hasta 60 minutos para la mitigación inicial.

## Revisión de SLOs

Los SLOs se revisan trimestralmente. Si un servicio supera sistemáticamente su SLO, se evalúa si el objetivo es realista o si se requieren cambios arquitectónicos.
