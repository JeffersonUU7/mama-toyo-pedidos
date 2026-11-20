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

**Importante:** El puerto `:8080` (Nginx balanceador) **solo expone la API** (`/api/health`, `/api/menu`, `/api/pedidos`, `/api/cocina`, `/api/pedidos/:numero` PATCH). No sirve la interfaz web (`web/`). La interfaz se sirve por Apache en `:8443` (Fase 2) o por los Apache por nodo (Decisión 2, etapa 2, pendiente). Las pruebas de carga se ejecutan contra la API directamente.

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
docker compose up --build   # levanta Nginx (:8080), app1, app2, db
```

Las pruebas de carga se ejecutan contra `http://localhost:8080/api/...` (sin interfaz web).

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
- Destino: `http://localhost:8080` (acceso desde el contenedor mediante `host.docker.internal`).

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