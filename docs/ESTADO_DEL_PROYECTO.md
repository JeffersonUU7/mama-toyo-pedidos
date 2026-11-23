# Estado del Proyecto — Mamá Toyo (22/11/2026)

> Documento único de referencia para la defensa. Resume qué está hecho, qué falta y cómo verificarlo.
> Fuente de verdad: `git log`, `avances/` y el código en `main`.

---

## Resumen ejecutivo

| Entrega | Estado | Notas |
|---|---|---|
| Clase 29 — Propuesta | ✅ | Equipo formado, repo creado |
| Clase 33 — Fase 2 | ✅ | Contenedor + Apache/HTTPS + docs |
| Clase 36 — Clúster + BD | ✅ | Nginx + 2 nodos + PostgreSQL, botón "Marcar listo" (PR #18), guion de demo |
| Clase 39 — Final + Defensa | 🟡 | Falta **ejecutar** las pruebas de carga de la sección 13 (Randal) y ensayar la defensa |

---

## Qué está HECHO (verificable en `main`)

### Fase 2 — contenedor y servidor web
- API Express/TypeScript: `/api/health`, `/api/ready`, `/api/menu`, `/api/pedidos` (POST, GET, PATCH), `/api/cocina`.
- Validaciones: cantidad 1–20, máx. 20 líneas, nombre ≤ 60, `platoId` entero ≥ 1; el total lo calcula el servidor.
- Interfaz web (`web/`): menú con precios en rango, resumen, formulario, consulta de pedido y cocina con refresco cada 5 s y botón **Marcar listo**.
- Apache 2.4 con HTTPS y `apache/docker-compose.apache.yml` (Fase 2, independiente del clúster).

### Clúster (Rondas 2 y 3)
| Componente | Estado | Evidencia |
|---|---|---|
| Nginx como entrada única, HTTPS en `:8443`, `:8080` redirige | ✅ | Validado con `docker compose up` (22/11) |
| Nginx → Apache por HTTPS; `apache1`/`apache2` sirven `web/` y reenvían a su Express | ✅ | PR #16 y auditoría |
| Balanceo round-robin (`zone`) y failover (`max_fails=2 fail_timeout=10s`) | ✅ | `curl` alterna `nodo-1`/`nodo-2` |
| Failover también para POST/PATCH (ante 502/503) | ✅ | 6 POST con `app1` detenido → 6 × `201` (22/11) |
| PostgreSQL con volumen `pgdata` y healthcheck | ✅ | `docker compose ps` |
| Nodos resistentes al reinicio de PostgreSQL | ✅ | `restart db` → nodos siguen vivos (22/11) |
| Seguridad: login de cocina, límite de peticiones, CORS cerrado, contenedor sin root, etc. | ✅ | `docs/SEGURIDAD_Y_MONITOREO.md` |
| Monitoreo: `/api/ready`, log de Nginx con nodo, `docs/pruebas/monitoreo.sh` | ✅ | `docs/SEGURIDAD_Y_MONITOREO.md` |
| Botón "Marcar listo" en cocina | ✅ | PR #18 |
| Guion de demo y preguntas de defensa | ✅ | `docs/GUION_DEMO.md` |

### Pruebas de carga (Randal)
- Hechas: baseline y pruebas de 5 usuarios (por HTTP, 19–20/11) y progresiva hasta **300** usuarios (resumen en `docs/pruebas/resultados/resumen-carga-progresiva.md`). Solo midió `/api/health`.
- **Falta:** ejecutar la sección 13 de `docs/PRUEBAS_DE_CARGA.md` (flujo completo con PostgreSQL, hasta 400 usuarios, 2 nodos contra 1, por HTTPS) y pegar los resultados.

---

## Qué FALTA

| Tarea | Responsable | Estado |
|---|---|---|
| Ejecutar las pruebas de carga de la sección 13 y registrar resultados | Randal | ⬜ Scripts y comandos listos |
| Revisar y poder explicar seguridad y monitoreo (`docs/SEGURIDAD_Y_MONITOREO.md`) | Randal | ⬜ |
| Repetir la persistencia (`docker compose down` y `up`) con la versión nueva | Juan / Brissvey | ⬜ |
| Registrar en `avances/` lo probado ("Cómo lo probé"), incluido el PR #18 | Cada quien (Yessica: `avances/03`) | ⬜ |
| Ensayar la demo completa con `docs/GUION_DEMO.md` y la defensa oral | **Todos** | ⬜ |
| Revisar en GitHub si el repositorio es público o privado (los docs dicen privado) | Jefferson | ⬜ |

---

## Cómo verificar TODO hoy (comandos)

```bash
# 1. Compila y tipos OK
npm ci && npx tsc --noEmit

# 2. Clúster completo (HTTPS)
bash certs/generar-certificado.sh          # una sola vez
docker compose up --build -d
docker compose ps                          # db, app1, app2 "healthy"
curl -sk https://localhost:8443/api/health # alterna nodo-1 / nodo-2 al repetir
curl -sk https://localhost:8443/api/ready  # 200 si el nodo llega a PostgreSQL

# 3. Failover con escritura
docker compose stop app1
for i in 1 2 3 4 5 6; do curl -sk -o /dev/null -w "%{http_code} " -X POST https://localhost:8443/api/pedidos \
  -H 'Content-Type: application/json' -d '{"cliente":"Prueba","items":[{"platoId":1,"cantidad":1}]}'; done; echo   # seis 201
docker compose start app1

# 4. Persistencia (SIN -v)
docker compose down && docker compose up -d
curl -sk https://localhost:8443/api/pedidos/1   # el pedido sigue existiendo

# 5. Cocina (pide clave: cocina / toyo2026)
curl -sk -o /dev/null -w "%{http_code}\n" https://localhost:8443/api/cocina                    # 401
curl -sk -u cocina:toyo2026 -X PATCH https://localhost:8443/api/pedidos/1 \
  -H 'Content-Type: application/json' -d '{"estado":"listo"}'                                   # 200, estado "listo"

# 6. Monitoreo
bash docs/pruebas/monitoreo.sh 10m
```

---

## Riesgos / límites a declarar en la defensa

1. **Un solo PostgreSQL:** si cae, no se crean ni consultan pedidos (los nodos se recuperan solos al volver).
2. **Credencial de cocina de desarrollo** (HTTP Basic) y **certificado de desarrollo**; Nginx no verifica el certificado de los Apache.
3. **Pruebas de carga en una sola computadora:** k6, Docker y los 6 contenedores comparten recursos; miden el servidor, no el navegador.
4. **`GET /api/pedidos/:numero` es público por diseño.**
5. **Defensa oral:** cada integrante debe explicar cualquier parte (infra, API, frontend, docs). Preguntas probables en `docs/GUION_DEMO.md`.
