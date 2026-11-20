
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 200 },
    { duration: '30s', target: 300 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const response = http.get(
    'http://host.docker.internal:8080/api/health'
  );

  check(response, {
    'estado HTTP 200': (r) => r.status === 200,
    'servidor disponible': (r) => r.json('status') === 'ok',
    'nodo identificado': (r) =>
      ['nodo-1', 'nodo-2'].includes(r.json('node')),
  });

  sleep(1);
}
