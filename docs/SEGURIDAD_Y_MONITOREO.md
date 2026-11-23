# Seguridad y monitoreo

Resumen de lo que está aplicado en el clúster (Nginx → Apache → Express → PostgreSQL), dónde está en el código y cómo
comprobarlo en vivo. Todo lo de esta página existe en `main`; lo que **no** está hecho se dice en la sección 3.

Las URL de los ejemplos usan `-k` porque el certificado es de desarrollo (autofirmado).

## 1. Seguridad

| Riesgo | Control aplicado | Dónde | Cómo comprobarlo |
|---|---|---|---|
| Tráfico en texto plano | HTTPS (TLS 1.2 y 1.3) en la entrada y entre Nginx y los Apache. `:8080` solo redirige | `nginx/nginx.conf`, `apache/httpd-nodo.conf` | `curl -si http://localhost:8080/api/menu \| head -3` → `301` a `https://localhost:8443` |
| Navegador forzado a HTTP / ataques por cabeceras | HSTS corto (5 min, por ser entorno local) en Nginx, que es la entrada; `X-Content-Type-Options` y `X-Frame-Options` en Nginx y en los Apache | `nginx/nginx.conf`, `apache/httpd-nodo.conf` | `curl -skI https://localhost:8443/ \| grep -i "strict\|x-frame\|nosniff"` |
| Cualquiera ve o modifica la cocina | Usuario y contraseña (HTTP Basic) para `cocina.html`, `GET /api/cocina` y `PATCH /api/pedidos/:n`. Crear y consultar un pedido sigue siendo público | `nginx/nginx.conf`, `nginx/htpasswd` | `curl -sk -o /dev/null -w "%{http_code}\n" https://localhost:8443/api/cocina` → `401`; con `-u cocina:toyo2026` → `200` |
| Abuso por exceso de peticiones | Límite de 30 escrituras/s por IP (ráfaga de 60) en POST y PATCH → `429` | `nginx/nginx.conf` (`limit_req`) | ver guion de la demo (`seq 200 \| xargs -P 20 ...`) |
| Cuerpos enormes | Nginx rechaza más de 16 kb (`413`) y Express también (`express.json({limit:'16kb'})`) | `nginx/nginx.conf`, `src/app.ts` | `head -c 20000 /dev/zero \| tr '\0' a \| curl -sk -o /dev/null -w "%{http_code}\n" -X POST https://localhost:8443/api/pedidos --data-binary @-` → `413` |
| Otro sitio web usa la API desde el navegador de un cliente | CORS cerrado por defecto (solo se abre con `CORS_ORIGIN` en desarrollo) | `src/app.ts` | Sin `CORS_ORIGIN`, ninguna respuesta lleva `Access-Control-Allow-Origin` |
| Enlace malicioso que redirige la página a otro servidor | El parámetro `?api=` solo acepta rutas relativas o `localhost` | `web/common.js` | Abrir `https://localhost:8443/?api=https://otro.com/api` → la página sigue usando `/api` |
| Datos inválidos o maliciosos | Validación en el servidor: cantidad 1–20, máximo 20 líneas, nombre ≤ 60, `platoId` entero; el total lo calcula el servidor, no el cliente | `src/app.ts` | `curl -sk -X POST https://localhost:8443/api/pedidos -H 'Content-Type: application/json' -d '{}'` → `400` con mensaje |
| Inyección HTML (XSS) en el nombre del cliente | La interfaz escribe con `textContent`, nunca con `innerHTML` | `web/*.js` | Hacer un pedido con el nombre `<b>hola</b>`: se ve el texto literal |
| Inyección SQL | Consultas con parámetros (`$1`, `$2`), nunca concatenadas | `src/pedidos.ts` | Revisar el código: no hay texto del usuario dentro del SQL |
| Contenedor comprometido con privilegios | La app corre como usuario `node`, no root | `Dockerfile` (`USER node`) | `docker compose exec app1 whoami` → `node` |
| Servicios internos expuestos | Solo Nginx publica puertos (8080 y 8443). Apache, Express y PostgreSQL solo son visibles dentro de la red de Docker | `docker-compose.yml` | `docker compose ps` → solo `nginx` muestra `0.0.0.0:...` |
| Un nodo arranca sin base de datos y guarda pedidos en memoria sin avisar | `REQUIRE_DB=true`: si falta `DATABASE_URL` el nodo no arranca | `src/pedidos.ts`, `docker-compose.yml` | Quitar `DATABASE_URL` de app1 → el contenedor termina con error explícito |
| Secretos en el repositorio | `.env`, `certs/*.key` y `certs/*.crt` están en `.gitignore`; no hay llaves en el historial (revisado) | `.gitignore` | `git log --all -- '*.key' '.env'` → vacío |
| Información del servidor | Nginx sin versión (`server_tokens off`), Express sin `X-Powered-By` | `nginx/nginx.conf`, `src/app.ts` | `curl -skI https://localhost:8443/` → `Server: nginx` sin número |

## 2. Monitoreo

Qué se observa y con qué:

| Qué | Cómo | Para qué sirve |
|---|---|---|
| ¿Está vivo cada servicio? | `docker compose ps` (health checks de Docker en `app1`, `app2` y `db`) | Ver de un vistazo si algo cayó o se reinició |
| ¿El nodo puede guardar pedidos? | `GET /api/ready` → `200` con PostgreSQL disponible, `503` si no | `/api/health` solo dice "el proceso vive"; `/api/ready` dice "además llega a la base de datos" |
| ¿Qué nodo atendió cada petición? | Cabecera `X-Node` en cada respuesta, anotada en el log de Nginx | Demostrar el balanceo y el failover con datos reales, incluso en POST |
| Tráfico, errores y tiempos | Log de Nginx en formato `cluster` (hora, IP, ruta, código, tiempo, nodo, código del nodo) | `docker compose logs -f nginx` en vivo |
| Resumen automático | `bash docs/pruebas/monitoreo.sh [periodo]` | Estado de contenedores, reparto por nodo, errores 5xx, `429`, `401`, tiempo medio, p95 y uso de CPU y memoria |
| Capacidad bajo carga | k6 (`docs/PRUEBAS_DE_CARGA.md`, sección 13) | Dimensionamiento con 400 usuarios, 1 nodo contra 2 |

Formato de una línea del log de Nginx:

```
ts=2026-11-23T02:25:20+00:00 ip=172.18.0.1 user=- req="POST /api/pedidos HTTP/1.1" status=201 bytes=... rt=0.012 node=nodo-2 ust=201 urt=0.011
```

`rt` es el tiempo total y `urt` el que tardó el nodo; si `ust` muestra dos códigos (por ejemplo `503, 201`) hubo un reintento
en el otro nodo. Para ver un fallo y su recuperación, ejecuta `docker compose stop app1`, haz unas peticiones y mira
`bash docs/pruebas/monitoreo.sh 5m`.

## 3. Lo que NO está hecho (declararlo en la defensa)

- **La contraseña de cocina es de desarrollo** (`cocina` / `toyo2026`, hash en `nginx/htpasswd`) y HTTP Basic es una autenticación
  sencilla. Para uso real habría que cambiarla, usar cuentas por persona y expiración de sesión.
- **`GET /api/pedidos/:numero` es público por diseño** (el cliente consulta su pedido sin cuenta). Quien adivine un número ve ese
  pedido, incluido el nombre. Mitigación posible: números no secuenciales o un código adicional.
- **Nginx no verifica el certificado de los Apache** (red interna de Docker, mismo certificado de desarrollo). En producción real
  se usaría una autoridad certificadora propia y verificación.
- **El certificado es de desarrollo** (autofirmado o mkcert): los navegadores avisan hasta que se acepta o se instala la CA local.
- **Hay un solo PostgreSQL**: si cae, no se pueden crear ni consultar pedidos (los nodos siguen vivos y se recuperan solos al volver).
  Un clúster de base de datos queda fuera del alcance.
- **El monitoreo es local y bajo demanda** (logs y un script). No hay alertas automáticas ni paneles (Prometheus/Grafana).
- **El límite de 30 escrituras/s es por IP**: detrás de un mismo NAT, varios clientes comparten límite.

## 4. Permisos POSIX y logs (evidencia de la defensa)

Se aplican con `bash docs/pruebas/permisos.sh` (Linux, macOS o WSL) y se muestran en el video. Principio: el mínimo permiso necesario, nunca 777.

| Archivo / directorio | Permiso | Por qué |
|---|---|---|
| `certs/server.key` (llave privada) | `600` | Solo el dueño la lee; Nginx y Apache la leen al arrancar como root |
| `certs/server.crt` | `644` | El certificado es público |
| `nginx/htpasswd` | `644` | Lo lee el worker de Nginx (usuario `nginx`); con `640` respondería 500. Solo guarda hashes |
| `nginx/*.conf`, `apache/*.conf`, `docker-compose*.yml` | `644` | Lectura general, escritura solo del dueño |
| `certs/generar-certificado.sh`, `docs/pruebas/*.sh` | `755` | Ejecutables, no escribibles por otros |
| Montajes en Docker (`web/`, `certs/`, configs) | `:ro` | Los contenedores no pueden modificarlos |
| Proceso de la app | usuario `node` | No corre como root |

Auditoría: `find . -path ./node_modules -prune -o -perm 777 -print` debe salir vacío.

Dónde están los logs: Nginx → `docker compose logs nginx` (formato `cluster`, sección 2). Apache de cada nodo →
`docker compose logs apache1` / `apache2` (access log en formato `common` hacia stdout y error log hacia stderr, configurados con `CustomLog` y `ErrorLog` en `apache/httpd-nodo.conf`).
