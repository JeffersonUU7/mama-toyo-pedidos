#!/usr/bin/env bash
# Ejecuta de principio a fin la seccion 13 de docs/PRUEBAS_DE_CARGA.md y escribe los resultados reales en la documentacion.
# Uso (raiz del repo, Docker Desktop abierto, certificado generado, nada mas pesado corriendo):
#   bash docs/pruebas/ejecutar-seccion13.sh
# Pasos: levanta el cluster con la configuracion de carga, corre 3 pruebas de k6 (2 nodos, 2 nodos progresiva, 1 nodo),
# vuelve al cluster normal y llama a completar-seccion13.js, que rellena 13.4 y el estado del proyecto con los numeros obtenidos.
cd "$(dirname "$0")/../.." || exit 1
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.carga.yml"

restaurar() { $COMPOSE start apache2 app2 >/dev/null 2>&1; }
trap restaurar EXIT

esperar_listo() {
  for i in $(seq 1 45); do
    curl -sk -m 5 https://localhost:8443/api/ready | grep -q '"ready"' && return 0
    sleep 2
  done
  echo "ERROR: el cluster no quedo listo; revisa docker compose ps" >&2
  return 1
}

correr() {
  # k6 sale con codigo distinto de 0 si no se cumple un umbral; el resumen se guarda igual y se reporta despues
  bash docs/pruebas/correr-pruebas.sh "$@" || echo ">> k6 termino con umbrales sin cumplir; el resumen se registra igual"
}

echo "== 1/5 Levantando el cluster con la configuracion de carga =="
bash docs/pruebas/preparar-carga.sh || exit 1
$COMPOSE up -d --build || exit 1
esperar_listo || exit 1

echo "== 2/5 Flujo completo, 2 nodos, 400 usuarios =="
correr carga-flujo-completo 2nodos 400
echo "== 3/5 Progresiva sobre /api/health, 2 nodos, 400 usuarios =="
correr carga-progresiva 2nodos 400

echo "== 4/5 Flujo completo, 1 nodo (se detiene apache2 + app2), 400 usuarios =="
$COMPOSE stop apache2 app2
sleep 5
correr carga-flujo-completo 1nodo 400
$COMPOSE start apache2 app2

echo "== 5/5 Volviendo al cluster normal y escribiendo resultados en la documentacion =="
$COMPOSE down
docker compose up -d
esperar_listo || exit 1
node docs/pruebas/completar-seccion13.js
echo "Listo. Revisa: git diff docs/PRUEBAS_DE_CARGA.md"
