import { platosDelDia } from './data';

export interface ItemPedido {
  platoId: number;
  cantidad: number;
}

export interface Pedido {
  numero: number;
  cliente: string;
  items: ItemPedido[];
  total: number;
  estado: 'pendiente' | 'listo';
  creado: string;
}

// OJO: almacenamiento EN MEMORIA, solo para arrancar.
// En un clúster cada nodo tendría su propia lista. Ver docs/DECISIONES.md.
const pedidos: Pedido[] = [];
let contador = 1;

export function crearPedido(cliente: string, items: ItemPedido[]): Pedido {
  const total = items.reduce((acc, it) => {
    const plato = platosDelDia.find((p) => p.id === it.platoId);
    if (!plato) throw new Error(`Plato ${it.platoId} no existe`);
    return acc + plato.precio * it.cantidad;
  }, 0);

  const pedido: Pedido = {
    numero: contador++,
    cliente,
    items,
    total: Math.round(total * 100) / 100,
    estado: 'pendiente',
    creado: new Date().toISOString(),
  };
  pedidos.push(pedido);
  return pedido;
}

export const buscarPedido = (numero: number) => pedidos.find((p) => p.numero === numero);
export const pedidosPendientes = () => pedidos.filter((p) => p.estado === 'pendiente');
