# Reenvio comun hacia los Apache de los nodos (lo incluye cada location de nginx.conf).
proxy_pass https://cluster_app;

# Nginx -> Apache va cifrado. No se verifica el certificado porque los Apache usan el mismo
# certificado de desarrollo (CN=localhost) y se les llega por nombre de servicio (apache1/apache2).
# Limitacion declarada: es una red interna de Docker; en produccion real se usaria una CA propia.
proxy_ssl_server_name on;
proxy_ssl_name localhost;
proxy_ssl_verify off;
proxy_ssl_protocols TLSv1.2 TLSv1.3;

proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
# Las credenciales de cocina las valida Nginx; no se reenvian a los nodos.
proxy_set_header Authorization "";

# Failover: si un nodo falla, se reintenta en el otro. "non_idempotent" permite reintentar tambien POST y PATCH.
# Cuando se detiene un contenedor de la app, Apache ya no resuelve su nombre en Docker y contesta 500
# ("DNS lookup failure"), no 502/503; por eso http_500 tambien dispara el reintento y cuenta como fallo del nodo.
# Los errores 500 de Express no guardan pedidos a medias (el INSERT es una sola sentencia), asi que reintentar es seguro.
# Los timeouts cortos evitan que una peticion se quede esperando a un nodo caido.
proxy_connect_timeout 3s;
proxy_read_timeout 6s;
proxy_next_upstream error timeout http_500 http_502 http_503 non_idempotent;
proxy_next_upstream_tries 2;
proxy_next_upstream_timeout 15s;
