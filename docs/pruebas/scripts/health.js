
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const response = http.get('http://host.docker.internal:8080/api/health');

  check(response, {
    'estado HTTP 200': (r) => r.status === 200,
    'servidor disponible': (r) => r.json('status') === 'ok',
    'nodo identificado': (r) =>
      ['nodo-1', 'nodo-2'].includes(r.json('node')),
  });

  sleep(1);
}
