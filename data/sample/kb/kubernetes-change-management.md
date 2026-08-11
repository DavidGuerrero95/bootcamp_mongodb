# Estándar de Gestión de Cambios en Kubernetes

## Principio

Ningún cambio de configuración o despliegue en producción puede realizarse sin seguir este estándar. Los cambios no coordinados son la causa más frecuente de incidentes en producción. Este es un documento de referencia sintético para el bootcamp.

## Tipos de cambio

- **Despliegue de código** (`kubectl rollout`): requiere aprobación del lead técnico del equipo, ejecución fuera de horario de mayor tráfico (07:00–10:00 y 18:00–21:00 hora local), y un plan de rollback documentado.
- **Cambio de configuración** (ConfigMap, Secret, variables de entorno): debe versionarse en el repositorio Git antes de aplicarse al clúster. No se permiten ediciones directas con `kubectl edit` en producción.
- **Escalado de recursos** (HPA, límites de CPU/memoria): requiere aprobación del equipo de plataforma. El escalado de emergencia durante un incidente activo es una excepción y debe registrarse en el ticket de incidente.

## Proceso de despliegue seguro

1. Confirmar que los tests de integración pasan en staging.
2. Desplegar con `kubectl rollout` y estrategia `RollingUpdate`. Mantener `maxUnavailable: 0` para servicios P0.
3. Monitorear las métricas de latencia y tasa de error durante los primeros 15 minutos.
4. Si la tasa de errores supera el 1 % o la latencia P99 supera el SLO, ejecutar rollback inmediato: `kubectl rollout undo deployment/<nombre>`.

## Ventana de cambios

Los cambios de alto riesgo (nuevas dependencias externas, cambios de esquema de base de datos, modificaciones de red) solo se ejecutan en la ventana de cambios: martes y jueves de 10:00 a 13:00 hora local, con al menos dos ingenieros disponibles.

## Rollback

El rollback debe poder completarse en menos de 5 minutos. Antes de cualquier despliegue, verificar que existe una imagen anterior funcional en el registro de contenedores y que el comando de rollback está documentado en el runbook del servicio.

## Registro de cambios

Todo cambio en producción debe registrarse con: autor, fecha y hora, descripción del cambio, resultado (exitoso/rollback), y referencia al ticket o PR. Los registros son la fuente de verdad para la investigación de incidentes post-mortem.
