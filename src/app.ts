import express from 'express';
import cors from 'cors';
import { platosDelDia } from './data';
import {
  crearPedido,
  buscarPedido,
  pedidosPendientes,
  marcarPedidoListo,
  baseDeDatosDisponible,
} from './pedidos';

export const NODE_ID = process.env.NODE_ID ?? 'local';

// Límites de validación.
const MAX_CANTIDAD_POR_PLATO = 20;
const MAX_LINEAS_POR_PEDIDO = 20;
const MAX_LARGO_CLIENTE = 60;

// Solo dígitos: Number() aceptaría "1e3", "0x10" o "Infinity".
function numeroDePedido(valor: string): number | null {
  if (!/^\d+$/.test(valor)) return null;
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero > 0 ? numero : null;
}

export const app = express();

// No revelar el framework en las respuestas.
app.disable('x-powered-by');

// Cada respuesta indica qué nodo la atendió (útil en la demo y para el monitoreo: Nginx lo anota en su log).
app.use((_req, res, next) => {
  res.setHeader('X-Node', NODE_ID);
  next();
});

// CORS cerrado por defecto: en producción la página y la API salen del mismo origen
// (Nginx/Apache), así que no hace falta. Solo para desarrollo: CORS_ORIGIN=http://localhost:5500
// (varios orígenes separados por coma).
const origenesCors = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

if (origenesCors.length > 0) {
  app.use(cors({ origin: origenesCors }));
}

// Un pedido real pesa unos cientos de bytes: 16 kb sobran y limitan el abuso.
app.use(express.json({ limit: '16kb' }));

// Router de la API.
const api = express.Router();

// Health check
api.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', node: NODE_ID });
});

// Menú del día
// Readiness: 200 si el nodo puede hablar con PostgreSQL, 503 si no. Para monitoreo (no lo usa Docker).
api.get('/ready', async (_req, res) => {
  const bd = await baseDeDatosDisponible();
  res.status(bd ? 200 : 503).json({ status: bd ? 'ready' : 'not_ready', baseDeDatos: bd ? 'ok' : 'sin conexion', node: NODE_ID });
});

api.get('/menu', (_req, res) => {
  res.json({
    node: NODE_ID,
    // Fecha local de El Salvador (toISOString usaría UTC y desde las 6 pm mostraría el día siguiente).
    fecha: new Date().toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' }),
    platos: platosDelDia,
  });
});

// Crear pedido
api.post('/pedidos', async (req, res) => {
  if (!req.is('application/json')) {
    return res.status(415).json({
      error: 'El cuerpo debe enviarse con Content-Type: application/json',
    });
  }

  const { cliente, items } = req.body ?? {};

  if (typeof cliente !== 'string' || !cliente.trim()) {
    return res.status(400).json({
      error: 'El nombre del cliente es obligatorio',
    });
  }

  if (cliente.trim().length > MAX_LARGO_CLIENTE) {
    return res.status(400).json({
      error: `El nombre no puede tener más de ${MAX_LARGO_CLIENTE} caracteres`,
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: 'El pedido debe incluir al menos un plato',
    });
  }

  if (items.length > MAX_LINEAS_POR_PEDIDO) {
    return res.status(400).json({
      error: `El pedido no puede tener más de ${MAX_LINEAS_POR_PEDIDO} líneas`,
    });
  }

  const itemsValidos = items.every(
    (item) =>
      item !== null &&
      typeof item === 'object' &&
      Number.isInteger(item.platoId) &&
      item.platoId >= 1 &&
      Number.isInteger(item.cantidad) &&
      item.cantidad >= 1 &&
      item.cantidad <= MAX_CANTIDAD_POR_PLATO
  );

  if (!itemsValidos) {
    return res.status(400).json({
      error: `Cada producto debe tener un platoId válido y una cantidad entera entre 1 y ${MAX_CANTIDAD_POR_PLATO}`,
    });
  }

  try {
    const pedido = await crearPedido(cliente.trim(), items);
    return res.status(201).json({ node: NODE_ID, pedido });
  } catch (error) {
    const mensaje = (error as Error).message;

    if (mensaje.startsWith('Plato ')) {
      return res.status(400).json({ error: mensaje });
    }

    console.error('Error al crear pedido:', error);
    return res.status(500).json({ error: 'Error interno al crear el pedido' });
  }
});

// Consultar un pedido
api.get('/pedidos/:numero', async (req, res) => {
  const numero = numeroDePedido(req.params.numero);

  if (numero === null) {
    return res.status(400).json({
      error: 'Número de pedido inválido',
    });
  }

  try {
    const pedido = await buscarPedido(numero);

    if (!pedido) {
      return res.status(404).json({
        error: 'Pedido no encontrado',
      });
    }

    return res.json({ node: NODE_ID, pedido });
  } catch (error) {
    console.error('Error al consultar pedido:', error);
    return res.status(500).json({
      error: 'Error interno al consultar el pedido',
    });
  }
});

// Marcar un pedido como listo
api.patch('/pedidos/:numero', async (req, res) => {
  const numero = numeroDePedido(req.params.numero);
  const { estado } = req.body ?? {};

  if (numero === null) {
    return res.status(400).json({
      error: 'Número de pedido inválido',
    });
  }

  if (estado !== 'listo') {
    return res.status(400).json({
      error: 'El estado debe ser listo',
    });
  }

  try {
    const pedido = await marcarPedidoListo(numero);

    if (!pedido) {
      return res.status(404).json({
        error: 'Pedido no encontrado',
      });
    }

    return res.status(200).json({ node: NODE_ID, pedido });
  } catch (error) {
    console.error('Error al marcar pedido como listo:', error);
    return res.status(500).json({
      error: 'Error interno al actualizar el pedido',
    });
  }
});

// Vista de cocina: solamente pedidos pendientes.
api.get('/cocina', async (_req, res) => {
  try {
    const pendientes = await pedidosPendientes();
    return res.json({ node: NODE_ID, pendientes });
  } catch (error) {
    console.error('Error al consultar cocina:', error);
    return res.status(500).json({
      error: 'Error interno al consultar los pedidos pendientes',
    });
  }
});

// Rutas oficiales y compatibilidad con Nginx.
app.use('/api', api);
app.use('/', api);

// Rutas desconocidas: 404 en JSON (la API nunca responde HTML).
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Errores siempre en JSON (por ejemplo, un body con JSON malformado).
const manejadorErrores: express.ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  const estado =
    error.status && error.status >= 400 && error.status < 500
      ? error.status
      : 500;

  if (estado === 500) {
    console.error('Error no controlado:', error);
  }

  res.status(estado).json({
    error:
      estado === 500
        ? 'Error interno del servidor'
        : 'La solicitud no es válida',
  });
};

app.use(manejadorErrores);
