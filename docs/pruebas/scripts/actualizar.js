
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
    cliente: `Cliente PATCH ${__VU}-${__ITER}`,
    items: [{ platoId: 1, cantidad: 2 }],
  };

  const creado = http.post(
    'http://host.docker.internal:8080/api/pedidos',
    JSON.stringify(pedido),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const numero = creado.json('pedido.numero');

  check(creado, {
    'pedido creado': (r) => r.status === 201,
  });

  if (creado.status === 201 && numero) {
    const actualizado = http.patch(
      `http://host.docker.internal:8080/api/pedidos/${numero}`,
      JSON.stringify({ estado: 'listo' }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(actualizado, {
      'pedido actualizado (HTTP 200)': (r) => r.status === 200,
      'estado actualizado a listo': (r) =>
        r.json('pedido.estado') === 'listo',
    });
  }

  sleep(1);
}
