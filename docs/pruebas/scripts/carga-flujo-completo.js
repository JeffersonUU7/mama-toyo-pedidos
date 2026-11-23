// Carga progresiva con el FLUJO REAL de un cliente + cocina, que sí usa PostgreSQL:
//   ver menú -> crear pedido (POST) -> consultarlo (GET) -> a veces la cocina lo marca listo (PATCH).
// Sube hasta PICO usuarios virtuales (por defecto 400), se sostiene y baja.
//
// Variables (opcionales):  BASE_URL (por defecto https://host.docker.internal:8443)  y  PICO (por defecto 400).
// IMPORTANTE: para que Nginx no limite las escrituras (30/s por IP) hay que levantar el clúster con
// docker-compose.carga.yml (ver docs/PRUEBAS_DE_CARGA.md, sección 13).
import http from 'k6/http';
import { check, sleep } from 'k6';
import encoding from 'k6/encoding';

const BASE = __ENV.BASE_URL || 'https://host.docker.internal:8443';
const PICO = Number(__ENV.PICO || 400);
const COCINA = 'Basic ' + encoding.b64encode('cocina:toyo2026'); // clave de desarrollo (nginx/htpasswd)
const JSON_HEADERS = { 'Content-Type': 'application/json' };
const paso = (fraccion) => Math.max(1, Math.round(PICO * fraccion));

export const options = {
  insecureSkipTLSVerify: true, // certificado de desarrollo
  stages: [
    { duration: '30s', target: paso(0.25) },
    { duration: '30s', target: paso(0.5) },
    { duration: '30s', target: paso(0.75) },
    { duration: '60s', target: PICO }, // sostenido en el pico
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  const menu = http.get(`${BASE}/api/menu`);
  check(menu, { 'menú 200': (r) => r.status === 200 });
  sleep(1);

  const pedido = {
    cliente: `Cliente k6 ${__VU}-${__ITER}`,
    items: [{ platoId: 1 + Math.floor(Math.random() * 10), cantidad: 1 + Math.floor(Math.random() * 3) }],
  };
  const creado = http.post(`${BASE}/api/pedidos`, JSON.stringify(pedido), { headers: JSON_HEADERS });
  const ok = check(creado, {
    'pedido creado (201)': (r) => r.status === 201,
    'pedido con número': (r) => r.json('pedido.numero') > 0,
  });
  if (!ok) { sleep(1); return; }
  const numero = creado.json('pedido.numero');

  const consulta = http.get(`${BASE}/api/pedidos/${numero}`);
  check(consulta, {
    'consulta 200': (r) => r.status === 200,
    'es el mismo pedido': (r) => r.json('pedido.numero') === numero,
  });

  // 1 de cada 5 pedidos lo marca listo la cocina (PATCH exige la clave de cocina)
  if (Math.random() < 0.2) {
    const listo = http.patch(`${BASE}/api/pedidos/${numero}`, JSON.stringify({ estado: 'listo' }), {
      headers: { ...JSON_HEADERS, Authorization: COCINA },
    });
    check(listo, { 'marcado listo (200)': (r) => r.status === 200 });
  }
  sleep(1 + Math.random() * 2);
}
