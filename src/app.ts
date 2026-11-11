import express from 'express';
import cors from 'cors';
import { platosDelDia } from './data';
import { crearPedido, buscarPedido, pedidosPendientes } from './pedidos';

export const NODE_ID = process.env.NODE_ID ?? 'local';

// Límites de validación (iguales a los de la interfaz web).
const MAX_CANTIDAD_POR_PLATO = 20;
const MAX_LINEAS_POR_PEDIDO = 20;
const MAX_LARGO_CLIENTE = 60;

export const app = express();

if (process.env.NODE_ENV !== 'production') {
  app.use(cors());
}

app.use(express.json());

// Todas las rutas viven en un router. La ruta oficial es /api/... (la que reenvía Apache).
// Se monta también sin prefijo para el balanceador Nginx, el health check de Docker y las pruebas de carga.
const api = express.Router();

// Health check
api.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', node: NODE_ID });
});

// Menú del día
api.get('/menu', (_req, res) => {
  res.json({
    node: NODE_ID,
    fecha: new Date().toISOString().slice(0, 10),
    platos: platosDelDia,
  });
});

// Crear pedido
api.post('/pedidos', (req, res) => {
  const { cliente, items } = req.body ?? {};

  if (typeof cliente !== 'string' || !cliente.trim()) {
    return res.status(400).json({ error: 'El nombre del cliente es obligatorio' });
  }

  if (cliente.trim().length > MAX_LARGO_CLIENTE) {
    return res.status(400).json({ error: `El nombre no puede tener más de ${MAX_LARGO_CLIENTE} caracteres` });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El pedido debe incluir al menos un plato' });
  }

  if (items.length > MAX_LINEAS_POR_PEDIDO) {
    return res.status(400).json({ error: `El pedido no puede tener más de ${MAX_LINEAS_POR_PEDIDO} líneas` });
  }

  const itemsValidos = items.every(
    (item) =>
      item !== null &&
      typeof item === 'object' &&
      Number.isInteger(item.platoId) &&
      Number.isInteger(item.cantidad) &&
      item.cantidad > 0 &&
      item.cantidad <= MAX_CANTIDAD_POR_PLATO
  );

  if (!itemsValidos) {
    return res.status(400).json({
      error: `Cada producto debe tener un platoId válido y una cantidad entera entre 1 y ${MAX_CANTIDAD_POR_PLATO}`,
    });
  }

  try {
    const pedido = crearPedido(cliente.trim(), items);
    return res.status(201).json({ node: NODE_ID, pedido });
  } catch (e) {
    return res.status(400).json({
      error: (e as Error).message,
    });
  }
});

// Consultar un pedido
api.get('/pedidos/:numero', (req, res) => {
  const numero = Number(req.params.numero);

  if (!Number.isInteger(numero) || numero <= 0) {
    return res.status(400).json({ error: 'Número de pedido inválido' });
  }

  const pedido = buscarPedido(numero);

  if (!pedido) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }

  return res.json({ node: NODE_ID, pedido });
});

// Vista de cocina
api.get('/cocina', (_req, res) => {
  res.json({ node: NODE_ID, pendientes: pedidosPendientes() });
});

app.use('/api', api);
app.use('/', api);
