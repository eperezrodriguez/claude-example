---
description: Crea un commit siguiendo el formato Conventional Commits
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), AskUserQuestion, Write
argument-hint: [pista opcional sobre el cambio]
---

## Contexto

- Inicializa git si es necesario: !`git rev-parse --git-dir 2>/dev/null || git init`
- ¿Existe .gitignore?: !`test -f .gitignore && echo "sí" || echo "no"`
- Estado: !`git status --short`
- Cambios (staged y unstaged): !`git diff HEAD 2>/dev/null || git diff`
- Commits recientes: !`git log --oneline -5 2>/dev/null || echo "Sin commits previos"`

## Tarea

Crea un único commit con los cambios actuales siguiendo la especificación [Conventional Commits 1.0.0](https://www.conventionalcommits.org/es/v1.0.0/).

Pista del usuario (opcional): $ARGUMENTS

### Formato

```
<tipo>(<ámbito opcional>)<!>: <descripción>

[cuerpo opcional]

[pie(s) opcional(es)]
```

- **Tipos permitidos:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **Ámbito:** opcional, en minúsculas y entre paréntesis; usa la capa o el recurso afectado (`controllers`, `vendehumo`, `database`, `config`...).
- **Descripción:** en español, imperativo, minúscula inicial, sin punto final y de 72 caracteres como máximo.
- **Cuerpo:** solo si hace falta explicar el porqué; separado por una línea en blanco.
- **Cambio incompatible:** añade `!` tras el tipo/ámbito y un pie `BREAKING CHANGE: <explicación>`.
- Termina el mensaje con este pie:
  `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`

### Pasos

1. Si no existe `.gitignore`, créalo en la raíz **antes de mirar los cambios** con este contenido mínimo y añádelo al commit (si ya existe, no lo modifiques):
   ```
   node_modules/
   dist/
   .angular/
   .env
   .env.*
   *.db
   *.log
   .DS_Store
   ```
   Tras crearlo, vuelve a ejecutar `git status --short` para ignorar lo que ahora queda excluido.
2. Si no hay cambios, díselo al usuario y no hagas nada más.
3. Si hay cambios sin añadir al área de preparación (staging) y nada preparado, añade los ficheros relevantes por nombre. No uses `git add -A` ni añadas secretos, `.env` ni `data/`.
4. Si los cambios mezclan propósitos distintos, avisa al usuario y propón dividirlos en varios commits en lugar de agruparlos.
5. Elige el tipo según el cambio real (no todo es `feat`) y redacta el mensaje.
6. Muestra al usuario el mensaje sugerido y pregúntale con `AskUserQuestion` si es correcto (opciones: «Sí, continuar» y «No, quiero editarlo»).
   - Si responde que sí, continúa con el paso 7.
   - Si responde que no, pídele el mensaje corregido (o los cambios que quiere), aplícalo y vuelve a preguntar hasta que lo confirme. No hagas el commit sin confirmación.
7. Ejecuta `git commit` pasando el mensaje confirmado con un heredoc. No uses `--no-verify` ni `--amend`, y no hagas `git push`.
8. Muestra al usuario el mensaje final del commit.
