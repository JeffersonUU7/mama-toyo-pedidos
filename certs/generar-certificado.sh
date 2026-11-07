#!/usr/bin/env bash
# Genera un certificado AUTOFIRMADO para pruebas locales (Git Bash, Linux o macOS).
# Las llaves (.key/.pem) estan en .gitignore: NO se suben al repositorio.
set -euo pipefail
cd "$(dirname "$0")"
MSYS_NO_PATHCONV=1 openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
-keyout server.key -out server.crt \
-subj "/C=SV/ST=San Miguel/O=Comedor Mama Toyo (proyecto de catedra)/CN=localhost" \
-addext "subjectAltName=DNS:localhost,IP:127.0.0.1" -addext "basicConstraints=critical,CA:FALSE"
echo "Listo: certs/server.crt y certs/server.key"
