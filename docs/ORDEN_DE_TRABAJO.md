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
| 3 | Interfaz (Yessica) | Página estática con el menú del día y el formulario de pedido, que consuma `/menu` y `/pedidos`. | `web/` (carpeta nueva) |
| 4 | Servidor web (Josue) | Decidir Apache o IIS, instalarlo, que sirva `web/` y reenvíe `/menu`, `/pedidos`, `/cocina` y `/health` al puerto 3000. Documentarlo. | `docs/SERVIDOR_WEB.md` y su configuración |
| 5 | Clúster (Juan) | Probar `docker compose up --build`. Verificar el balanceo (el campo `node` alterna) y el failover (`docker compose stop app1`). Reportar y corregir errores. | `docker-compose.yml`, `nginx/` |
| 6 | Pruebas (Randal) | Elegir herramienta de pruebas de carga (k6, autocannon, JMeter u otra). Escribir el plan de pruebas. | `docs/PRUEBAS_DE_CARGA.md` |

**Terminada cuando:** el contenedor y el servidor web están configurados y documentados (Entrega Clase 33).

## Ronda 2: el clúster con base de datos → Entrega Clase 36

**Depende de:** que Juan confirme que `docker compose up` levanta Nginx y los 2 nodos. Las decisiones están en `docs/DECISIONES.md`.

| N.º | Responsable | Qué hacer |
|---|---|---|
| 2 | Brissvey | Persistencia con PostgreSQL en `src/pedidos.ts` (Decisión 1). Después, la ruta `PATCH /pedidos/:numero` (Decisión 5). |
| 5 | Juan | Servicio `db` en `docker-compose.yml` y variables de los nodos. Ensayar la demo de failover. |
| 6 | Randal | Primeras pruebas de carga contra `http://localhost:8080`, con 1 y con 2 nodos, incluida una de 300 a 400 usuarios virtuales. Guardar resultados. |
| 3 | Yessica | Botón "marcar listo" en `cocina.html` cuando exista la ruta. Probar la interfaz contra el clúster. |
| 4 | Josué | Preparar el Apache por nodo (`apache1` y `apache2`) con la misma configuración, cada uno hacia su Express (Decisión 2, etapa 2). |
| 1 | Jefferson | Guion de la demo y revisión de los PR. |

**Terminada cuando:** un pedido creado aparece igual desde los dos nodos y el failover funciona de principio a fin.

## Ronda 3: cierre → Entrega Clase 39

1. Josué y Juan: integran el Apache por nodo en `docker-compose.yml` y ponen HTTPS en Nginx (Decisión 2, etapas 2 y 3).
2. Randal: seguridad y monitoreo (temas de la Clase 37) y validar el dimensionamiento con pruebas reales.
3. Jefferson: documentación final y diagrama actualizado.
4. **Todos** ensayan la defensa oral. Cada uno debe poder explicar cualquier parte del sistema.

## Cómo se registra el avance

Cada vez que termines algo, agrega una entrada en tu archivo de `avances/` y abre un Pull Request.
El coordinador revisa, pide cambios si hace falta y aprueba.
