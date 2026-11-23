#!/usr/bin/env bash
# Ejecuta una prueba de k6 (en Docker) y guarda el RESUMEN en docs/pruebas/resultados/<prueba>-<etiqueta>.json
# (el resumen pesa unos KB; la salida cruda de k6 puede pesar decenas de MB y no se guarda).
#
# Uso (desde la raíz del repo, con el clúster levantado):
#   bash docs/pruebas/correr-pruebas.sh <prueba> <etiqueta> [pico]
#   prueba   = carga-progresiva | carga-flujo-completo
#   etiqueta = 2nodos | 1nodo   (solo para nombrar el archivo)
#   pico     = usuarios virtuales máximos (por defecto 400)
# Ejemplo:  bash docs/pruebas/correr-pruebas.sh carga-flujo-completo 2nodos 400
set -euo pipefail
PRUEBA="${1:?Falta la prueba: carga-progresiva | carga-flujo-completo}"
ETIQUETA="${2:?Falta la etiqueta: 2nodos | 1nodo}"
PICO="${3:-400}"
[ -f "docs/pruebas/scripts/${PRUEBA}.js" ] || { echo "No existe docs/pruebas/scripts/${PRUEBA}.js" >&2; exit 1; }
mkdir -p docs/pruebas/resultados
SALIDA="resultados/${PRUEBA}-${ETIQUETA}-${PICO}vus.json"

echo ">> ${PRUEBA} | ${ETIQUETA} | pico ${PICO} usuarios virtuales"
# MSYS_NO_PATHCONV evita que Git Bash (Windows) altere las rutas /pruebas dentro del contenedor
MSYS_NO_PATHCONV=1 docker run --rm -i \
  -v "$PWD/docs/pruebas:/pruebas" \
  -e PICO="$PICO" \
  grafana/k6 run --summary-export="/pruebas/${SALIDA}" "/pruebas/scripts/${PRUEBA}.js"
echo ">> Resumen guardado en docs/pruebas/${SALIDA}"
