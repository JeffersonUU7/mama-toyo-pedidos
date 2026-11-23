#!/usr/bin/env bash
# Genera la evidencia de la Fase 3 (balanceo + failover + logs) en docs/evidencias/fase3/evidencia-fase3.txt
# Requisitos: clúster levantado (docker compose up -d) y certs/ generados.
# Uso (desde la raiz del repo, en Git Bash):  bash docs/pruebas/evidencias-fase3.sh
cd "$(dirname "$0")/../.." || exit 1
DIR=docs/evidencias/fase3
OUT="$DIR/evidencia-fase3.txt"
mkdir -p "$DIR"
: > "$OUT"

URL=https://localhost:8443
POST='{"cliente":"Evidencia","items":[{"platoId":1,"cantidad":1}]}'

titulo() { { echo; echo "=================================================================="; echo "$*"; echo "=================================================================="; } | tee -a "$OUT"; }
logs_nginx() { docker compose logs nginx --no-log-prefix --since "$1" 2>&1 | grep -E '^ts=|\[error\]|\[warn\]' | tail -n "$2" | tee -a "$OUT"; }

{ echo "EVIDENCIA FASE 3 - Cluster Mama Toyo"; echo "Fecha: $(date)"; } | tee -a "$OUT"

titulo "1. Contenedores del cluster (2 nodos + Apache por nodo + Nginx + PostgreSQL)"
docker compose ps 2>&1 | tee -a "$OUT"

titulo "2. Health check de cada nodo (/api/health y /api/ready)"
for i in 1 2 3 4; do curl -sk -m 5 $URL/api/health | tee -a "$OUT"; echo | tee -a "$OUT"; done
curl -sk -m 5 $URL/api/ready | tee -a "$OUT"; echo | tee -a "$OUT"

titulo "3. Balanceo round-robin: 6 peticiones alternan nodo-1 y nodo-2"
for i in 1 2 3 4 5 6; do curl -sk -m 5 $URL/api/health | tee -a "$OUT"; echo | tee -a "$OUT"; done
echo "--- Log de Nginx (campo node= muestra quien atendio) ---" | tee -a "$OUT"
logs_nginx 1m 8

titulo "4. FAILOVER: se detiene app1 (nodo-1)"
docker compose stop app1 2>&1 | tee -a "$OUT"
sleep 2
docker compose ps 2>&1 | tee -a "$OUT"
echo "--- 8 peticiones GET: todas deben responder, ahora solo nodo-2 ---" | tee -a "$OUT"
for i in 1 2 3 4 5 6 7 8; do curl -sk -m 10 $URL/api/health | tee -a "$OUT"; echo | tee -a "$OUT"; done
echo "--- 6 POST /api/pedidos con un nodo caido: deben ser seis 201 ---" | tee -a "$OUT"
for i in 1 2 3 4 5 6; do curl -sk -m 10 -o /dev/null -w "%{http_code} " -X POST $URL/api/pedidos -H 'Content-Type: application/json' -d "$POST" | tee -a "$OUT"; done; echo | tee -a "$OUT"
echo "--- Log de Nginx durante la caida (ust=503, 201 = reintento en el otro nodo) ---" | tee -a "$OUT"
logs_nginx 2m 20
echo "--- Log de Apache del nodo caido (apache1) ---" | tee -a "$OUT"
docker compose logs apache1 --no-log-prefix --since 2m 2>&1 | tail -n 10 | tee -a "$OUT"

titulo "5. RECUPERACION: se vuelve a levantar app1"
docker compose start app1 2>&1 | tee -a "$OUT"
echo "(esperando 20 s: healthcheck de Docker + fail_timeout de Nginx)" | tee -a "$OUT"
sleep 20
docker compose ps 2>&1 | tee -a "$OUT"
for i in 1 2 3 4; do curl -sk -m 5 $URL/api/health | tee -a "$OUT"; echo | tee -a "$OUT"; done
echo "--- Log de Nginx tras la recuperacion (vuelven a aparecer nodo-1 y nodo-2) ---" | tee -a "$OUT"
logs_nginx 1m 8

titulo "FIN - evidencia guardada en $OUT"
