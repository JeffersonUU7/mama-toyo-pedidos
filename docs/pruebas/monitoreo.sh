#!/usr/bin/env bash
# Resumen de monitoreo del clúster, a partir de lo que Nginx anota en su log (formato "cluster" en nginx/nginx.conf).
# Uso (desde la raíz del repo, con el clúster levantado):
#   bash docs/pruebas/monitoreo.sh          # últimos 10 minutos
#   bash docs/pruebas/monitoreo.sh 1h       # última hora (cualquier valor de --since de docker: 30m, 2h...)
DESDE="${1:-10m}"

echo "=== Estado de los contenedores ==="
docker compose ps --format 'table {{.Service}}\t{{.Status}}'

echo
echo "=== Salud de cada nodo (/api/ready: ¿puede hablar con PostgreSQL?) ==="
for i in 1 2 3 4; do curl -sk -m 5 https://localhost:8443/api/ready; echo; done | sort | uniq -c

echo
echo "=== Uso de recursos (instantánea) ==="
docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}'

echo
echo "=== Peticiones de los últimos $DESDE (según el log de Nginx) ==="
TMP="$(mktemp)"
docker compose logs nginx --no-log-prefix --since "$DESDE" 2>/dev/null | grep '^ts=' | awk '
{
  st = ""; rt = 0; nodo = ""
  for (i = 1; i <= NF; i++) {
    if ($i ~ /^status=/) { split($i, a, "="); st = a[2] }
    if ($i ~ /^rt=/)     { split($i, a, "="); rt = a[2] + 0 }
    if ($i ~ /^node=/)   { split($i, a, "="); nodo = a[2] }
  }
  if (nodo == "" || nodo == "-") nodo = "sin-nodo"
  print st, nodo, rt
}' > "$TMP"

TOTAL=$(wc -l < "$TMP")
if [ "$TOTAL" -eq 0 ]; then echo "No hay peticiones en ese periodo."; rm -f "$TMP"; exit 0; fi

# p95 sin depender de funciones exclusivas de gawk: se ordenan los tiempos y se toma el del 95 %
P95=$(awk '{print $3}' "$TMP" | sort -n | awk -v n="$TOTAL" 'BEGIN{k=int(n*0.95); if(k<1)k=1} NR==k{print $1*1000}')
awk -v p95="$P95" '
{ total++; est[$1]++; nodo[$2]++; suma += $3; if ($3 > max) max = $3
  if ($1 ~ /^5/) e5++; if ($1 == 429) lim++; if ($1 == 401) sc++ }
END {
  printf "Total: %d | tiempo medio: %.0f ms | p95: %.0f ms | maximo: %.0f ms\n", total, suma/total*1000, p95, max*1000
  printf "Errores 5xx: %d | limitadas por exceso de peticiones (429): %d | sin clave de cocina (401): %d\n", e5+0, lim+0, sc+0
  print "Por codigo de respuesta:"; for (s in est) printf "  %s: %d\n", s, est[s]
  print "Por nodo (sin-nodo = redireccion, login o error antes de llegar a un nodo):"; for (n in nodo) printf "  %s: %d\n", n, nodo[n]
}' "$TMP"
rm -f "$TMP"
