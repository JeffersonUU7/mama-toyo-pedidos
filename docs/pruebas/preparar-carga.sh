#!/usr/bin/env bash
# Genera nginx/nginx.carga.conf a partir de nginx/nginx.conf, cambiando SOLO el límite de escrituras.
# Así la configuración de carga nunca se desfasa de la real. Ejecutar desde la raíz del repositorio.
set -euo pipefail
sed 's#rate=30r/s#rate=100000r/s#' nginx/nginx.conf > nginx/nginx.carga.conf
if diff -q nginx/nginx.conf nginx/nginx.carga.conf >/dev/null; then
  echo "ERROR: no se encontró 'rate=30r/s' en nginx/nginx.conf; revisa el límite de escrituras." >&2
  exit 1
fi
echo "Generado nginx/nginx.carga.conf. Ahora levanta el clúster con:"
echo "  docker compose -f docker-compose.yml -f docker-compose.carga.yml up -d --build"
