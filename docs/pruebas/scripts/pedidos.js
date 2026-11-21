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
  const pedido = {
    cliente: `Cliente k6 ${__VU}-${__ITER}`,
    items: [
      {
        platoId: 1,
        cantidad: 2,
      },
    ],
  };

  const response = http.post(
    'http://host.docker.internal:8080/api/pedidos',
    JSON.stringify(pedido),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  check(response, {
    'pedido creado (HTTP 201)': (r) => r.status === 201,
    'pedido tiene numero': (r) => r.json('pedido.numero') > 0,
    'pedido queda pendiente': (r) =>
      r.json('pedido.estado') === 'pendiente',
  });

  sleep(1);
}
