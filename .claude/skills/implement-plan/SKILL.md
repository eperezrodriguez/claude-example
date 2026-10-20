---
name: implement-plan
description: Implementa un plan de `plans/` (generado con plan-feature) en un git worktree aislado, tarea a tarea con TDD estricto, un commit por tarea y marcándola como hecha en el plan. Úsala cuando el usuario pida implementar, ejecutar o desarrollar un plan.
argument-hint: [ruta del plan, p. ej. plans/error-middleware.md]
allowed-tools: Read, Edit, Write, Grep, Glob, Bash, AskUserQuestion
---

## Tarea

Implementa el plan: $ARGUMENTS

### 1. Preparación

1. Localiza el plan. Si no se indica ruta, lista `plans/` y pregunta cuál con `AskUserQuestion`. Si no existe, avisa y para.
2. Lee el plan completo, `AGENTS.md` y la documentación de `docs/` relevante. Respeta la arquitectura por capas y las convenciones (clases, `snake_case`, `'use strict'`, JSDoc en español).
3. Si el plan es ambiguo o alguna tarea no se puede hacer tal cual, pregunta al usuario antes de continuar.
4. Crea el worktree desde la rama actual:
   `git worktree add .claude/worktrees/<nombre-plan> -b <tipo>/<nombre-plan>` (`<tipo>` = feat, fix o refactor, según el plan; `<nombre-plan>` = nombre del fichero sin extensión). Si la rama o el directorio ya existen, pregunta si reutilizarlos.
5. Trabaja **siempre dentro del worktree** a partir de aquí (rutas absolutas o `git -C`). Ejecuta `npm install` en él si hace falta.
6. Si `plans/<plan>.md` no está versionado (untracked), cópialo al worktree: el plan que se edita y se commitea es la copia del worktree.
7. Comprueba que la línea base es válida: `node --test` debe pasar (o no haber tests aún) antes de empezar. Si falla, avisa al usuario.

### 2. Bucle por tarea

Recorre las tareas **en orden**, saltando las ya marcadas `[x]`. Para cada una:

1. **Rojo:** escribe primero el test que describe el comportamiento de la tarea (ejecutor nativo `node --test`, ficheros `*.test.js`, mismo estilo de clases y JSDoc). Ejecútalo y **comprueba que falla por la razón esperada**. No escribas código de producción antes de ver el test en rojo.
2. **Verde:** escribe el mínimo código necesario para que pase. Ejecuta el test.
3. **Refactor:** limpia sin cambiar comportamiento y ejecuta **toda** la suite (`node --test`); debe estar en verde.
4. Si la tarea no es testeable con tests automáticos (p. ej. solo documentación o configuración), indícalo explícitamente y verifícala de la forma más objetiva posible (grep, arrancar la API...). No uses esto como excusa para saltarte TDD en código.
5. **Marca la tarea** como hecha en el plan (`- [ ]` → `- [x]`).
6. **Commit** (uno por tarea) con test, código y plan actualizado juntos. Añade los ficheros por nombre (nunca `git add -A`, ni `.env` ni `data/`). Formato Conventional Commits como en `.claude/commands/commit.md`: descripción en español, imperativo, ≤ 72 caracteres, y pie `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. No pidas confirmación del mensaje en cada tarea. Sin `--no-verify`, `--amend` ni `git push`.
7. Pasa a la siguiente tarea.

Si una tarea falla de forma persistente (tras 2-3 intentos razonables) o descubres que el plan es incorrecto, **detente y pregunta** al usuario; no cambies el plan en silencio.

### 3. Criterios de aceptación

Cuando todas las tareas estén `[x]`:

1. Verifica **cada** criterio de aceptación con una comprobación real (tests, `curl` contra la API arrancada, `grep`...) y ejecuta la suite completa.
2. Marca como `[x]` solo los criterios comprobados. Si alguno no se cumple, añade el trabajo necesario siguiendo el mismo ciclo TDD y commit, o pregunta al usuario si el criterio es dudoso.
3. Commit final del plan si solo cambió el plan: `docs(plans): marcar criterios de aceptación de <plan>`.

### 4. Limpiar la issue de origen

Solo si todas las tareas y todos los criterios están `[x]` (verificados):

1. Busca en el plan una línea `**Origen:** scripts/issues.json — <título de la issue>`. Si no existe, el plan no viene de `issues.json`: omite este paso. Si el plan lo menciona de otra forma o hay dudas, pregunta al usuario.
2. En la copia de `scripts/issues.json` **del worktree**, elimina el objeto cuyo `title` coincida exactamente con `<título de la issue>`. Conserva el formato del fichero (indentación de 2 espacios, arrays en una línea, sin tocar el resto de issues) y comprueba que el JSON sigue siendo válido (`node -e "JSON.parse(require('fs').readFileSync('scripts/issues.json','utf8'))"`). Si no encuentras la issue, avisa y no cambies nada.
3. Commit: `chore(issues): eliminar issue "<título>" ya implementada`, con el pie de `Co-Authored-By`. Solo `scripts/issues.json`.

### 5. Cierre

Informa de forma concisa: ruta y rama del worktree, commits creados, si se eliminó la issue de `scripts/issues.json`, resultado de los tests y estado de cada criterio. Indica que el trabajo sigue en el worktree sin fusionar ni subir; ofrece fusionar/PR o eliminar el worktree (`git worktree remove`), pero **no lo hagas sin que el usuario lo pida**.

Después, notifica por Slack con `mcp__slack__slack_post_message` en el canal `revisar-plan` (`channel_id` `C0CA82QUQ3F`): un único mensaje corto con el nombre del plan, la rama, el número de commits, el resultado de los tests y cuántos criterios se cumplen (`n/total`). Si el envío falla, díselo al usuario sin reintentar en otro canal.

### Reglas

- Una tarea = un ciclo rojo/verde/refactor = un commit.
- Nunca código de producción sin un test previo en rojo.
- No hagas más de lo que dice la tarea ni modifiques el repositorio principal fuera del worktree.
- Si añades o cambias un documento de `docs/`, actualiza su índice en `AGENTS.md`.
- Escribe en español y sé conciso.
