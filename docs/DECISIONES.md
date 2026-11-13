# Decisiones técnicas

Estas decisiones las tomó la coordinación (Jefferson) el 09/11/2026 y aplican a todo el equipo.
Si alguien ve un problema serio con alguna, lo avisa por el grupo antes de cambiarla por su cuenta.

## Decisión 1: los pedidos se guardan en PostgreSQL

**Problema.** Hoy los pedidos viven en la memoria de cada nodo. Con 2 nodos, un pedido creado en `nodo-1`
no existe en `nodo-2`: el cliente consulta su pedido y a veces le sale "no encontrado", y `/cocina` muestra
listas distintas según el nodo. Un clúster solo es "sin estado" si el estado vive fuera de los nodos.

**Decisión.** PostgreSQL 16 como servicio de Docker Compose, con un volumen para que los datos no se pierdan.

**Cómo se implementa**
- Juan: servicio `db` en `docker-compose.yml` (imagen `postgres:16-alpine`, volumen nombrado y healthcheck con `pg_isready`).
  `app1` y `app2` reciben `DATABASE_URL` y esperan a que `db` esté sano (`depends_on` con `condition: service_healthy`).
- Brissvey: `src/pedidos.ts` usa el paquete `pg`. Al arrancar crea la tabla `pedidos` si no existe, con número
  (serial, clave primaria), cliente, items (jsonb), total mínimo, total máximo, estado (pendiente o listo) y fecha.
- Si `DATABASE_URL` no está definida, la app sigue usando memoria, para que `npm run dev` funcione sin Docker.

**Contrato entre Juan y Brissvey** (para que sus cambios encajen):

| Dato | Valor |
|---|---|
| Servicio en Compose | `db`, imagen `postgres:16-alpine` |
| Base de datos y usuario | `toyo` y `toyo` |
| Contraseña (solo desarrollo local) | `${POSTGRES_PASSWORD:-toyo_local}`; se agrega `POSTGRES_PASSWORD=toyo_local` a `.env.example`. En la Ronda 3 se revisa como parte de la seguridad. |
| Variable que reciben los nodos | `DATABASE_URL=postgres://toyo:${POSTGRES_PASSWORD:-toyo_local}@db:5432/toyo` |
| Volumen | `pgdata`, montado en `/var/lib/postgresql/data` |
| Healthcheck de `db` | `pg_isready -U toyo -d toyo`, cada 5 segundos |
| Dependencia | `app1` y `app2` con `depends_on: db: condition: service_healthy` |
| Paquete en la app | `pg` en `dependencies` (no en `devDependencies`, porque el Dockerfile instala solo lo de producción) y `@types/pg` en `devDependencies` |
| Tabla `pedidos` | `numero` SERIAL clave primaria, `cliente` TEXT, `items` JSONB, `total_min` y `total_max` NUMERIC(10,2), `estado` TEXT con valor por defecto `'pendiente'`, `creado` TIMESTAMPTZ con valor por defecto `now()` |
| Respuesta de la API | La misma de hoy: `numero`, `cliente`, `items`, `totalMin`, `totalMax`, `estado` y `creado` |

Un detalle que suele fallar: `pg` devuelve las columnas `NUMERIC` como texto. Hay que convertirlas con `Number()` para que
`totalMin` y `totalMax` sigan siendo números, como espera la interfaz.

**Cómo se comprueba.** Crear un pedido y consultar varias veces `http://localhost:8080/pedidos/1`: debe aparecer
siempre, sin importar qué nodo responda.

**Por qué no las otras opciones.** Redis guarda en memoria por defecto, así que es menos duradero para pedidos.
Un archivo compartido es frágil con escrituras simultáneas.

**Límite que se declara en la defensa.** La base de datos es una sola y no se replica, así que es un punto único
de falla. La alta disponibilidad de este proyecto cubre la capa de aplicación.

## Decisión 2: Nginx al frente, y Apache en cada nodo

```
Cliente --HTTPS--> Nginx --HTTPS--> Apache 1 --> Express 1 --\
                                \-> Apache 2 --> Express 2 ---> PostgreSQL
```

**Por qué.** Nginx es el punto de entrada único, como se vio en clase. Hay HTTPS en el servidor (Apache) y en el
balanceador (Nginx), como pide el alcance del proyecto. Y cada nodo repite lo trabajado en las Unidades 1 y 2.

**Se construye por etapas, para que cada una se pueda demostrar:**
1. **Etapa 1 (Clase 36).** Nginx balancea los dos Express, que ya existen, y se agrega PostgreSQL. Mientras tanto la
   interfaz se sigue viendo con el Apache independiente (`apache/docker-compose.apache.yml`).
2. **Etapa 2 (antes de la Clase 39).** Cada nodo tiene su Apache, que sirve `web/` y reenvía a su Express. Nginx
   balancea hacia los Apache. Responsables: Josué y Juan.
3. **Etapa 3 (Clase 37).** HTTPS en Nginx con un certificado autofirmado de `certs/`. Nginx habla por HTTPS con los
   Apache. Responsable: Josué.

**Plan B si no alcanza el tiempo** (propuesta de Josué): Apache delante de Nginx. Se cambia el `ProxyPass` a
`http://nginx:80` y se unen ambos compose a la misma red. Funciona con pocos cambios, pero el balanceador deja de ser
la entrada y Apache pasa a ser un punto único de falla. La coordinación decide si se usa al terminar la Clase 36.

## Decisión 3: health check

Se queda como está: Nginx saca un nodo tras 2 fallos (comprobación pasiva) y Docker revisa `/health` con el
`HEALTHCHECK` del Dockerfile. Para la demo se muestra `docker compose ps` (estado healthy) y el failover con
`docker compose stop app1`. En la Ronda 3, Randal puede agregar un script de monitoreo que consulte `/health`.

## Decisión 4: los precios se mantienen como rangos

Los precios de `docs/MENU.md` son los del comedor, verificados en el local. Se mantienen como rangos
(`precioMin` y `precioMax`) y el total del pedido se muestra como rango. Ya está implementado en `src/data.ts`,
`src/pedidos.ts` y en la interfaz.

## Decisión 5: marcar un pedido como listo

Sí, pero después de la persistencia. Ruta `PATCH /api/pedidos/:numero` con `{"estado":"listo"}`. Responde 200 con `{node, pedido}`; 404 si el pedido
no existe; 400 si el número es inválido o el estado no es `listo`. Repetirla sobre un pedido ya listo no da error.
`/api/cocina` muestra solo los pendientes. Brissvey hace la ruta y Yessica el botón en `cocina.html`. Si el tiempo no alcanza, no entra en la demo de la Clase 36.

## Límites de validación (ya aplicados en la API)

Cantidad por plato de 1 a 20, hasta 20 líneas por pedido y nombre de hasta 60 caracteres. Son los mismos límites de la interfaz web.

## Decisiones anteriores

- Clúster activo-activo con balanceo de carga, 2 nodos mínimo.
- Dimensionamiento inicial: 300 usuarios de pico, 400 por nodo, factor 1.5, resultado 2 nodos (por validar con pruebas de carga).
- Meta de disponibilidad: 99.9 %.
