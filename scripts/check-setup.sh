#!/usr/bin/env sh
set -eu

missing=0
for command_name in node npm wireshark tshark docker; do
  if command -v "$command_name" >/dev/null 2>&1; then
    version=$($command_name --version 2>&1 | head -n 1)
    printf '✓ %-10s %s\n' "$command_name" "$version"
  else
    printf '✗ %-10s no encontrado (puede ser opcional; consulta README.md)\n' "$command_name"
    missing=1
  fi
done

if [ "$missing" -eq 0 ]; then
  printf '\nTodo listo para la campaña.\n'
else
  printf '\nLa web solo requiere Node/npm. Wireshark, TShark y Docker habilitan los labs.\n'
fi
