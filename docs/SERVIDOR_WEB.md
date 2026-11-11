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
                                 \--(/api, /health)--> contenedor Express :3000
```

- Sirve `web/` (la interfaz de Yessica) montada como carpeta de solo lectura.
- Reenvía `/api/...` y `/health` al contenedor Express con `ProxyPass` y `ProxyPassReverse`.
- HTTP (8081) redirige a HTTPS (8443). TLS 1.2 y 1.3 únicamente.
- Seguridad básica: oculta la versión del servidor, sin listado de directorios, cabeceras `nosniff`, `X-Frame-Options` y HSTS corto (5 minutos).

## Cómo levantarlo

```bash
bash certs/generar-certificado.sh        # una vez; crea certs/server.crt y server.key (no se suben a Git)
docker compose -f apache/docker-compose.apache.yml up --build
```

Un solo comando levanta Apache y el contenedor Express. Prueba: <https://localhost:8443>
y <https://localhost:8443/api/menu>. Con curl: `curl -k https://localhost:8443/api/menu`.

## Archivos

- `apache/httpd.conf`: configuración completa.
- `apache/docker-compose.apache.yml`: Apache y el contenedor Express (Fase 2), aparte de `docker-compose.yml` (clúster de Juan).
- `certs/generar-certificado.sh`: crea el certificado (con mkcert si está instalado; si no, autofirmado).

## Arquitectura de las siguientes fases

Decidida en `docs/DECISIONES.md`, Decisión 2: Nginx al frente (HTTPS) y un Apache por nodo. Hoy Apache reenvía a un
contenedor Express único.

## Certificado HTTPS

`certs/generar-certificado.sh` crea `server.crt` y `server.key` para `localhost`, `127.0.0.1` y `::1`.

- **Con mkcert (recomendado):** mkcert instala una autoridad certificadora local en tu equipo, así que el navegador
  muestra el **candado sin advertencias**. Instalación en Windows: `winget install FiloSottile.mkcert`, y vuelve a abrir Git Bash.
  El script ejecuta `mkcert -install` (Windows pide confirmar la instalación) y genera el certificado.
- **Sin mkcert:** el script usa `openssl` y crea un certificado autofirmado con `basicConstraints=CA:FALSE`
  (sin eso, Apache muestra la advertencia `AH01906`). Los navegadores avisan "No seguro" porque ninguna entidad reconocida lo firmó.

La llave privada no se sube a Git (está en `.gitignore`).

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

**Cambios de la Fase 2 (pendientes de probar):** se agregó el prefijo `/api`, el contenedor Express dentro del compose de Apache,
el soporte de mkcert y se bajó el HSTS a 5 minutos. Las pruebas de arriba se hicieron con la configuración anterior
(app en `npm run dev` y rutas sin `/api`).
