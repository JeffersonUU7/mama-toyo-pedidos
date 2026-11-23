#!/usr/bin/env bash
# Permisos POSIX del proyecto: los aplica y los muestra (sin 777). Evidencia para la defensa.
# Uso (desde cualquier carpeta): bash docs/pruebas/permisos.sh
# Ejecutar en Linux, macOS o WSL: en Windows/Git Bash sobre NTFS, chmod casi no tiene efecto real.
cd "$(dirname "$0")/../.." || exit 1

echo "=== 1. Aplicando permisos minimos necesarios ==="
[ -f certs/server.key ] && chmod 600 certs/server.key   # llave privada: solo el dueño lee/escribe
[ -f certs/server.crt ] && chmod 644 certs/server.crt   # certificado: es publico
chmod 644 nginx/nginx.conf nginx/proxy.inc apache/*.conf docker-compose*.yml Dockerfile
chmod 644 nginx/htpasswd                                # lo lee el worker de Nginx (usuario "nginx"): con 640 daria 500
chmod 755 certs/generar-certificado.sh docs/pruebas/*.sh
echo "listo"

echo
echo "=== 2. Permisos de los archivos sensibles ==="
ls -l certs/ nginx/ apache/*.conf 2>/dev/null

echo
echo "=== 3. Auditoria: archivos con permiso de escritura para 'otros' (debe salir VACIO) ==="
find . \( -path ./node_modules -o -path ./.git \) -prune -o -type f -perm -o+w -print
echo "(fin de la lista)"

echo
echo "=== 4. Auditoria: ningun archivo 777 (debe salir VACIO) ==="
find . \( -path ./node_modules -o -path ./.git \) -prune -o -perm 777 -print
echo "(fin de la lista)"

if docker compose ps --status running 2>/dev/null | grep -q app1; then
  echo
  echo "=== 5. Dentro de los contenedores ==="
  echo "-- app1 corre como usuario no-root:"
  docker compose exec -T app1 sh -c 'id; ls -ld /app /app/dist'
  echo "-- apache1: el sitio esta montado SOLO LECTURA (intentar escribir debe fallar):"
  docker compose exec -T apache1 sh -c 'touch /usr/local/apache2/htdocs/prueba.txt' 2>&1 || true
  echo "-- nginx: llave privada montada solo lectura:"
  docker compose exec -T nginx sh -c 'ls -l /etc/nginx/certs/; touch /etc/nginx/certs/x' 2>&1 || true
fi
