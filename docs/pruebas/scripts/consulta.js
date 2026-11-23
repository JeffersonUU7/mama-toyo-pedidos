import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  insecureSkipTLSVerify: true, // certificado de desarrollo (mkcert/autofirmado)
  vus: 5,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const response = http.get(
    'https://host.docker.internal:8443/api/pedidos/1'
  );

  check(response, {
    'consulta HTTP 200': (r) => r.status === 200,
    'pedido tiene numero': (r) => r.json('pedido.numero') === 1,
    'pedido tiene cliente': (r) =>
      r.json('pedido.cliente') === 'Prueba Randal',
  });

  sleep(1);
}