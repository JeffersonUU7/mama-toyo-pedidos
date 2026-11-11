#!/usr/bin/env bash
# Genera el certificado HTTPS local: certs/server.crt y certs/server.key.
#  - Con mkcert (recomendado): el navegador muestra el candado SIN advertencias.
#  - Sin mkcert: certificado autofirmado con openssl (el navegador mostrara una advertencia).
# Las llaves (.key/.pem) estan en .gitignore: NO se suben al repositorio.
set -euo pipefail
cd "$(dirname "$0")"

if command -v mkcert >/dev/null 2>&1; then
  mkcert -install
  mkcert -cert-file server.crt -key-file server.key localhost 127.0.0.1 ::1
  echo "Listo (mkcert): certs/server.crt y certs/server.key. Cierra y vuelve a abrir el navegador."
else
  echo "mkcert no esta instalado: se genera un certificado autofirmado (el navegador avisara)."
  MSYS_NO_PATHCONV=1 openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout server.key -out server.crt \
    -subj "/C=SV/ST=San Miguel/O=Comedor Mama Toyo (proyecto de catedra)/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" -addext "basicConstraints=critical,CA:FALSE"
  echo "Listo (autofirmado): certs/server.crt y certs/server.key"
fi
