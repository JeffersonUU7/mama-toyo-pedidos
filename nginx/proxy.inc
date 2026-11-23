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

# Failover: si un nodo falla, se reintenta en el otro. "non_idempotent" permite reintentar tambien
# POST y PATCH. Es seguro con 502/503 (Apache no pudo hablar con Express: nada se proceso).
# Se quito http_500 a proposito: un 500 de Express podria significar que el pedido YA se guardo,
# y reintentarlo duplicaria el pedido.
proxy_next_upstream error timeout http_502 http_503 non_idempotent;
proxy_next_upstream_tries 2;
proxy_next_upstream_timeout 15s;
