# Enterprise Agent Concept Submission

**Equipo:** Corex 1
**Proyecto:** Agente SRE Autónomo para Diagnóstico y Autorremediación en infraestructuras de Kubernetes
**Archivo fuente:** Caso_de_Usos.docx, "Caso de Uso 1" + formulario de registro del evento (ambos forman una sola postulación)

> **Nota:** el archivo fuente contiene dos casos de uso. Este documento normaliza únicamente el primero.
> Normalizado: contenido literal del equipo, en su idioma original. Los campos no respondidos aparecen marcados como `[FALTANTE]`. No se ha inferido ni completado ningún campo.

---

## Agent Name & Business Purpose

**Nombre:** Agente SRE Autónomo para Diagnóstico y Autorremediación en infraestructuras de Kubernetes.

**Propósito:** El agente de IA reduce drásticamente el Tiempo Medio de Resolución (MTTR) al interactuar autónomamente con el entorno.

---

## Agent Pattern

`[FALTANTE]` — No se declara si el agente es de recuperación documental, de consulta estructurada, o híbrido.

---

## Your Team & Organization

- **Company:** Bancolombia
- **Unidad de negocio:** Ingeniería de Software
- **Team name:** Corex 1
- **País / estado de registro:** CO / Attending
- **Contacto de registro:** John Mauricio Carmona Escobar — Ingeniería de Software — johncarm@bancolombia.com.co

**Team roster asignado a Corex 1 (6 integrantes):**

| Nombre | Email |
|---|---|
| Laura Cecilia Sánchez Espinosa | lacsanch@bancolombia.com.co |
| Yanier Enrique Mestra Rodríguez | ymestra@bancolombia.com.co |
| Sebastián Quintero Osorio | sequint@bancolombia.com.co |
| Cristian Alexis Lopera Bedoya | craloper@bancolombia.com.co |
| David Santiago Guerrero Martínez | daviguer@bancolombia.com.co |
| Russbell Noreña Mejía | rnorena@bancolombia.com.co |

> **División provisional.** El registro agrupa a 11 personas bajo un único equipo "Corex", del que se derivaron dos casos de uso independientes. El organizador dividió el grupo por orden de lista para tratar cada caso de uso como un equipo distinto. Esta asignación es provisional: el equipo debe confirmarla o corregirla.

> **Tamaño del equipo:** 6 — excede el rango de 3 a 5. Con 11 personas no es posible repartir en dos equipos que queden ambos dentro del rango; con cualquier división uno de los dos queda por encima. Considerar si algún integrante se reasigna o no participa.

- **Bootcamp roles** (datos y recuperación / herramientas / memoria y prompts / demo): `[FALTANTE]` — el registro aporta cargos laborales, no roles del bootcamp. Sigue pendiente que el equipo los asigne.

---

## Target Users Within Your Organization

- **Primary users:** `[FALTANTE]`
- **Department(s):** `[FALTANTE]`
- **Estimated user count:** `[FALTANTE]`

---

## Business Problem Being Solved

"Un ecosistema de microservicios experimenta una degradación de servicio crítica (alta latencia y errores HTTP 500) en producción. Se requiere identificar rápidamente si el fallo se origina en el código, en la configuración de la infraestructura o en el agotamiento de recursos externos, evitando la revisión manual de múltiples paneles de monitoreo y trazas durante un incidente activo."

- **Current state:** PARCIAL — se describe implícitamente como "la revisión manual de múltiples paneles de monitoreo y trazas durante un incidente activo". No se detalla el proceso actual ni quién lo ejecuta.
- **Time/cost impact:** `[FALTANTE]` — se nombra el MTTR como indicador afectado, sin línea base, volumen de incidentes ni costo.
- **Expected improvement:** "reduce drásticamente el Tiempo Medio de Resolución (MTTR)" — sin cuantificar.

---

## Core Capabilities (2-3)

> **FUERA DE RANGO** — La guía pide de 2 a 3. El documento enumera cuatro:

1. **Correlación automática:** Conecta eventos aparentemente aislados (una alerta de latencia web, un escalado agresivo del clúster y el agotamiento del pool de conexiones de una base de datos).
2. **Identificación de causa raíz:** Aísla el origen exacto del fallo analizando métricas, trazas distribuidas y manifiestos de configuración.
3. **Autorremediación en tiempo real:** Ejecuta acciones de mitigación inmediatas para estabilizar el sistema, como aplicar parches para limitar el escalado y reiniciar servicios saturados.
4. **Propuestas estructurales:** Genera recomendaciones arquitectónicas a largo plazo para prevenir la recurrencia del incidente.

---

## Required Tools (2-3 maximum)

`[FALTANTE]` — No se declara ninguna herramienta con nombre, fuente de datos y confirmación de acceso.

> **Nota de normalización:** de las capacidades descritas se desprenden al menos cuatro integraciones distintas (métricas, trazas distribuidas, manifiestos de configuración, y ejecución de acciones sobre el clúster). No se declaran como herramientas ni se confirma acceso a ninguna.

---

## Data Details

- **Source:** `[FALTANTE]` — se mencionan métricas, trazas distribuidas y manifiestos de configuración como insumos, sin nombrar ningún sistema, plataforma ni repositorio.
- **Content type:** `[FALTANTE]`
- **Size:** `[FALTANTE]`
- **Format:** `[FALTANTE]`
- **Collection name and schema (campos clave y tipos):** `[FALTANTE]`
- **Structured data source route:** `[FALTANTE]`
- **Access status:** `[FALTANTE]`
- **Data classification:** `[FALTANTE]`
- **Data owner & approval:** `[FALTANTE]`

---

## Sample Queries

`[FALTANTE]` — No se incluye ninguna pregunta de ejemplo.

---

## Memory Requirements

`[FALTANTE]` — No se aborda qué debe recordar el agente entre sesiones, qué contexto es relevante, ni la retención.

---

## Success Criteria & Business Metrics

- **Definition of done (día del bootcamp):** `[FALTANTE]`
- **Primary metric:** PARCIAL — se nombra el MTTR como el indicador que el agente busca reducir, sin línea base, meta ni método de medición.
- **User satisfaction:** `[FALTANTE]`
- **Adoption target:** `[FALTANTE]`

---

## Sample Business Interaction

`[FALTANTE]` — No se incluye ningún intercambio de ejemplo entre usuario y agente.

---

## Stakeholder Alignment

- **Manager approval:** `[FALTANTE]`
- **Data owner approval:** `[FALTANTE]`
- **IT/Security awareness:** `[FALTANTE]`

---

## Post-Bootcamp Plan

- **Deployment environment:** `[FALTANTE]`
- **Rollout plan:** `[FALTANTE]`
- **Support responsibility:** `[FALTANTE]`
