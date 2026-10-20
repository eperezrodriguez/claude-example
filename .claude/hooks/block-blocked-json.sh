#!/bin/bash
# Hook PreToolUse: impide leer o modificar scripts/blocked.json.
# Recibe el evento por stdin (JSON). Salir con código 2 bloquea la llamada
# y muestra stderr a Claude.

input=$(cat)
tool=$(jq -r '.tool_name // empty' <<<"$input")

case "$tool" in
  Read|Edit|Write|NotebookEdit)
    target=$(jq -r '.tool_input.file_path // empty' <<<"$input")
    ;;
  Grep|Glob)
    target=$(jq -r '[.tool_input.path, .tool_input.pattern, .tool_input.glob] | map(. // "") | join(" ")' <<<"$input")
    ;;
  Bash)
    target=$(jq -r '.tool_input.command // empty' <<<"$input")
    ;;
  *)
    exit 0
    ;;
esac

if [[ "$target" == *scripts/blocked.json* ]]; then
  echo "Bloqueado: scripts/blocked.json no se puede leer ni modificar." >&2
  exit 2
fi

exit 0
