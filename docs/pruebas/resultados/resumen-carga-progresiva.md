# Resumen: carga progresiva (k6)

Resumen de la salida cruda de k6 (`carga-progresiva.json`, 79 MB, ya no se guarda en el repositorio).
Script: `docs/pruebas/scripts/carga-progresiva.js`. Fecha de la ejecución: 20/11/2026.

| Dato | Valor |
|---|---|
| Etapas | 50 → 100 → 200 → 300 → 0 usuarios virtuales (30 s cada una) |
| Usuarios virtuales máximos | 299 |
| Solicitudes HTTP | 19 518 |
| Solicitudes fallidas | 0 (0 %) |
| Tiempo de respuesta promedio | 4.5 ms |
| p95 | 6.8 ms |
| p99 | 9.8 ms |
| Máximo | 42.2 ms |
| Umbrales (p95 < 500 ms, fallos < 1 %) | Cumplidos |

**Límites de esta prueba (declararlos en la defensa):**
- Solo consulta `/api/health` (la ruta más liviana). No mide escrituras en PostgreSQL.
- Llegó a 300 usuarios, no a 400 como pedía el plan.
- Se hizo por HTTP en `:8080` **antes** de agregar HTTPS en Nginx. Hay que repetirla contra `https://localhost:8443`
  (los scripts ya apuntan ahí) para medir el costo de TLS.
- Límite de escrituras: Nginx acepta hasta 30 solicitudes/s de POST/PATCH por IP (ráfaga de 60). Una prueba de carga con
  muchos usuarios creando pedidos desde una sola máquina recibirá `429`; para esa prueba se sube `rate` en `nginx/nginx.conf`.
