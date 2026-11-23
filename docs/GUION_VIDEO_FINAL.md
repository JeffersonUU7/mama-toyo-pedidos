# Guion del video de defensa final (mínimo 15 min)

Reglas de la entrega (Laboratorio 3): **mínimo 15 minutos**, **los 6 integrantes en cámara y hablando**, y **al inicio cada uno dice su
nombre completo y su rol**. El guion suma ~22 min para tener margen: si un bloque se acorta, el video sigue pasando de 15.
Se graba UNA sola toma de pantalla compartida (Meet/Zoom/OBS) con cámaras encendidas. Cada quien presenta lo suyo y puede responder cualquier parte.

Antes de grabar: seguir "Antes de empezar" de `docs/GUION_DEMO.md` (clúster arriba, certificado aceptado, pestañas abiertas) y correr
`bash docs/pruebas/permisos.sh` (Linux/WSL).

| # | Min | Quién | Bloque | Rúbrica |
|---|---|---|---|---|
| 1 | 0:00–2:00 | Todos | Presentación: cada uno dice **nombre completo y rol** (ver abajo) | Defensa oral |
| 2 | 2:00–4:00 | Jefferson | Problema real y a quién ayuda | Impacto (2) |
| 3 | 4:00–6:30 | Brissvey | Contenedor: código Express/TS y ruta dinámica | Integración (4) |
| 4 | 6:30–9:00 | Yessica | Interfaz: cliente hace pedido, cocina lo marca listo | Integración |
| 5 | 9:00–11:30 | Josué | Servidor Apache + HTTPS (candado) | Integración |
| 6 | 11:30–15:30 | Juan | Clúster: 2 nodos, Nginx, **failover en vivo** | Integración |
| 7 | 15:30–18:30 | Randal | Seguridad: permisos POSIX, certificados, variables de entorno, logs Apache y Nginx | Seguridad (2) |
| 8 | 18:30–20:00 | Jefferson | Repositorio GitHub: README y diagrama de arquitectura | Documentación (1) |
| 9 | 20:00–22:00 | Todos | Preguntas hipotéticas (una técnica por integrante, ver abajo) | Defensa oral |
| 10 | 22:00–22:30 | Todos | Conclusión (una frase cada uno) | Defensa oral |

## 1. Presentación (todos)
Cada uno: "Soy **[nombre completo]** y mi rol fue **[rol]**".
Jefferson Requeno – Coordinación y documentación · Brissvey Calderón – Contenedor Express/TypeScript · Yessica Medrano – Interfaz de menú y pedidos ·
Josué Zelaya – Servidor web y HTTPS · Juan Flores – Clúster Docker y Nginx · Randal López – Pruebas de carga, seguridad y monitoreo.
*(Corregir los nombres tal como aparecen en su carnet/matrícula.)*

## 2. Problema (Jefferson)
Comedor Mamá Toyo (San Miguel): en el almuerzo se forman filas y los pedidos por llamada o mensaje se pierden o se confunden. Ayuda a
**los clientes** (piden con anticipación, ven el menú con precio mínimo/máximo, reciben un número) y a **la cocina** (lista ordenada de pendientes).
Impacto: menos filas, menos errores, y el comedor no pierde ventas. Decir por qué un clúster: si un nodo cae en plena hora de almuerzo, los pedidos no se detienen.

## 3. Contenedor y ruta dinámica (Brissvey) — mostrar código
- Abrir `src/app.ts`: rutas `/health`, `/ready`, `/menu`, `/pedidos`, `/cocina`. Señalar la **ruta dinámica `GET /api/pedidos/:numero`** y `PATCH /api/pedidos/:numero`
  (parámetro `:numero` validado con `numeroDePedido`: solo dígitos).
- Abrir `Dockerfile`: construcción en dos etapas, `USER node` (no root), `HEALTHCHECK` contra `/health`.
- En terminal: `curl -sk https://localhost:8443/api/pedidos/1` y el `POST` inválido que devuelve `400`.
- Variables de entorno: `.env.example`, `NODE_ID`, `DATABASE_URL`, `REQUIRE_DB` en `docker-compose.yml` (ningún secreto en el repo).

## 4. Interfaz (Yessica)
Pestaña 1: elegir platos, enviar pedido, ver "Tu número es N", consultarlo. Pestaña 2 (`cocina.html`, pide usuario y clave): aparece el pedido, pulsar **Marcar listo**.
Decir que el pie de página muestra qué nodo atendió.

## 5. Servidor y HTTPS (Josué)
Abrir `https://localhost:8443` y **mostrar el candado** → clic → certificado (emisor mkcert, `localhost`, vigencia).
`curl -si http://localhost:8080/api/menu | head -3` → 301 a HTTPS. Abrir `apache/httpd-nodo.conf`: `SSLProtocol` solo TLS 1.2/1.3, `ProxyPass /api`, `ServerTokens Prod`, `Options -Indexes`.
Explicar la cadena: Nginx (HTTPS) → Apache (HTTPS) → Express.

## 6. Clúster y failover (Juan) — la parte que más pesa
1. `docker compose ps` → db, app1, app2, apache1, apache2, nginx. Abrir `docker-compose.yml`: dos nodos **idénticos** (mismo `build: .`, mismas variables; solo cambia `NODE_ID`).
2. En una segunda terminal: `docker compose logs -f nginx`. Ejecutar 4 `curl` a `/api/health` → alterna `nodo-1` / `nodo-2` (también visible en `node=` del log).
3. Health check: explicar `/api/health` (vive el proceso) y `/api/ready` (llega a PostgreSQL), el `HEALTHCHECK` de Docker cada 10 s, y la detección en Nginx (`max_fails=2 fail_timeout=10s`).
4. **Failover en vivo:** `docker compose stop app1` → seguir recargando el navegador / haciendo `curl` (siempre responde, solo `nodo-2`) → hacer un pedido en el navegador y verlo en cocina → mostrar en el log `ust=503, 201`.
5. `docker compose start app1` → esperar ~15 s → vuelve a alternar.

## 7. Seguridad y monitoreo (Randal)
1. **Permisos POSIX (sin 777):** `bash docs/pruebas/permisos.sh` → `server.key` = `600`, `server.crt` = `644`, scripts `755`, y las auditorías `find -perm 777` vacías. Mostrar que los volúmenes van `:ro` (el `touch` falla dentro de apache1).
2. **Certificados:** HTTPS con TLS 1.2/1.3; la llave privada no está en Git (`.gitignore`; `git log --all -- '*.key'` vacío).
3. **Variables de entorno:** contraseña de PostgreSQL por `POSTGRES_PASSWORD`; `.env` fuera del repo.
4. **Logs de Apache:** `docker compose logs apache1 --tail 15` (access log y error log en stdout/stderr). Interpretar: IP de Nginx, método/ruta, código; con `app1` caído se ven los 503 / error de proxy.
5. **Logs de Nginx:** `docker compose logs nginx --tail 15` → explicar `status`, `rt`, `node`, `ust`. Correr `bash docs/pruebas/monitoreo.sh 10m` (reparto por nodo, 5xx, p95).
6. Mitigaciones: login de cocina (`401`/`200`), límite 30 escrituras/s (`429`), cuerpo máx 16 kb (`413`), validación del servidor, usuario `node`, solo Nginx publica puertos.
7. Decir con honestidad los límites (ver `docs/SEGURIDAD_Y_MONITOREO.md`, sección 3).

## 8. Repositorio (Jefferson)
Abrir GitHub: mostrar `README.md` (descripción, cómo levantarlo, API), el **diagrama de arquitectura** (Mermaid en README y `docs/ARQUITECTURA.md`), la carpeta `docs/`, `avances/` y el historial de Pull Requests.

## 9. Preguntas hipotéticas (una por integrante, cada quien responde la suya)
- Jefferson: ¿Quién hizo qué y cómo se coordinaron? (ramas, PR, `docs/REPARTO.md`)
- Brissvey: ¿Por qué el total lo calcula el servidor y cómo evitan inyección SQL? (consultas parametrizadas `$1`)
- Yessica: ¿Cómo evitan XSS en el nombre del cliente? (`textContent`)
- Josué: ¿Por qué Nginx y también Apache? ¿Qué pasa si el certificado expira o es autofirmado?
- Juan: ¿Qué pasa si se cae PostgreSQL? ¿Por qué se reintentan POST solo ante 502/503?
- Randal: ¿Qué hace `chmod 600` a la llave y por qué `htpasswd` no puede ser 640? ¿Qué es el límite de peticiones?
El resto de preguntas probables está en `docs/GUION_DEMO.md`.

## 10. Conclusión
Una frase por persona: qué se logró (clúster con failover probado, HTTPS, seguridad, documentación) y qué mejorarían (réplica de PostgreSQL, CA real, cuentas por persona para cocina, alertas).
