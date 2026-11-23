# Orden de trabajo

Cada ronda empieza cuando termina la anterior (o cuando se cumple lo que dice "depende de").
Dentro de una misma ronda, todos trabajan **en paralelo**.

## Ronda 0: registro (todos, primeros días)

Todos completan los pasos de `LEEME_PRIMERO.txt`: instalar, clonar, probar `npm run dev`
y abrir un PR con sus datos en su archivo de `avances/`.

**Terminada cuando:** los 6 archivos de avances tienen nombre, carnet y usuario de GitHub.

## Ronda 1: construir cada pieza (en paralelo) → Entrega Clase 33

| N.º | Área | Qué hacer | Archivos donde trabaja |
|---|---|---|---|
| 1 | Coordinación (Jefferson) | Diagrama de arquitectura detallado. Completar README. Revisar y aprobar PRs. | `docs/`, `README.md` |
| 2 | Contenedor (Brissvey) | Revisar la app, mejorar validaciones y errores, verificar `docker build`. Habilitar CORS solo para desarrollo, para que la interfaz pueda consultar la API. Cargar el menú real de `docs/MENU.md` en `src/data.ts` (ver `docs/DECISIONES.md`, Decisión 4). | `src/`, `Dockerfile` |
| 3 | Interfaz (Yessica) | Página estática con el menú del día y el formulario de pedido, que consuma `/api/menu` y `/api/pedidos`. | `web/` (carpeta nueva) |
| 4 | Servidor web (Josue) | Decidir Apache o IIS, instalarlo, que sirva `web/` y reenvíe `/api` y `/health` al puerto 3000. Documentarlo. | `docs/SERVIDOR_WEB.md` y su configuración |
| 5 | Clúster (Juan) | Probar `docker compose up --build`. Verificar el balanceo (el campo `node` alterna) y el failover (`docker compose stop app1`). Reportar y corregir errores. | `docker-compose.yml`, `nginx/` |
| 6 | Pruebas (Randal) | Elegir herramienta de pruebas de carga (k6, autocannon, JMeter u otra). Escribir el plan de pruebas. | `docs/PRUEBAS_DE_CARGA.md` |

**Estado: terminada** (Fase 2 entregada, PR #9 y #10).

## Ronda 2: el clúster con base de datos → Entrega Clase 36

**Depende de:** que Juan confirme que `docker compose up --build` levanta Nginx y los 2 nodos. **CUMPIDA:** Juan registró su prueba el 15/11/2026 en `avances/05-cluster-nginx.txt` (PR #12): `docker compose up --build -d` levanta `db`, `app1`, `app2`, `nginx` sanos; balanceo round-robin confirmado (alterna `nodo-1`/`nodo-2`); failover validado con `docker compose stop app1`.

Las decisiones y el **contrato entre Juan y Brissvey** (nombres, variables, tabla y ruta) están en `docs/DECISIONES.md`, Decisiones 1 y 5. Se respetan tal cual, para que sus cambios encajen sin tener que adivinar.

| N.º | Responsable | Qué hacer | Estado |
|---|---|---|---|
| 5 | Juan | **Primero:** probar `docker compose up --build`, confirmar balanceo y failover, y registrarlo en su avance. **Luego:** servicio `db` y `DATABASE_URL` en los dos nodos, según el contrato. | ✅ Hecho (PR #12, avance 15/11) |
| 2 | Brissvey | Pedidos en PostgreSQL en `src/pedidos.ts` (paquete `pg`, tabla creada al arrancar, memoria si no hay `DATABASE_URL`). Después, la ruta `PATCH /api/pedidos/:numero`. | ✅ Hecho (PR #13) |
| 6 | Randal | Pruebas de carga con 1 y con 2 nodos, hasta 400 usuarios virtuales. Hecho: baseline, 5 usuarios y progresiva hasta 300 (por HTTP, antes de HTTPS). **Falta:** ejecutar la sección 13 de `docs/PRUEBAS_DE_CARGA.md` por HTTPS y pegar los resultados. | ⬜ Falta ejecutar (scripts listos) |
| 3 | Yessica | Botón "marcar listo" en `cocina.html`. | ✅ Hecho (PR #18) |
| 4 | Josué | Apache por nodo (`apache1` y `apache2`) con la misma configuración, cada uno hacia su Express (Decisión 2, etapa 2). | ✅ Hecho (PR #16) |
| 1 | Jefferson | Guion de la demo y revisión de los PR. | ✅ Guion en `docs/GUION_DEMO.md`; PR revisados |

**Terminada cuando** se cumplen estas cuatro pruebas (son la demo):
1. ✅ `docker compose up --build` levanta `db`, `app1`, `app2` y `nginx`, y `docker compose ps` los muestra sanos. (Juan, 15/11)
2. ✅ Se crea un pedido y se consulta 10 veces por `https://localhost:8443/api/pedidos/1`: siempre responde 200. (Gracias a PostgreSQL compartido, confirmado por Juan)
3. ✅ Con `docker compose stop app1` el sitio sigue respondiendo y el pedido sigue visible. (Juan, 15/11)
4. ✅ Con `docker compose down` (sin `-v`) y luego `up`, el pedido sigue existiendo. (Volumen `pgdata` persistente, confirmado por Juan)

**Nota:** las 4 pruebas técnicas están resueltas (Juan, 15/11). El 22/11/2026 se repitieron en parte con el clúster nuevo (Apache por nodo y HTTPS): balanceo, failover con escritura (6 POST con `app1` detenido → 201) y reinicio de la base sin caída de los nodos. La persistencia con `docker compose down` y `up` no se repitió con la versión nueva: conviene repetirla antes de la entrega. Falta: las pruebas de carga de la sección 13 (Randal) y que cada integrante registre sus pruebas en su archivo de `avances/`.

## Ronda 3: cierre → Entrega Clase 39

1. ✅ Josué y Juan: Apache por nodo en `docker-compose.yml` y HTTPS en Nginx (Decisión 2, etapas 2 y 3). Validado con `docker compose up` el 22/11/2026.
2. 🟡 Randal: seguridad y monitoreo (Clase 37). Aplicados y documentados en `docs/SEGURIDAD_Y_MONITOREO.md` (login de cocina, límite de peticiones, `/api/ready`, log de Nginx con nodo, `docs/pruebas/monitoreo.sh`). **Falta:** revisarlo, poder explicarlo, y ejecutar el dimensionamiento con pruebas reales (sección 13 de `docs/PRUEBAS_DE_CARGA.md`).
3. ✅ Jefferson: documentación final y diagrama actualizados; guion de la demo y preguntas de la defensa en `docs/GUION_DEMO.md`.
4. ⬜ **Todos** ensayan la defensa oral. Cada uno debe poder explicar cualquier parte del sistema (usar las preguntas de `docs/GUION_DEMO.md`).

## Cómo se registra el avance

Cada vez que termines algo, agrega una entrada en tu archivo de `avances/` y abre un Pull Request.
El coordinador revisa, pide cambios si hace falta y aprueba.