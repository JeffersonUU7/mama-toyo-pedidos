
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

const URL = 'http://host.docker.internal:8080/api/menu';

export default function () {
  const response = http.get(URL);

  check(response, {
    'estado HTTP 200': (r) => r.status === 200,

    'respuesta en JSON': (r) =>
      r.headers['Content-Type']?.includes('application/json'),

    'nodo identificado': (r) =>
      ['nodo-1', 'nodo-2'].includes(r.json('node')),

    'menu contiene 10 platos': (r) =>
      Array.isArray(r.json('platos')) &&
      r.json('platos').length === 10,

    'platos tienen identificador y nombre': (r) =>
      r.json('platos').every(
        (plato) =>
          Number.isInteger(plato.id) &&
          typeof plato.nombre === 'string'
      ),
  });

  sleep(1);
}
