# Mamá Toyo – Pedidos para llevar y menú del día

Proyecto de Cátedra · Gestión de Servidores Web · Sección A · Laboratorio 3 · UNIVO

Sistema web de pedidos para llevar y menú del día para el Comedor Mamá Toyo (San Miguel),
desplegado como clúster con balanceo de carga para mantenerse disponible en la hora pico del almuerzo.

> Los platos y precios del sistema son **datos de ejemplo** para la demostración.

Pollo frito (porción) $3.50 – $4.50
Pollo asado (porción) $3.50 – $4.50
Chow mein con pollo $3.00 – $4.00
Pastelitos o empanadas (orden) $2.00 – $3.00
Carne de res guisada $4.00 – $5.00
Carne en salsa con verduras $4.00 – $5.00
Arroz (acompañamiento) $0.75 – $1.25
Ensalada de coditos $0.75 – $1.50
Ensalada fresca $0.50 – $1.00
Sopa de gallina india $5.00 – $8.00


## Equipo

| N.º | Nombre | Usuario de GitHub | Responsabilidad principal |
|---|---|---|---|
| 1 | Jefferson Requeno | JeffersonUU7 | Coordinación y documentación |
| 2 | Brissvey Calderon |  | Contenedor Express/TypeScript |
| 3 | Yessica Medrano |  | Interfaz de menú y pedidos |
| 4 | Josue Zelaya |  | Servidor web y HTTPS |
| 5 | Juan Flores |  | Clúster Docker y Nginx |
| 6 | Randal Lopez |  | Pruebas de carga y monitoreo |

## Arquitectura

```
Cliente --HTTPS--> Nginx (balanceador) --> Nodo 1 (Express)  /health
                                       \-> Nodo 2 (Express)  /health
```

## Rutas de la aplicación

| Ruta | Método | Función |
|---|---|---|
| `/health` | GET | Responde 200 si el nodo funciona (lo usa el balanceador) |
| `/menu` | GET | Platos del día con su precio |
| `/pedidos` | POST | Crea un pedido y devuelve su número |
| `/pedidos/:numero` | GET | Consulta un pedido |
| `/cocina` | GET | Pedidos pendientes, en orden de llegada |

Cada respuesta incluye el campo `node`, que indica qué nodo atendió la petición.

## Cómo correrlo

### Opción A: solo la app (sin Docker)

```bash
npm install
cp .env.example .env     # en Windows: copy .env.example .env
npm run dev
```

Prueba: <http://localhost:3000/health>

### Opción B: clúster completo con Docker Compose

```bash
docker compose up --build
```

Prueba: <http://localhost:8080/menu>. Recarga varias veces y mira cómo cambia `node`
entre `nodo-1` y `nodo-2`. Para simular una falla: `docker compose stop app1` y vuelve a probar.

## Ejemplo de pedido

```bash
curl -X POST http://localhost:8080/pedidos \
  -H "Content-Type: application/json" \
  -d '{"cliente":"Ana","items":[{"platoId":1,"cantidad":2},{"platoId":5,"cantidad":2}]}'
```

## Estructura del repositorio

```
src/            Código de la app (Express/TypeScript)
nginx/          Configuración del balanceador
avances/        Un archivo de avances por integrante
docs/           Reparto de tareas, orden de trabajo, decisiones y documentación
Dockerfile      Imagen de cada nodo
docker-compose.yml   Clúster: 2 nodos + Nginx
```

## Cómo trabajamos

1. Empieza por [LEEME_PRIMERO.txt](LEEME_PRIMERO.txt).
2. Reglas de ramas y Pull Requests: [CONTRIBUTING.md](CONTRIBUTING.md).
3. Orden de trabajo y dependencias: [docs/ORDEN_DE_TRABAJO.md](docs/ORDEN_DE_TRABAJO.md).
4. Tareas por persona y por entrega: [docs/REPARTO.md](docs/REPARTO.md).
5. Registro de avances de cada integrante: carpeta [avances/](avances/).

## Entregas

| Entrega | Contenido | Peso |
|---|---|---|
| Clase 29 | Propuesta de equipo y tema | 10 % |
| Clase 33 | Arquitectura y repositorio: contenedor y servidor configurados | 20 % |
| Clase 36 | Demo del clúster con balanceo de carga funcionando | 20 % |
| Clase 39 | Entrega final y defensa | 50 % |
