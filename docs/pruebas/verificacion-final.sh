#!/usr/bin/env bash
# Verificacion final del cluster. Guarda todo en docs/evidencias/final/verificacion-final.txt
# Uso (raiz del repo, Docker Desktop abierto, cluster normal levantado con "docker compose up -d"):
#   bash docs/pruebas/verificacion-final.sh
cd "$(dirname "$0")/../.." || exit 1
DIR=docs/evidencias/final
OUT="$DIR/verificacion-final.txt"
mkdir -p "$DIR"
: > "$OUT"
URL=https://localhost:8443
POST='{"cliente":"Verificacion final","items":[{"platoId":1,"cantidad":1}]}'

t() { { echo; echo "=================================================================="; echo "$*"; echo "=================================================================="; } | tee -a "$OUT"; }
listo() { for i in $(seq 1 45); do curl -sk -m 3 $URL/api/ready | grep -q '"ready"' && return 0; sleep 2; done; return 1; }
numero() { sed -n 's/.*"numero":\([0-9]*\).*/\1/p' | head -n 1; }

{ echo "VERIFICACION FINAL - Mama Toyo"; echo "Fecha: $(date)"; } | tee -a "$OUT"
listo || { echo "El cluster no responde: levantalo con docker compose up -d" | tee -a "$OUT"; exit 1; }

t "1. Contenedores"
docker compose ps 2>&1 | tee -a "$OUT"

t "2. HTTPS y redireccion (8080 -> 8443)"
curl -si -m 5 http://localhost:8080/api/menu | head -n 3 | tee -a "$OUT"
echo "Codigo por HTTPS: $(curl -sk -m 5 -o /dev/null -w '%{http_code}' $URL/api/menu)" | tee -a "$OUT"

t "3. Balanceo: 6 peticiones alternan los nodos"
for i in 1 2 3 4 5 6; do curl -sk -m 5 $URL/api/health | tee -a "$OUT"; echo | tee -a "$OUT"; done
curl -sk -m 5 $URL/api/ready | tee -a "$OUT"; echo | tee -a "$OUT"

t "4. Validacion y seguridad de la API"
echo "POST sin datos (esperado 400): $(curl -sk -m 5 -o /dev/null -w '%{http_code}' -X POST $URL/api/pedidos -H 'Content-Type: application/json' -d '{}')" | tee -a "$OUT"
echo "Cocina sin clave (esperado 401): $(curl -sk -m 5 -o /dev/null -w '%{http_code}' $URL/api/cocina)" | tee -a "$OUT"
echo "Cocina con clave (esperado 200): $(curl -sk -m 5 -o /dev/null -w '%{http_code}' -u cocina:toyo2026 $URL/api/cocina)" | tee -a "$OUT"
N=$(curl -sk -m 5 -X POST $URL/api/pedidos -H 'Content-Type: application/json' -d "$POST" | numero)
echo "Pedido creado, numero: $N" | tee -a "$OUT"
echo "Consulta del pedido (esperado 200): $(curl -sk -m 5 -o /dev/null -w '%{http_code}' $URL/api/pedidos/$N)" | tee -a "$OUT"
echo "Marcar listo con clave (esperado 200): $(curl -sk -m 5 -o /dev/null -w '%{http_code}' -u cocina:toyo2026 -X PATCH $URL/api/pedidos/$N -H 'Content-Type: application/json' -d '{"estado":"listo"}')" | tee -a "$OUT"

t "5. Failover con app1 detenido (codigo y segundos de cada peticion)"
docker compose stop app1 2>&1 | tee -a "$OUT"
for i in 1 2 3 4 5 6 7 8; do curl -sk -m 12 -o /dev/null -w "GET  %{http_code}  %{time_total}s\n" $URL/api/health | tee -a "$OUT"; done
for i in 1 2 3 4 5 6; do curl -sk -m 12 -o /dev/null -w "POST %{http_code}  %{time_total}s\n" -X POST $URL/api/pedidos -H 'Content-Type: application/json' -d "$POST" | tee -a "$OUT"; done
docker compose start app1 2>&1 | tee -a "$OUT"
echo "(esperando 20 s a que app1 vuelva)" | tee -a "$OUT"; sleep 20
for i in 1 2 3 4; do curl -sk -m 5 $URL/api/health | tee -a "$OUT"; echo | tee -a "$OUT"; done

t "6. Persistencia: el pedido sobrevive a docker compose down / up"
P=$(curl -sk -m 5 -X POST $URL/api/pedidos -H 'Content-Type: application/json' -d "$POST" | numero)
echo "Pedido creado antes de apagar: $P" | tee -a "$OUT"
docker compose down 2>&1 | tail -n 3 | tee -a "$OUT"
docker compose up -d 2>&1 | tail -n 3 | tee -a "$OUT"
listo || echo "ATENCION: el cluster tardo demasiado en volver" | tee -a "$OUT"
echo "Consulta del pedido $P despues de reiniciar (esperado 200): $(curl -sk -m 5 -o /dev/null -w '%{http_code}' $URL/api/pedidos/$P)" | tee -a "$OUT"

t "7. Monitoreo (ultimos 10 minutos)"
bash docs/pruebas/monitoreo.sh 10m 2>&1 | tee -a "$OUT"

t "FIN - guardado en $OUT"
