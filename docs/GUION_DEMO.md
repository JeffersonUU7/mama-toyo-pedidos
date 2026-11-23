# Guion de la demo y de la defensa (Ronda 3)

Duración propuesta: **unos 15 minutos** (ajustable). Cada bloque tiene un responsable, lo que se hace, lo que debe verse y lo que
se dice. Los comandos se copian tal cual en Git Bash, **desde la carpeta del repositorio**. Los tiempos y el reparto son una
propuesta: el equipo puede cambiarlos, pero conviene que cada quien presente lo suyo y sepa explicar el resto.

Datos de acceso de desarrollo para la cocina: usuario `cocina`, contraseña `toyo2026`.

## 0. Antes de empezar (10 minutos antes, todo el equipo)

```bash
git checkout main && git pull
bash certs/generar-certificado.sh          # solo si no existen certs/server.crt y certs/server.key
docker compose down                        # sin -v: se conservan los pedidos
docker compose up --build -d
docker compose ps                          # db, app1, app2 en "healthy"; apache1, apache2 y nginx en "Up"
```

Lista de comprobación:

- [ ] `curl -sk https://localhost:8443/api/ready` responde `{"status":"ready",...}`.
- [ ] En el navegador, `https://localhost:8443` abre (aceptar la advertencia del certificado autofirmado **antes** de la demo).
- [ ] Pestaña 1: la página del cliente. Pestaña 2: `https://localhost:8443/cocina.html` ya con la clave puesta.
- [ ] Una terminal con la carpeta del repo y otra con `docker compose logs -f nginx` visible (muestra el nodo de cada petición).
- [ ] Docker Desktop con suficiente memoria y sin otras aplicaciones pesadas abiertas.
- [ ] Nadie más usa los puertos 8080 y 8443.

## 1. El problema y la solución — Jefferson (1,5 min)

Decir: el comedor Mamá Toyo recibe pedidos para llevar por llamada o por mensaje y se confunden o se pierden. Los clientes ven el
menú del día (con precio mínimo y máximo, porque varía), hacen su pedido y reciben un número; la cocina ve los pendientes en orden.
Mostrar el diagrama de `docs/ARQUITECTURA.md`: Navegador → Nginx (HTTPS) → Apache 1 / Apache 2 → Express 1 / Express 2 → PostgreSQL.

## 2. El cliente hace un pedido — Yessica (2 min)

En la pestaña 1: elegir un par de platos con los botones de cantidad, ver el resumen con el rango de total, escribir un nombre y
pulsar **Enviar pedido**. Debe aparecer **"¡Pedido recibido! Tu número es: N"**. Luego, en **¿Ya hiciste un pedido?**, escribir el
número y pulsar **Consultar**: aparece el pedido. Al pie de la página se ve qué nodo atendió.

## 3. La cocina — Yessica (1,5 min)

En la pestaña 2 aparece el pedido recién hecho (se actualiza solo cada 5 s, o con **Actualizar ahora**). Pulsar **Marcar listo**: el
botón dice "Guardando…" y el pedido desaparece de pendientes. Decir que `cocina.html` está protegida con usuario y contraseña.

## 4. La API y el contenedor — Brissvey (1,5 min)

```bash
curl -sk -i https://localhost:8443/api/menu | grep -i "^HTTP\|x-node"      # 200 y el nodo que respondió
curl -sk -X POST https://localhost:8443/api/pedidos -H 'Content-Type: application/json' -d '{"cliente":"","items":[]}'
```

La segunda debe responder `400` con un mensaje claro: el servidor valida (cantidad 1–20, máximo 20 líneas, nombre ≤ 60) y calcula el
total él mismo. Decir: Express/TypeScript en un contenedor que corre como usuario `node` (no root); los pedidos van a PostgreSQL con
consultas parametrizadas.

## 5. Servidor web y HTTPS — Josué (2 min)

```bash
curl -si http://localhost:8080/api/menu | head -3          # 301 y Location: https://localhost:8443/...
curl -skI https://localhost:8443/ | grep -i "strict\|x-frame\|nosniff\|server"
```

Mostrar el candado/certificado en el navegador. Decir: Nginx recibe por HTTPS y también habla cifrado con los dos Apache; cada
nodo tiene su Apache, que sirve `web/` y reenvía `/api` a su Express; solo Nginx publica puertos.

## 6. Balanceo — Juan (1,5 min)

```bash
for i in 1 2 3 4; do curl -sk https://localhost:8443/api/health; echo; done      # alterna nodo-1 y nodo-2
docker compose ps
```

En la terminal de logs se ve `node=nodo-1`, `node=nodo-2`, `node=nodo-1`… Decir: round-robin, estado compartido entre procesos
de Nginx (`zone`).

## 7. Falla de un nodo — Juan (2,5 min)

```bash
docker compose stop app1
docker compose ps                                          # app1 detenido
for i in 1 2 3 4 5 6; do curl -sk -o /dev/null -w "%{http_code} " -X POST https://localhost:8443/api/pedidos -H 'Content-Type: application/json' -d '{"cliente":"Demo","items":[{"platoId":1,"cantidad":1}]}'; done; echo
```

Deben salir seis `201`. Además, hacer un pedido desde el navegador (pestaña 1) y verlo en la cocina. Luego:

```bash
docker compose start app1
```

Decir: Apache del nodo caído responde 503 y Nginx reintenta en el otro nodo (también para POST, porque un 502/503 significa que el
pedido no se procesó, así no se duplica); tras 2 fallos, Nginx deja de mandarle tráfico 10 s.

## 8. Base de datos — Brissvey y Juan (2,5 min)

```bash
docker compose restart db
sleep 5
curl -sk -u cocina:toyo2026 https://localhost:8443/api/cocina | head -c 300; echo
docker compose ps                                          # app1 y app2 siguen Up, no se reiniciaron
```

Debe responder y los nodos deben seguir vivos (la conexión se recupera sola). Opcional si hay tiempo (≈1 min): persistencia.

```bash
docker compose down                                        # SIN -v
docker compose up -d
curl -sk https://localhost:8443/api/pedidos/1              # el pedido sigue existiendo (volumen pgdata)
```

## 9. Seguridad — Randal (2 min)

```bash
curl -sk -o /dev/null -w "%{http_code}\n" https://localhost:8443/api/cocina                       # 401
curl -sk -o /dev/null -w "%{http_code}\n" -u cocina:toyo2026 https://localhost:8443/api/cocina    # 200
seq 200 | xargs -P 20 -I{} curl -sk -o /dev/null -w "%{http_code}\n" -X POST https://localhost:8443/api/pedidos -H 'Content-Type: application/json' -d '{}' | sort | uniq -c
docker compose exec app1 whoami                            # node
```

El tercero muestra muchos `400` (el cuerpo `{}` es inválido, así que no se crean pedidos) y varios `429`: Nginx limita las
escrituras a 30 por segundo por IP. Resumen completo de controles y límites en `docs/SEGURIDAD_Y_MONITOREO.md`.

## 10. Monitoreo y carga — Randal (2 min)

```bash
bash docs/pruebas/monitoreo.sh 10m
```

Muestra contenedores, reparto de peticiones por nodo, errores 5xx, tiempo medio y p95, y uso de CPU/memoria. Luego presentar la
tabla de resultados de k6 (sección 13.4 de `docs/PRUEBAS_DE_CARGA.md`): 2 nodos contra 1 nodo con hasta 400 usuarios virtuales, y
decir con honestidad los límites (una sola computadora, un solo PostgreSQL).

## 11. Cierre — Jefferson (1 min)

Lo que se logró, lo que queda fuera (ver "Lo que NO está hecho" en `docs/SEGURIDAD_Y_MONITOREO.md`) y mejoras futuras: cuentas por
persona para la cocina, certificado de una CA real, base de datos con réplica, alertas y paneles.

## Si algo falla en vivo

| Síntoma | Qué hacer |
|---|---|
| El navegador no abre `https://localhost:8443` | Aceptar la advertencia del certificado; comprobar `docker compose ps` y `docker compose logs nginx` |
| `docker compose up` falla con "certs/server.crt: no such file" | `bash certs/generar-certificado.sh` y volver a levantar |
| Un `curl` da `503` justo después de `start app1` o `restart db` | Esperar 10 s (Nginx marca el nodo como caído 10 s tras 2 fallos) y repetir |
| La cocina da `401` | Es lo esperado sin clave: cocina / toyo2026 |
| Salen `429` en el uso normal | Solo pasa con ráfagas de más de 30 escrituras/s; esperar unos segundos |
| Algo queda inconsistente | `docker compose down && docker compose up -d` (sin `-v`: se conservan los pedidos) |

## Preguntas probables de la defensa (todos deben poder contestarlas)

**¿Por qué Nginx y también Apache?** Nginx es el balanceador y el punto único de entrada con HTTPS; cada nodo tiene su Apache
porque el proyecto exige un servidor web por nodo que sirva lo estático y reenvíe a la aplicación (Decisión 2).

**¿Qué pasa si se cae un nodo?** Nginx lo detecta por errores (502/503 o conexión rechazada), reintenta la petición en el otro nodo y
tras 2 fallos deja de enviarle tráfico 10 s. El usuario no lo nota.

**¿Y si se cae PostgreSQL?** No se pueden crear ni consultar pedidos (`/api/ready` pasa a 503), pero los nodos siguen vivos y se
reconectan solos al volver la base. Es el punto único de falla que declaramos; una réplica queda como mejora.

**¿Cómo se comparten los pedidos entre nodos?** Ningún nodo guarda nada en memoria: ambos escriben y leen en el mismo PostgreSQL.

**¿Por qué reintentan también los POST, si podría duplicar un pedido?** Solo se reintenta ante 502/503 (el nodo no procesó nada).
Se quitó el 500 a propósito porque ahí el pedido podría haberse guardado ya.

**¿Cómo protegen la cocina?** Usuario y contraseña en Nginx para `cocina.html`, `GET /api/cocina` y `PATCH /api/pedidos/:n`. Es HTTP
Basic con una clave de desarrollo; para uso real harían falta cuentas por persona.

**¿Qué los protege de un ataque por exceso de peticiones?** Nginx limita a 30 escrituras/s por IP (ráfaga de 60) y rechaza cuerpos
de más de 16 kb. No sustituye a una protección contra ataques distribuidos.

**¿Cómo evitan inyección SQL y XSS?** Las consultas usan parámetros (`$1`, `$2`) y la interfaz escribe siempre con `textContent`.

**¿El total del pedido lo calcula el cliente?** No: el servidor lo calcula con el menú; lo que mande el navegador se ignora.

**¿Qué mide `/api/health` y qué `/api/ready`?** `health` dice que el proceso vive; `ready` dice además que llega a PostgreSQL.

**¿Cómo saben cuántos usuarios aguanta?** Con k6: 400 usuarios virtuales haciendo el flujo completo con 2 nodos y con 1 (resultados en
`docs/PRUEBAS_DE_CARGA.md`). Los límites: una sola computadora, un solo PostgreSQL, usuarios sin navegador.

**¿Qué mejorarían?** Cuentas y sesiones para la cocina, certificado de una CA real con verificación entre Nginx y Apache, réplica de
PostgreSQL, alertas y paneles (Prometheus/Grafana).

**¿Quién hizo qué?** Ver `docs/REPARTO.md` y los archivos de `avances/`.
