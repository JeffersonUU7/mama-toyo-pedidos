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

// Almacenamiento EN MEMORIA: cada nodo tiene su propia lista de pedidos.
// Se reemplaza por PostgreSQL (docs/DECISIONES.md, Decisión 1).
const pedidos: Pedido[] = [];
let contador = 1;

export function crearPedido(cliente: string, items: ItemPedido[]): Pedido {
  let totalMin = 0;
  let totalMax = 0;

  for (const it of items) {
    const plato = platosDelDia.find((p) => p.id === it.platoId);

    if (!plato) {
      throw new Error(`Plato ${it.platoId} no existe`);
    }

    totalMin += plato.precioMin * it.cantidad;
    totalMax += plato.precioMax * it.cantidad;
  }

  const pedido: Pedido = {
    numero: contador++,
    cliente,
    items,
    totalMin: Math.round(totalMin * 100) / 100,
    totalMax: Math.round(totalMax * 100) / 100,
    estado: 'pendiente',
    creado: new Date().toISOString(),
  };

  pedidos.push(pedido);
  return pedido;
}

export const buscarPedido = (numero: number) =>
  pedidos.find((p) => p.numero === numero);

export const pedidosPendientes = () =>
  pedidos.filter((p) => p.estado === 'pendiente');