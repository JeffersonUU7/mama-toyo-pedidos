
import http from 'k6/http';
import { check, sleep } from 'k6';
import encoding from 'k6/encoding';

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
  const pedido = {
    cliente: `Cliente PATCH ${__VU}-${__ITER}`,
    items: [{ platoId: 1, cantidad: 2 }],
  };

  const creado = http.post(
    'https://host.docker.internal:8443/api/pedidos',
    JSON.stringify(pedido),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const numero = creado.json('pedido.numero');

  check(creado, {
    'pedido creado': (r) => r.status === 201,
  });

  if (creado.status === 201 && numero) {
    const actualizado = http.patch(
      `https://host.docker.internal:8443/api/pedidos/${numero}`,
      JSON.stringify({ estado: 'listo' }),
      {
        headers: {
          'Content-Type': 'application/json',
          // PATCH exige la clave de cocina (nginx/htpasswd)
          Authorization: 'Basic ' + encoding.b64encode('cocina:toyo2026'),
        },
      }
    );

    check(actualizado, {
      'pedido actualizado (HTTP 200)': (r) => r.status === 200,
      'estado actualizado a listo': (r) =>
        r.json('pedido.estado') === 'listo',
    });
  }

  sleep(1);
}
