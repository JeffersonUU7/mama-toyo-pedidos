# Servidor web: Apache + HTTPS

Responsable: Josue Zelaya (área 4). Cubre la Unidad 2 del curso.

## Decisión: Apache (no IIS)

| Criterio | Apache httpd | IIS |
|---|---|---|
| Sistema | Corre igual en Windows, Linux y macOS | Solo Windows (el equipo no es 100 % Windows) |
| Docker | Imagen oficial `httpd:2.4-alpine`, mismo método que el resto del proyecto | Requiere contenedores Windows, no compatibles con el cluster Linux |
| Configuración | Un archivo de texto versionable en Git (`apache/httpd.conf`) | Gestor gráfico, difícil de revisar en un Pull Request |
| Costo | Gratis, código abierto | Viene con Windows Server/Pro |

Se elige **Apache** porque se versiona en el repositorio, lo puede levantar cualquier integrante con Docker y encaja con el cluster Linux.

## Qué hace

```
Navegador --HTTPS 8443--> Apache --(estático)--> carpeta web/
                                 \--(/menu /pedidos /cocina /health)--> Express :3000
```

- Sirve `web/` (la interfaz de Yessica) montada como carpeta de solo lectura.
- Reenvía `/menu`, `/pedidos`, `/cocina` y `/health` al puerto 3000 con `ProxyPass`.
- HTTP (8081) redirige a HTTPS (8443). TLS 1.2 y 1.3 únicamente, con certificado autofirmado.
- Seguridad básica: oculta la versión del servidor, sin listado de directorios, cabeceras HSTS, `nosniff` y `X-Frame-Options`.

## Cómo levantarlo

```bash
bash certs/generar-certificado.sh        # una vez; crea certs/server.crt y server.key (no se suben a Git)
npm run dev                              # la app en :3000
docker compose -f apache/docker-compose.apache.yml up
```

Prueba: <https://localhost:8443/health> (el navegador avisa del certificado autofirmado: es normal en local).
Con curl: `curl -k https://localhost:8443/menu`.

## Archivos

- `apache/httpd.conf`: configuración completa.
- `apache/docker-compose.apache.yml`: contenedor de Apache, aparte de `docker-compose.yml` para no pisar el trabajo de Juan.
- `certs/generar-certificado.sh`: crea el certificado autofirmado.

## Decisión pendiente (Pendiente 3 de DECISIONES.md)

Hoy Apache reenvía a un nodo único en el puerto 3000. Opción propuesta: poner **Apache delante del balanceador Nginx**
(cambiar el destino de `ProxyPass` a `http://nginx:80` y unir ambos compose a la misma red). Así Apache ofrece el HTTPS y el
estático, y Nginx sigue balanceando entre `nodo-1` y `nodo-2`. Debe quedar reflejado en el diagrama de Jefferson.

## Certificado autofirmado

`certs/generar-certificado.sh` crea `server.crt` y `server.key` con `openssl`, válidos 365 días para `localhost` y `127.0.0.1`.
El certificado se marca con `basicConstraints=CA:FALSE` para que Apache no lo trate como una autoridad certificadora
(sin eso, Apache muestra la advertencia `AH01906`). Los navegadores avisan "No seguro" porque ninguna entidad reconocida
lo firmó; en local es lo esperado. La llave privada no se sube a Git (está en `.gitignore`).

## Estado de las pruebas

Probado en Windows con Docker Desktop, con la app corriendo con `npm run dev`:

| Prueba | Resultado |
|---|---|
| `https://localhost:8443/health` | `{"status":"ok","node":"local"}` |
| `https://localhost:8443/menu` | Devuelve los 5 platos (proxy a Express en :3000) |
| `https://localhost:8443/` con `web/` vacía | 404 de Apache (esperado: aún no hay `index.html`) |
| `https://localhost:8443/` con un `index.html` de prueba en `web/` | Apache sirve el HTML estático |
| `http://localhost:8081` | Redirige a `https://localhost:8443/` |
| Log de Apache al arrancar | Sin advertencias tras generar el certificado con `CA:FALSE` |

Pendiente: probar con la interfaz real cuando Yessica suba `web/`, y decidir si el proxy apunta al balanceador Nginx
(Pendiente 3 de `docs/DECISIONES.md`).