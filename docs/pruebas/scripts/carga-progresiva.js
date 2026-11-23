
import http from 'k6/http';
import { check, sleep } from 'k6';

// Solo /api/health (la ruta más liviana). Variables opcionales: BASE_URL y PICO (por defecto 400).
const BASE = __ENV.BASE_URL || 'https://host.docker.internal:8443';
const PICO = Number(__ENV.PICO || 400);
const paso = (fraccion) => Math.max(1, Math.round(PICO * fraccion));

export const options = {
  insecureSkipTLSVerify: true, // certificado de desarrollo (mkcert/autofirmado)
  stages: [
    { duration: '30s', target: paso(0.125) },
    { duration: '30s', target: paso(0.25) },
    { duration: '30s', target: paso(0.5) },
    { duration: '30s', target: paso(0.75) },
    { duration: '30s', target: PICO },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const response = http.get(
    `${BASE}/api/health`
  );

  check(response, {
    'estado HTTP 200': (r) => r.status === 200,
    'servidor disponible': (r) => r.json('status') === 'ok',
    'nodo identificado': (r) =>
      ['nodo-1', 'nodo-2'].includes(r.json('node')),
  });

  sleep(1);
}
