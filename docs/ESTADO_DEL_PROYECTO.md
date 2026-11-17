# Estado del Proyecto — Mamá Toyo (16/11/2026)

> Documento único de referencia para la defensa. Resume qué está hecho, qué falta y cómo verificarlo.
> Fuente de verdad: `git log`, `avances/`, código en `main`. Rama de esta actualización: `docs/actualizacion-documentacion`.

---

## Resumen ejecutivo

| Entrega | Fecha prevista | Estado | Notas |
|---|---|---|---|
| Clase 29 — Propuesta | — | ✅ 10 % | Equipo formado, repo creado |
| Clase 33 — Fase 2 | — | ✅ 20 % | Contenedor + Apache/HTTPS + docs (PR #9, #10) |
| Clase 36 — Clúster + BD | Próx. clase | 🟡 ~70 % | **Infra lista**, faltan: botón listo, pruebas carga, guion demo |
| Clase 39 — Final + Defensa | — | ⬜ 0 % | Pendiente Ronda 3 completa |

---

## Qué está HECHO (verificable en `main`)

### Fase 2 (Clase 33) — 100 %
- API Express/TypeScript con rutas `/api/health`, `/api/menu`, `/api/pedidos` (POST/GET), `/api/cocina`
- Validaciones: cantidad 1–20, máx 20 líneas, nombre ≤ 60 chars, `platoId` entero ≥ 1
- Precios como rangos (`precioMin`/`precioMax`) según menú real (10 platos, `docs/MENU.md`)
- Interfaz web (`web/`): menú con ±, resumen, formulario, consulta, cocina con auto-refresh 5 s
- Apache 2.4 (HTTPS mkcert, ProxyPass `/api` → Express, redirección HTTP→HTTPS)
- `apache/docker-compose.apache.yml` funcional, evidencias en `docs/evidencias/`

### Ronda 2 — Infraestructura de clúster (Clase 36) — **Infra 100 %**
| Componente | Estado | Evidencia |
|---|---|---|
| `docker-compose.yml` con Nginx, app1, app2, db (PG16) | ✅ | PR #12 |
| Balanceo round-robin (`zone cluster_app 64k`) | ✅ | `avances/05` 15/11: `node` alterna nodo-1/nodo-2 |
| Failover pasivo (`max_fails=2 fail_timeout=10s`) | ✅ | `docker compose stop app1` → sitio responde |
| PostgreSQL con volumen `pgdata` + healthcheck | ✅ | `db` healthy, `depends_on: service_healthy` |
| `DATABASE_URL` en app1/app2 | ✅ | Contrato Decisión 1 cumplido |
| Persistencia en `src/pedidos.ts` (`pg`, `Number()` en NUMERIC) | ✅ | PR #13 |
| Tabla `pedidos` auto-creada al arrancar | ✅ | Código verificado |
| Memoria si no hay `DATABASE_URL` (para `npm run dev`) | ✅ | Código verificado |
| Ruta `PATCH /api/pedidos/:numero` (marcar listo) | ✅ | PR #13, validada con curl |
| 4 pruebas de demo **técnicas resueltas** | ✅ | Ver abajo |

#### Las 4 pruebas de demo (ORDEN_DE_TRABAJO.md) — Estado real

| # | Prueba | Estado | Quién/Prueba |
|---|---|---|---|
| 1 | `docker compose up --build` levanta db, app1, app2, nginx sanos | ✅ | Juan, 15/11 (`avances/05`) |
| 2 | Crear pedido → consultar 10× `/api/pedidos/1` → siempre 200 | ✅ | PG compartido (Juan) |
| 3 | `docker compose stop app1` → sitio responde, pedido visible | ✅ | Juan, 15/11 (failover) |
| 4 | `docker compose down` (sin `-v`) + `up` → pedido existe | ✅ | Volumen `pgdata` persistente |

> **Nota:** Las 4 pruebas están técnicamente resueltas. Falta registrarlas formalmente en los avances del equipo y preparar el **guion de demo** (Jefferson) y el **botón "Marcar listo"** en cocina (Yessica).

---

## Qué FALTA para la Clase 36 (demo)

| Tarea | Responsable | Bloqueada por | Estado |
|---|---|---|---|
| Botón "Marcar listo" en `cocina.html` (llama `PATCH`) | Yessica | Ruta PATCH ya existe | ⬜ Pendiente |
| Pruebas de carga k6 (1 nodo, 2 nodos, 300–400 VU) | Randal | Infra lista | ⬜ Pendiente |
| Guion de demo (qué se muestra, quién, orden) | Jefferson | — | ⬜ Pendiente |
| Registrar las 4 pruebas en avances del equipo | Cada quien | — | ⬜ Pendiente |

---

## Qué FALTA para la Clase 39 (Ronda 3)

| Tarea | Responsable | Decisión ref. |
|---|---|---|
| Apache por nodo (`apache1`, `apache2`) en `docker-compose.yml` | Josué + Juan | Dec. 2, etapa 2 |
| HTTPS en Nginx (certificado autofirmado) | Josué | Dec. 2, etapa 3 |
| Seguridad y monitoreo (Clase 37) | Randal | — |
| Validar dimensionamiento con pruebas reales | Randal | — |
| Documentación final + diagrama actualizado | Jefferson | — |
| Ensayo defensa oral (todos explican todo) | **Todos** | — |

---

## Cómo verificar TODO hoy (comandos)

```bash
# 1. Compila y tipos OK
npm ci && npx tsc --noEmit

# 2. Fase 2 (Apache + Express, memoria)
bash certs/generar-certificado.sh
docker compose -f apache/docker-compose.apache.yml up --build
# Abre https://localhost:8443 y https://localhost:8443/cocina.html

# 3. Clúster completo (Nginx + 2 Express + PostgreSQL)
docker compose up --build
# API en http://localhost:8080/api/health (balanceo: node alterna)
# Probar failover: docker compose stop app1 → seguir consultando /api/health

# 4. Verificar persistencia
# Crear pedido → consultar → docker compose down → up → consultar (existe)

# 5. Probar PATCH marcar listo
curl -X PATCH http://localhost:8080/api/pedidos/1 \
  -H 'Content-Type: application/json' -d '{"estado":"listo"}'
# Debe responder 200 con pedido.estado="listo"
```

---

## Archivos clave y su estado

| Archivo | Estado | Último cambio relevante |
|---|---|---|
| `src/app.ts` | ✅ Actual | PATCH implementado, validaciones completas |
| `src/pedidos.ts` | ✅ Actual | PG + memoria, `Number()` en NUMERIC, tabla auto-creada |
| `src/data.ts` | ✅ Actual | 10 platos con rangos |
| `docker-compose.yml` | ✅ Actual | Nginx, app1, app2, db, volúmenes, healthchecks |
| `nginx/nginx.conf` | ✅ Actual | `zone cluster_app 64k`, round-robin, failover pasivo |
| `apache/httpd.conf` | ✅ Actual | HTTPS mkcert, ProxyPass `/api`, headers seguridad |
| `web/app.js`, `web/cocina.js` | ⚠️ Falta botón listo | PATCH ya disponible en API |
| `docs/DECISIONES.md` | ✅ Actual | Dec. 1, 5, Etapa 1 marcadas implementadas |

---

## Riesgos / Decisiones abiertas

1. **Plan B (Apache delante de Nginx)** — Si no alcanza tiempo para etapa 2/3, coordinación decide (ver `DECISIONES.md`).
2. **HTTPS en Nginx** — Requiere certificado y configurar `proxy_ssl` hacia Apache; Josué responsable.
3. **Pruebas de carga** — Randal debe ejecutar k6 contra `:8080/api` (solo API, no hay interfaz en Nginx).
4. **Defensa oral** — Cada integrante debe explicar **cualquier** parte (infra, API, frontend, docs).

---

## Próximos pasos inmediatos

1. **Yessica**: rama `avance/yessica-boton-listo` → botón en `cocina.html` llama `PATCH /api/pedidos/:numero`.
2. **Randal**: rama `avance/randal-pruebas-carga` → script k6 + resultados en `docs/resultados-carga/`.
3. **Jefferson**: rama `docs/guion-demo` → guion paso a paso con tiempos y responsables.
4. **Josué/Juan**: rama `avance/josue-apache-nodo` → `apache1`/`apache2` en compose + HTTPS Nginx (etapas 2 y 3).
5. **Todos**: registrar avances y abrir PRs → coordinador revisa y aprueba.