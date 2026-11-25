# PLAN DE PRUEBAS DE CARGA Y RENDIMIENTO
## Proyecto: MAMA TOYO - PEDIDOS PARA LLEVAR

**Responsable:** Randal López  
**Área:** Pruebas y monitoreo  
**Herramienta seleccionada:** Grafana k6

---

## 1. Introducción

El presente documento establece el plan de pruebas de carga y rendimiento para el sistema Mama Toyo - Pedidos para Llevar.

El objetivo es evaluar el comportamiento de la aplicación cuando varios usuarios acceden simultáneamente, permitiendo identificar posibles problemas de rendimiento, tiempos de respuesta elevados y errores en el servidor.

Para realizar estas pruebas se utilizará Grafana k6, una herramienta que permite simular usuarios virtuales y analizar el comportamiento de los servicios web.

## 2. Objetivo general

Evaluar el rendimiento, estabilidad y capacidad de respuesta del sistema Mama Toyo ante diferentes niveles de tráfico, identificando posibles problemas antes de su utilización real.

## 3. Objetivos específicos

- Medir los tiempos de respuesta del servidor.
- Comprobar el funcionamiento del sistema con múltiples usuarios simultáneos.
- Identificar errores HTTP durante las solicitudes.
- Evaluar la disponibilidad del servicio.
- Detectar posibles puntos de saturación.
- Documentar los resultados obtenidos durante las pruebas.

## 4. Herramienta seleccionada

Se utilizará Grafana k6 debido a las siguientes características:

- Permite realizar pruebas de carga y estrés.
- Utiliza JavaScript para definir los escenarios.
- Permite configurar la cantidad de usuarios virtuales.
- Genera estadísticas sobre los tiempos de respuesta.
- Permite establecer condiciones para determinar si una prueba fue exitosa.

## 5. Alcance de las pruebas

Las pruebas estarán orientadas a evaluar los servicios web del proyecto (API).

**Importante:** el punto de entrada del clúster es `https://localhost:8443` (Nginx). Ahí se sirven la interfaz web y la API; `:8080` solo redirige a HTTPS. Los scripts de k6 apuntan a `https://host.docker.internal:8443` con `insecureSkipTLSVerify` (certificado de desarrollo). `PATCH /api/pedidos/:n` exige la clave de cocina; Nginx limita las escrituras a 30/s por IP (ver `docs/pruebas/resultados/resumen-carga-progresiva.md`).

Se consideran los siguientes endpoints:

- Endpoint de comprobación de salud `/health` (también `/api/health`)
- Consulta del menú `/api/menu`
- Registro y procesamiento de pedidos `/api/pedidos` (POST)
- Consulta de pedido `/api/pedidos/:numero` (GET)
- Marcar pedido como listo `/api/pedidos/:numero` (PATCH)
- Vista de cocina `/api/cocina` (GET)
- Disponibilidad del sistema cuando aumenta el tráfico

Los endpoints definitivos del menú y los pedidos se confirmarán con el equipo cuando estén implementados.

## 6. Tipos de pruebas

### 6.1. Prueba de referencia (Baseline)

Se realizará una prueba inicial con una cantidad pequeña de usuarios para conocer el comportamiento normal del sistema.

Configuración inicial:
- Usuarios virtuales: 5.
- Duración: 1 minuto.
- Objetivo: establecer una referencia del rendimiento.

### 6.2. Prueba de carga

Se aumentará progresivamente la cantidad de usuarios para comprobar cómo responde el sistema ante una demanda mayor.

Configuración inicial:
- Usuarios virtuales: hasta 50.
- Duración: 3 minutos.
- Objetivo: comprobar que el sistema responda correctamente.

### 6.3. Prueba de estrés

Se incrementará la cantidad de usuarios por encima de la carga habitual para identificar posibles límites del sistema.

Configuración inicial:
- Usuarios virtuales: hasta 100.
- Duración: 3 minutos.
- Objetivo: identificar posibles errores y problemas de saturación.

Estas cantidades son valores iniciales de prueba y podrán ajustarse según los recursos disponibles.

## 7. Métricas de evaluación

Durante las pruebas se recopilarán las siguientes métricas:

| Métrica | Descripción |
|---|---|
| http_req_duration | Tiempo que tarda una solicitud HTTP. |
| http_req_failed | Porcentaje de solicitudes fallidas. |
| http_reqs | Cantidad total de solicitudes realizadas. |
| vus | Usuarios virtuales activos. |
| p95 | Tiempo por debajo del cual responde el 95% de las solicitudes. |

## 8. Criterios de aceptación

Se establecen los siguientes objetivos iniciales:

- Tiempo de respuesta p95 inferior a 500 ms.
- Porcentaje de solicitudes fallidas inferior al 1%.
- El endpoint `/health` debe responder correctamente.
- El sistema debe mantener su funcionamiento durante la prueba de carga.

Estos valores son objetivos de evaluación iniciales y podrán ajustarse después de conocer el rendimiento real de la aplicación.

## 9. Ambiente de pruebas

Las pruebas se realizarán en un entorno local utilizando los servicios del proyecto.

Se utilizarán:

- Node.js.
- Docker y Docker Compose.
- Grafana k6.
- Navegador web.
- Terminal Git Bash.

**Comando para levantar el entorno de pruebas (clúster con PostgreSQL):**

```bash
docker compose up --build   # levanta Nginx (:8443), apache1, apache2, app1, app2, db
```

Las pruebas de carga se ejecutan contra `https://localhost:8443/api/...`.

Las pruebas se realizarán sobre el entorno de desarrollo y no sobre un sistema en producción.

## 10. Registro de resultados

Los resultados de cada prueba deberán documentarse para comparar el comportamiento del sistema.

Se registrarán:

- Cantidad de usuarios utilizados.
- Duración de la prueba.
- Tiempo promedio de respuesta.
- Tiempo p95.
- Cantidad de solicitudes realizadas.
- Porcentaje de errores.
- Problemas encontrados.

## 11. Conclusión

Mediante este plan se establece una metodología para evaluar el rendimiento del sistema Mama Toyo - Pedidos para Llevar.

La utilización de Grafana k6 permitirá identificar cómo responde la aplicación ante diferentes niveles de tráfico y detectar posibles problemas que puedan afectar la experiencia de los usuarios.

Los resultados obtenidos servirán para proponer mejoras y comprobar la estabilidad del sistema.




## 12. Primera prueba de referencia (Baseline)

**Fecha:** 19/11/2026

**Herramienta:** Grafana k6

**Endpoint evaluado:** GET `/api/health`

**Configuración:**
- Usuarios virtuales: 5.
- Duración: 1 minuto.
- Infraestructura: Nginx con dos nodos de aplicación.
- Destino: `http://localhost:8080` (acceso desde el contenedor mediante `host.docker.internal`). *Nota: esta prueba se hizo el 19/11, antes de agregar HTTPS a Nginx; hoy el punto de entrada es `https://localhost:8443`.*

**Resultados obtenidos en la primera ejecución:**

| Métrica | Resultado |
|---|---:|
| Solicitudes HTTP | 300 |
| Iteraciones completadas | 300 |
| Checks correctos | 900 (100%) |
| Tiempo promedio | 8.4 ms |
| Mediana | 5.84 ms |
| p90 | 12.33 ms |
| p95 | 24.11 ms |
| Tiempo máximo | 71.08 ms |
| Solicitudes fallidas | 0 (0%) |
| Solicitudes por segundo | 4.95 |

**Evaluación:**

La primera prueba de referencia finalizó correctamente. Todas las solicitudes HTTP fueron procesadas sin errores y las tres validaciones configuradas en k6 se cumplieron en cada iteración.

El percentil 95 fue de 24.11 ms, inferior al objetivo establecido de 500 ms. El porcentaje de solicitudes fallidas fue del 0%, cumpliendo el límite máximo del 1%.

Los resultados muestran un comportamiento satisfactorio del endpoint de salud con cinco usuarios virtuales.

**Limitación:** esta prueba evalúa exclusivamente el endpoint de salud. No permite concluir todavía cuál es la capacidad máxima del sistema ni el rendimiento de las operaciones que utilizan PostgreSQL.

**Evidencia:** `docs/pruebas/resultados/baseline-health-5vus.json` (archivo de resultados de la ejecución guardada).

## 13. Pruebas de la Ronda 3: dimensionamiento con 400 usuarios, 1 nodo contra 2 nodos

Pruebas ejecutadas para validar el dimensionamiento (requisito de la Ronda 3). Los resultados de la sección 13.4 son los que salieron de la ejecución real; no se escribieron números de antemano.

### 13.1 Qué se ejecuta

| N.º | Prueba | Nodos | Qué mide |
|---|---|---|---|
| 1 | `carga-flujo-completo`, pico 400 | 2 | Flujo real (menú → crear pedido → consultar → marcar listo) usando PostgreSQL |
| 2 | `carga-flujo-completo`, pico 400 | 1 | Lo mismo con un solo nodo: sirve para comparar y justificar tener dos |
| 3 | `carga-progresiva`, pico 400 | 2 | Solo `/api/health`, ya con HTTPS (la de 20/11 fue por HTTP y llegó a 300) |

`carga-flujo-completo` sube a 400 usuarios virtuales (25 %, 50 %, 75 % y 400 sostenidos 60 s), con pausas de 1 a 3 segundos entre
pasos, como harían clientes reales. Umbrales: p95 < 500 ms, solicitudes fallidas < 1 %, verificaciones correctas > 99 %.

### 13.2 Preparación (una sola vez por sesión de pruebas)

Nginx limita las escrituras a 30 por segundo por IP (es una protección real, ver `docs/SEGURIDAD_Y_MONITOREO.md`). Como k6 genera
todo el tráfico desde una sola computadora, hay que levantar el clúster con un archivo adicional que quita ese límite **solo para
medir**. No usarlo en la demo.

```bash
bash docs/pruebas/preparar-carga.sh        # genera nginx/nginx.carga.conf (solo cambia el límite)
docker compose -f docker-compose.yml -f docker-compose.carga.yml up -d --build
docker compose ps                          # los 6 servicios deben estar Up (db, app1, app2 healthy)
```

### 13.3 Ejecución

```bash
# 2 nodos
bash docs/pruebas/correr-pruebas.sh carga-flujo-completo 2nodos 400
bash docs/pruebas/correr-pruebas.sh carga-progresiva 2nodos 400

# 1 nodo: se detiene un nodo completo (Apache + Express) y se repite
docker compose stop apache2 app2
bash docs/pruebas/correr-pruebas.sh carga-flujo-completo 1nodo 400
docker compose start apache2 app2
```

Mientras corre una prueba, en otra terminal: `bash docs/pruebas/monitoreo.sh 5m` (reparto por nodo, errores 5xx, tiempos y uso de
recursos). Con un solo nodo, Nginx intenta primero el nodo detenido y reintenta en el otro, así que pueden verse algunos reintentos al
inicio; es el comportamiento del failover y conviene mencionarlo.

Cada ejecución guarda un **resumen** (unos KB) en `docs/pruebas/resultados/<prueba>-<etiqueta>-400vus.json`. No guardes la salida
cruda de k6 (`--out json`): pesa decenas de MB (la de la prueba del 20/11 pesaba 79 MB).

### 13.4 Resultados

Genera la tabla con:

```bash
node docs/pruebas/resumir.js docs/pruebas/resultados/carga-flujo-completo-2nodos-400vus.json \
  docs/pruebas/resultados/carga-flujo-completo-1nodo-400vus.json \
  docs/pruebas/resultados/carga-progresiva-2nodos-400vus.json
```

Resultado de la ejecución (se escribe con `docs/pruebas/completar-seccion13.js`):

**Ejecutado el 24/11/2026** · Equipo: Docker Desktop con 12 CPU y 7.6 GB de RAM. Resultados generados con `docs/pruebas/ejecutar-seccion13.sh`.

| Prueba | VU máx. | Solicitudes | Promedio | p95 | Máximo | Fallidas | Checks OK | Umbrales |
|---|---|---|---|---|---|---|---|---|
| C:\Users\Jhost\Documents\mama-toyo-pedidos\docs\pruebas\resultados\carga-flujo-completo-2nodos-400vus | 400 | 43407 | 9.2 ms | 16.2 ms | 917.2 ms | 0.00 % | 100.00 % | cumplidos |
| C:\Users\Jhost\Documents\mama-toyo-pedidos\docs\pruebas\resultados\carga-flujo-completo-1nodo-400vus | 400 | 43199 | 12.2 ms | 23.6 ms | 3011.6 ms | 0.00 % | 100.00 % | cumplidos |
| C:\Users\Jhost\Documents\mama-toyo-pedidos\docs\pruebas\resultados\carga-progresiva-2nodos-400vus | 400 | 31442 | 6.0 ms | 10.0 ms | 339.7 ms | 0.00 % | 100.00 % | cumplidos |

- Flujo completo con 400 usuarios virtuales: con 2 nodos el p95 fue 16.2 ms y las solicitudes fallidas 0.00 %; con 1 nodo, 23.6 ms y 0.00 %. Sobre `/api/health` con 2 nodos el p95 fue 10.0 ms y las fallidas 0.00 %.
- Los tres umbrales (p95 < 500 ms, fallidas < 1 %, verificaciones > 99 %) se cumplieron en las tres pruebas.
- El segundo nodo mejora el resultado: con 1 nodo el p95 pasa de 16.2 a 23.6 ms.

### 13.5 Cómo interpretar y qué concluir

- Si con **2 nodos** el p95 queda bajo 500 ms y las fallas bajo 1 % hasta 400 usuarios: el clúster está dimensionado para esa demanda.
- Si con **1 nodo** el p95 o las fallas empeoran claramente, la comparación justifica tener dos nodos. Si no empeoran, decirlo con
  honestidad: en este equipo local el cuello de botella puede ser la propia computadora (k6, Docker y los 6 contenedores comparten CPU).
- Si aparecen `429` es que se levantó con la configuración normal en vez de `docker-compose.carga.yml`.
- Límites que hay que declarar: es una sola máquina (no hay red real entre los nodos), PostgreSQL es un único servicio, el certificado
  es de desarrollo y los usuarios virtuales no ejecutan JavaScript de navegador (miden el servidor, no la interfaz).
- Al terminar: `docker compose -f docker-compose.yml -f docker-compose.carga.yml down` y volver a `docker compose up -d` normal.
