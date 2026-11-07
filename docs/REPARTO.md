# Reparto de tareas

Cada persona es **responsable principal** de un área, pero se ayudan entre sí.
El detalle de cada tarea y su registro de avances está en la carpeta `avances/` (un archivo por persona). El orden y las dependencias están en `docs/ORDEN_DE_TRABAJO.md`.

## Responsables

| N.º | Área | Responsable |
|---|---|---|
| 1 | Coordinación y documentación | Jefferson Requeno |
| 2 | Contenedor Express/TypeScript | Brissvey Calderon |
| 3 | Interfaz de menú y pedidos | Yessica Medrano |
| 4 | Servidor web y HTTPS | Josue Zelaya |
| 5 | Clúster Docker y Nginx | Juan Flores |
| 6 | Pruebas de carga y monitoreo | Randal Lopez |

## Entrega 2 – Clase 33 (20 %): arquitectura + repositorio con contenedor y servidor configurados

- [ ] (2) Revisar y completar las rutas de la app; agregar validaciones y manejo de errores
- [ ] (2) Verificar que el contenedor construye y corre con `docker build`
- [ ] (3) Página web estática con el menú del día y formulario de pedido (consume `/menu` y `/pedidos`)
- [ ] (4) Configurar el servidor web (Apache o IIS) para servir lo estático y reenviar lo dinámico al contenedor
- [ ] (4) Configurar HTTPS con certificado autofirmado en local
- [ ] (5) Revisar `docker-compose.yml` y `nginx/nginx.conf`
- [ ] (1) Diagrama de arquitectura detallado en `docs/`
- [ ] (1) README completo con los pasos para correr el proyecto

## Entrega 3 – Clase 36 (20 %): demo del clúster con balanceo funcionando

- [ ] (5) Clúster de 2 nodos balanceado por Nginx funcionando con `docker compose up`
- [ ] (2) Resolver el problema de pedidos entre nodos (ver `docs/DECISIONES.md`)
- [ ] (5) Demostrar el failover: apagar un nodo y que el sitio siga respondiendo
- [ ] (6) Primeras pruebas de carga y registro de resultados
- [ ] (1) Guion de la demo (qué se muestra y quién lo muestra)

## Entrega final – Clase 39 (50 %): entrega + defensa

- [ ] (4) HTTPS en el balanceador Nginx
- [ ] (6) Seguridad y monitoreo aplicados (temas de la Clase 37)
- [ ] (6) Validar el dimensionamiento con pruebas de carga reales
- [ ] (1) Documentación final y diagrama actualizado
- [ ] (todos) Preparar y ensayar la defensa oral; todos deben poder explicar todo el sistema

## Criterios de la entrega final (referencia)

| Criterio | Puntos |
|---|---|
| Problema real resuelto con claridad (impacto, usabilidad) | 10 |
| Integración técnica completa (contenedor + servidor/HTTPS + clúster/balanceo) | 20 |
| Seguridad y monitoreo aplicados | 10 |
| Documentación y arquitectura (diagrama, README) | 5 |
| Defensa oral grupal | 5 |
