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
| 2 | Contenedor (Brissvey) | Revisar la app, mejorar validaciones y errores, verificar `docker build`. Habilitar CORS solo para desarrollo, para que la interfaz pueda consultar la API. | `src/`, `Dockerfile` |
| 3 | Interfaz (Yessica) | Página estática con el menú del día y el formulario de pedido, que consuma `/menu` y `/pedidos`. | `web/` (carpeta nueva) |
| 4 | Servidor web (Josue) | Decidir Apache o IIS, instalarlo, que sirva `web/` y reenvíe `/menu`, `/pedidos`, `/cocina` y `/health` al puerto 3000. Documentarlo. | `docs/SERVIDOR_WEB.md` y su configuración |
| 5 | Clúster (Juan) | Probar `docker compose up --build`. Verificar el balanceo (el campo `node` alterna) y el failover (`docker compose stop app1`). Reportar y corregir errores. | `docker-compose.yml`, `nginx/` |
| 6 | Pruebas (Randal) | Elegir herramienta de pruebas de carga (k6, autocannon, JMeter u otra). Escribir el plan de pruebas. | `docs/PRUEBAS_DE_CARGA.md` |

**Terminada cuando:** el contenedor y el servidor web están configurados y documentados (Entrega Clase 33).

## Ronda 2: el clúster funcionando → Entrega Clase 36

**Depende de:** que el compañero 5 confirme que el clúster levanta con `docker compose up`.

1. **Decisión de persistencia de pedidos (todos opinan, deciden juntos).** Leer `docs/DECISIONES.md`, Pendiente 1. Implementan el 2 (código) y el 5 (servicio en Compose).
2. El 5 prepara y ensaya la demostración de failover.
3. El 6 corre las primeras pruebas de carga y guarda los resultados.
4. El 3 conecta la interfaz al balanceador (`http://localhost:8080`).
5. El 1 escribe el guion de la demo: qué se muestra y quién lo muestra.

**Terminada cuando:** la demo del clúster con balanceo y failover funciona de principio a fin.

## Ronda 3: cierre → Entrega Clase 39

1. El 4 agrega HTTPS en el balanceador Nginx.
2. El 6 aplica seguridad y monitoreo (temas de la Clase 37) y valida el dimensionamiento con pruebas reales.
3. El 1 actualiza la documentación y el diagrama.
4. **Todos** ensayan la defensa oral. Cada uno debe poder explicar cualquier parte del sistema.

## Cómo se registra el avance

Cada vez que termines algo, agrega una entrada en tu archivo de `avances/` y abre un Pull Request.
El coordinador revisa, pide cambios si hace falta y aprueba.
