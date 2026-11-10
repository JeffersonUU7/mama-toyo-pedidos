import express from 'express';
import cors from 'cors';
import { platosDelDia } from './data';
import { crearPedido, buscarPedido, pedidosPendientes } from './pedidos';

export const NODE_ID = process.env.NODE_ID ?? 'local';

export const app = express();

if (process.env.NODE_ENV !== 'production') {
  app.use(cors());
}

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', node: NODE_ID });
});

// Menú del día
app.get('/menu', (_req, res) => {
  res.json({
    node: NODE_ID,
    fecha: new Date().toISOString().slice(0, 10),
    platos: platosDelDia,
  });
});

// Crear pedido
app.post('/pedidos', (req, res) => {
  const { cliente, items } = req.body ?? {};

  if (typeof cliente !== 'string' || !cliente.trim()) {
    return res.status(400).json({ error: 'El nombre del cliente es obligatorio' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El pedido debe incluir al menos un plato' });
  }

  const itemsValidos = items.every(
    (item) =>
      item !== null &&
      typeof item === 'object' &&
      Number.isInteger(item.platoId) &&
      Number.isInteger(item.cantidad) &&
      item.cantidad > 0
  );

  if (!itemsValidos) {
    return res.status(400).json({
      error: 'Cada producto debe tener un platoId válido y una cantidad entera mayor que cero',
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
app.get('/pedidos/:numero', (req, res) => {
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
app.get('/cocina', (_req, res) => {
  res.json({ node: NODE_ID, pendientes: pedidosPendientes() });
});