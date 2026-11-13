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

## Entrega 2 – Clase 33 (20 %): contenedor + servidor web con HTTPS (Fase 2, entregada)

- [x] (2) Revisar y completar las rutas de la app; agregar validaciones y manejo de errores
- [x] (2) Verificar que el contenedor construye y corre con Docker
- [x] (3) Página web estática con el menú del día y formulario de pedido (consume `/api/menu` y `/api/pedidos`)
- [x] (4) Configurar Apache para servir lo estático y reenviar `/api` al contenedor
- [x] (4) Configurar HTTPS con certificado local (mkcert)
- [ ] (5) Confirmar con Docker `docker-compose.yml` y `nginx/nginx.conf` (el balanceo y el failover se probaron fuera de Docker)
- [x] (1) Diagrama de arquitectura detallado en `docs/ARQUITECTURA.md`
- [x] (1) README completo con los pasos para correr el proyecto

## Entrega 3 – Clase 36 (20 %): demo del clúster con balanceo y base de datos

- [ ] (5) Clúster de 2 nodos balanceado por Nginx funcionando con `docker compose up`, con balanceo y failover confirmados
- [ ] (5) Servicio `db` (PostgreSQL) en `docker-compose.yml` y `DATABASE_URL` en los nodos (contrato en `docs/DECISIONES.md`, Decisión 1)
- [ ] (2) Pedidos guardados en PostgreSQL en `src/pedidos.ts` (Decisión 1)
- [ ] (2) Ruta `PATCH /api/pedidos/:numero` para marcar un pedido como listo (Decisión 5)
- [ ] (3) Botón "marcar listo" en la vista de cocina
- [ ] (5) Demostrar el failover con la base de datos
- [ ] (6) Primeras pruebas de carga (1 y 2 nodos, una de 300 a 400 usuarios virtuales) y resultados en `docs/`
- [ ] (4) Preparar el Apache por nodo (`apache1` y `apache2`), Decisión 2, etapa 2
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
