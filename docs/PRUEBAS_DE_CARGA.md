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

Las pruebas estarán orientadas a evaluar los servicios web del proyecto.

Se consideran los siguientes componentes:

- Servicio principal de Node.js.
- Endpoint de comprobación de salud `/health`.
- Consulta del menú.
- Registro y procesamiento de pedidos.
- Disponibilidad del sistema cuando aumenta el tráfico.

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