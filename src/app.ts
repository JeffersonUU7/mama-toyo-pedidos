import express from 'express';
import { platosDelDia } from './data';
import { crearPedido, buscarPedido, pedidosPendientes } from './pedidos';

export const NODE_ID = process.env.NODE_ID ?? 'local';

export const app = express();
app.use(express.json());

// Health check (nivel 3: URL). Lo consulta el balanceador.
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', node: NODE_ID });
});

// Menú del día
app.get('/menu', (_req, res) => {
  res.json({ node: NODE_ID, fecha: new Date().toISOString().slice(0, 10), platos: platosDelDia });
});

// Crear pedido
app.post('/pedidos', (req, res) => {
  const { cliente, items } = req.body ?? {};
  if (typeof cliente !== 'string' || !cliente.trim() || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Se requiere "cliente" e "items" (lista con platoId y cantidad)' });
  }
  try {
    const pedido = crearPedido(cliente.trim(), items);
    res.status(201).json({ node: NODE_ID, pedido });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

// Consultar un pedido
app.get('/pedidos/:numero', (req, res) => {
  const pedido = buscarPedido(Number(req.params.numero));
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
  res.json({ node: NODE_ID, pedido });
});

// Vista de cocina: pedidos pendientes en orden de llegada
app.get('/cocina', (_req, res) => {
  res.json({ node: NODE_ID, pendientes: pedidosPendientes() });
});
