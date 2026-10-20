---
name: plan-feature
description: Planifica un nuevo desarrollo, una corrección de código o un refactor generando un plan con objetivo, tareas de 5-10 minutos y criterios de aceptación. Úsala cuando el usuario pida planificar, diseñar o desglosar un cambio antes de implementarlo.
argument-hint: [descripción del cambio]
allowed-tools: Read, Grep, Glob, AskUserQuestion, mcp__slack__slack_post_message
---

## Tarea

Genera un plan para: $ARGUMENTS

**No implementes nada ni modifiques archivos del proyecto**: solo planifica.

### Pasos

1. Si la petición es ambigua o falta información clave, pregunta al usuario antes de continuar.
2. Lee `AGENTS.md` y busca en `docs/` la documentación del tipo de componente afectado; el plan debe respetar sus directrices y la arquitectura por capas (routes → controllers → services → repositories).
3. Explora el código relacionado (Grep/Glob/Read) para que las tareas citen archivos reales. Detecta si el cambio afecta a algún endpoint de la API (consulta `docs/api-docs/openapi.yaml` si existe) para aplicar la regla de documentación de la API.
4. Clasifica el cambio como `feature`, `fix` o `refactor`.
5. Rellena [template.md](assets/template.md) respetando su estructura exacta.
6. Muestra el plan al usuario y pregunta si lo aprueba o quiere modificarlo.
7. Cuando el usuario apruebe el plan, notifica por Slack con `mcp__slack__slack_post_message` en el canal `revisar-plan` (`channel_id` `C0CA82QUQ3F`): un mensaje corto con el título del plan, su tipo y el número de tareas. Si el envío falla, díselo al usuario sin reintentar en otro canal.

### Reglas

- **Origen:** si la petición viene de una issue de `scripts/issues.json`, rellena la línea `**Origen:**` con `scripts/issues.json — <título exacto de la issue>`, tal cual aparece en el fichero (`implement-plan` la usa para eliminarla al terminar). Si no viene de ahí, borra la línea.
- **Objetivo:** 1-3 frases, qué y por qué.
- **Tareas:** ordenadas por dependencia, una acción concreta por tarea y de **5-10 minutos como máximo**. Si una tarea requiere más, divídela. Indica el archivo afectado y el tiempo estimado.
- **Criterios de aceptación:** verificables y observables (códigos HTTP, respuestas, comportamiento, tests con `node --test` si aplica). Sin criterios vagos como «funciona bien».
- **Documentación de la API:** si el cambio añade, modifica o elimina un endpoint (rutas, métodos, parámetros, cuerpos, respuestas, códigos de estado, roles o autenticación), el plan **debe incluir** una tarea (~5-10 min por grupo de endpoints) que actualice `docs/api-docs/openapi.yaml` y un criterio de aceptación verificable, por ejemplo: el endpoint aparece (o desaparece) en `paths`, con sus esquemas, `security` y roles, y `npx @redocly/cli lint docs/api-docs/openapi.yaml` termina con 0 errores. Esa tarea va después de las de implementación. Si el cambio no toca la API, no la incluyas.
- Escribe en español y sé conciso.
