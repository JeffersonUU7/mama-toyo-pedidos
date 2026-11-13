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

**Estado: terminada** (Fase 2 entregada). Falta que Juan registre su prueba del clúster con Docker.

## Ronda 2: el clúster con base de datos → Entrega Clase 36

**Depende de:** que Juan confirme que `docker compose up --build` levanta Nginx y los 2 nodos. La configuración de Nginx ya se probó fuera de Docker con dos nodos locales: el balanceo alterna entre `nodo-1` y `nodo-2` y el failover funciona. También se comprobó el problema que resuelve la base de datos: un pedido creado en un nodo no existe en el otro (al consultarlo sale 200 y 404 de forma alternada).

Las decisiones y el **contrato entre Juan y Brissvey** (nombres, variables, tabla y ruta) están en `docs/DECISIONES.md`, Decisiones 1 y 5. Se respetan tal cual, para que sus cambios encajen sin tener que adivinar.

| N.º | Responsable | Qué hacer |
|---|---|---|
| 5 | Juan | **Primero:** probar `docker compose up --build`, confirmar balanceo y failover, y registrarlo en su avance. **Luego:** servicio `db` y `DATABASE_URL` en los dos nodos, según el contrato. |
| 2 | Brissvey | Pedidos en PostgreSQL en `src/pedidos.ts` (paquete `pg`, tabla creada al arrancar, memoria si no hay `DATABASE_URL`). Después, la ruta `PATCH /api/pedidos/:numero`. |
| 6 | Randal | **Ahora, sin esperar la base de datos:** pruebas de carga contra `http://localhost:8080` con 1 y con 2 nodos, incluida una de 300 a 400 usuarios virtuales. Repetirlas cuando esté la base de datos. Resultados en `docs/`. |
| 3 | Yessica | Botón "marcar listo" en `cocina.html` cuando exista la ruta `PATCH`. Antes, probar la interfaz contra el clúster con `?api=http://localhost:8080/api`. |
| 4 | Josué | Preparar el Apache por nodo (`apache1` y `apache2`) con la misma configuración, cada uno hacia su Express (Decisión 2, etapa 2). No bloquea la demo de la Clase 36. |
| 1 | Jefferson | Guion de la demo y revisión de los PR. |

**Terminada cuando** se cumplen estas cuatro pruebas (son la demo):
1. `docker compose up --build` levanta `db`, `app1`, `app2` y `nginx`, y `docker compose ps` los muestra sanos.
2. Se crea un pedido y se consulta 10 veces por `http://localhost:8080/api/pedidos/1`: siempre responde 200.
3. Con `docker compose stop app1` el sitio sigue respondiendo y el pedido sigue visible.
4. Con `docker compose down` (sin `-v`) y luego `up`, el pedido sigue existiendo.

## Ronda 3: cierre → Entrega Clase 39

1. Josué y Juan: integran el Apache por nodo en `docker-compose.yml` y ponen HTTPS en Nginx (Decisión 2, etapas 2 y 3).
2. Randal: seguridad y monitoreo (temas de la Clase 37) y validar el dimensionamiento con pruebas reales.
3. Jefferson: documentación final y diagrama actualizado.
4. **Todos** ensayan la defensa oral. Cada uno debe poder explicar cualquier parte del sistema.

## Cómo se registra el avance

Cada vez que termines algo, agrega una entrada en tu archivo de `avances/` y abre un Pull Request.
El coordinador revisa, pide cambios si hace falta y aprueba.
