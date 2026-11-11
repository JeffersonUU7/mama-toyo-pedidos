# Evidencias de HTTPS y funcionamiento (Fase 2)

Capturas del sitio funcionando en `https://localhost:8443`, con el certificado generado por mkcert.

## 1. Sitio cargando con el candado de seguridad

![Sitio con HTTPS y candado](01-sitio-https-candado.png)

## 2. Detalle del certificado

![Detalle del certificado](02-certificado.png)

## 3. Pedido creado desde la interfaz

![Pedido creado](03-pedido-creado.png)

## 4. La API respondiendo a través del reverse proxy

`https://localhost:8443/api/menu`

![API por el proxy](04-api-por-proxy.png)

## 5. Apache y el contenedor Express corriendo

Salida de `docker compose -f apache/docker-compose.apache.yml ps`.

![Docker Compose](05-docker-compose.png)
