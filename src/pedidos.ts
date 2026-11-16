
import { Pool } from 'pg';
import { platosDelDia } from './data';

export interface ItemPedido {
  platoId: number;
  cantidad: number;
}

export interface Pedido {
  numero: number;
  cliente: string;
  items: ItemPedido[];
  totalMin: number;
  totalMax: number;
  estado: 'pendiente' | 'listo';
  creado: string;
}

// Tipo de una fila obtenida desde PostgreSQL.
interface PedidoDB {
  numero: number;
  cliente: string;
  items: ItemPedido[];
  total_min: string | number;
  total_max: string | number;
  estado: 'pendiente' | 'listo';
  creado: Date | string;
}

// Si existe DATABASE_URL, utilizamos PostgreSQL.
// Si no existe, seguimos utilizando memoria.
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

// Almacenamiento alternativo en memoria.
const pedidos: Pedido[] = [];
let contador = 1;

// Crear automáticamente la tabla al iniciar.
export async function inicializarPedidos(): Promise<void> {
  if (!pool) {
    console.log('Pedidos funcionando con almacenamiento en memoria');
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pedidos (
      numero SERIAL PRIMARY KEY,
      cliente TEXT NOT NULL,
      items JSONB NOT NULL,
      total_min NUMERIC(10,2) NOT NULL,
      total_max NUMERIC(10,2) NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      creado TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  console.log('Tabla pedidos preparada en PostgreSQL');
}

// Convertir una fila de PostgreSQL al formato de la API.
function convertirPedido(row: PedidoDB): Pedido {
  return {
    numero: Number(row.numero),
    cliente: row.cliente,
    items: row.items,
    totalMin: Number(row.total_min),
    totalMax: Number(row.total_max),
    estado: row.estado,
    creado: new Date(row.creado).toISOString(),
  };
}

// Calcular el total mínimo y máximo.
function calcularTotales(items: ItemPedido[]) {
  let totalMin = 0;
  let totalMax = 0;

  for (const item of items) {
    const plato = platosDelDia.find((p) => p.id === item.platoId);

    if (!plato) {
      throw new Error(`Plato ${item.platoId} no existe`);
    }

    totalMin += plato.precioMin * item.cantidad;
    totalMax += plato.precioMax * item.cantidad;
  }

  return {
    totalMin: Math.round(totalMin * 100) / 100,
    totalMax: Math.round(totalMax * 100) / 100,
  };
}

// Crear pedido.
export async function crearPedido(
  cliente: string,
  items: ItemPedido[]
): Promise<Pedido> {
  const { totalMin, totalMax } = calcularTotales(items);

  if (pool) {
    const resultado = await pool.query<PedidoDB>(
      `INSERT INTO pedidos
        (cliente, items, total_min, total_max)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [cliente, JSON.stringify(items), totalMin, totalMax]
    );

    return convertirPedido(resultado.rows[0]);
  }

  const pedido: Pedido = {
    numero: contador++,
    cliente,
    items,
    totalMin,
    totalMax,
    estado: 'pendiente',
    creado: new Date().toISOString(),
  };

  pedidos.push(pedido);
  return pedido;
}

// Buscar pedido por número.
export async function buscarPedido(
  numero: number
): Promise<Pedido | undefined> {
  if (pool) {
    const resultado = await pool.query<PedidoDB>(
      'SELECT * FROM pedidos WHERE numero = $1',
      [numero]
    );

    return resultado.rows[0]
      ? convertirPedido(resultado.rows[0])
      : undefined;
  }

  return pedidos.find((p) => p.numero === numero);
}

// Obtener pedidos pendientes.
export async function pedidosPendientes(): Promise<Pedido[]> {
  if (pool) {
    const resultado = await pool.query<PedidoDB>(
      `SELECT * FROM pedidos
       WHERE estado = 'pendiente'
       ORDER BY numero ASC`
    );

    return resultado.rows.map(convertirPedido);
  }

  return pedidos.filter((p) => p.estado === 'pendiente');
}

// Marcar pedido como listo.
export async function marcarPedidoListo(
  numero: number
): Promise<Pedido | undefined> {
  if (pool) {
    const resultado = await pool.query<PedidoDB>(
      `UPDATE pedidos
       SET estado = 'listo'
       WHERE numero = $1
       RETURNING *`,
      [numero]
    );

    return resultado.rows[0]
      ? convertirPedido(resultado.rows[0])
      : undefined;
  }

  const pedido = pedidos.find((p) => p.numero === numero);

  if (!pedido) {
    return undefined;
  }

  pedido.estado = 'listo';
  return pedido;
}
