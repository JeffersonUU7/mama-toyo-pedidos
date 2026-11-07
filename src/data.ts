// DATOS DE EJEMPLO para la demostración. No son el menú ni los precios reales del comedor.
export interface Plato {
  id: number;
  nombre: string;
  precio: number;
}

export const platosDelDia: Plato[] = [
  { id: 1, nombre: 'Pollo guisado con arroz', precio: 4.0 },
  { id: 2, nombre: 'Carne asada con ensalada', precio: 4.5 },
  { id: 3, nombre: 'Pescado frito con tajadas', precio: 4.5 },
  { id: 4, nombre: 'Frijoles con huevo y crema', precio: 3.0 },
  { id: 5, nombre: 'Refresco natural', precio: 1.0 },
];
