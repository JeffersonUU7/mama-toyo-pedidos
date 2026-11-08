# Decisiones técnicas pendientes y registradas

## Pendiente 1: ¿dónde se guardan los pedidos? (importante)

Hoy los pedidos se guardan **en la memoria de cada nodo**. En un clúster con 2 nodos esto causa
un fallo real: un pedido creado en `nodo-1` **no existe** en `nodo-2`. Si el cliente consulta su pedido
y el balanceador lo manda al otro nodo, recibe "no encontrado"; y `/cocina` mostraría pedidos distintos
según el nodo.

Opciones a evaluar (el equipo decide antes de la Clase 36):

| Opción | Ventaja | Costo |
|---|---|---|
| Servicio de base de datos en Docker Compose (por ejemplo PostgreSQL) | Es lo más cercano a un sistema real | Un servicio más que configurar |
| Redis compartido | Simple y rápido | Datos menos duraderos |
| Archivo/volumen compartido | Muy simple | Frágil con escrituras simultáneas |

Un clúster solo es "sin estado" si el estado vive fuera de los nodos. Esta decisión debe explicarse en la defensa.

## Pendiente 2: HTTPS en el balanceador

Se agrega en la Clase 37. Mientras tanto Nginx corre en HTTP (puerto 8080). Se necesita un certificado
autofirmado en `certs/` (las llaves están en `.gitignore`: no se suben al repositorio).

## Pendiente 3: servidor web (Apache o IIS)

Decidir si el servidor web de la Unidad 2 va dentro de cada nodo o delante del balanceador, y reflejarlo en el diagrama.

## Pendiente 4: health check

Hoy Nginx usa health check **pasivo** (saca un nodo tras 2 fallos). El check a nivel de URL
(`/health`) lo ejecuta Docker (`HEALTHCHECK` del Dockerfile). Evaluar cómo mostrarlo en la demo.

## Pendiente 5: precios en rangos

El menú real (`docs/MENU.md`) tiene precios en **rangos** (por ejemplo, pollo frito de $3.50 a $4.50), pero
la app guarda **un solo precio** por plato y calcula el total del pedido con él. Hay que decidir cómo se maneja:

| Opción | Ventaja | Costo |
|---|---|---|
| Guardar `precioMin` y `precioMax` y mostrar el total como rango | Fiel al menú real | Cambia `src/data.ts`, `src/pedidos.ts` y la interfaz |
| Un precio fijo por plato (por ejemplo, el mínimo o un punto medio acordado) | Simple, no cambia la lógica | El total es aproximado |
| Dividir en variantes con precio fijo (porción pequeña, porción grande) | Cada variante tiene su precio | Hay que definir las variantes con el comedor |

Decide el equipo (área 2 implementa) antes de la Clase 33.

## Decisiones registradas

- Clúster activo-activo con balanceo de carga, 2 nodos mínimo.
- Dimensionamiento inicial: 300 usuarios de pico, 400 por nodo, factor 1.5, resultado 2 nodos (por validar con pruebas de carga).
- Meta de disponibilidad: 99.9 %.
