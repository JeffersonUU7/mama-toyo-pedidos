// Menú real del Comedor Mamá Toyo

export interface Plato {
  id: number;
  nombre: string;
  precioMin: number;
  precioMax: number;
}

export const platosDelDia: Plato[] = [
  { id: 1, nombre: 'Pollo frito (porción)', precioMin: 3.50, precioMax: 4.50 },
  { id: 2, nombre: 'Pollo asado (porción)', precioMin: 3.50, precioMax: 4.50 },
  { id: 3, nombre: 'Chow mein con pollo', precioMin: 3.00, precioMax: 4.00 },
  { id: 4, nombre: 'Pastelitos o empanadas (orden)', precioMin: 2.00, precioMax: 3.00 },
  { id: 5, nombre: 'Carne de res guisada', precioMin: 4.00, precioMax: 5.00 },
  { id: 6, nombre: 'Carne en salsa con verduras', precioMin: 4.00, precioMax: 5.00 },
  { id: 7, nombre: 'Arroz (acompañamiento)', precioMin: 0.75, precioMax: 1.25 },
  { id: 8, nombre: 'Ensalada de coditos', precioMin: 0.75, precioMax: 1.50 },
  { id: 9, nombre: 'Ensalada fresca', precioMin: 0.50, precioMax: 1.00 },
  { id: 10, nombre: 'Sopa de gallina india', precioMin: 5.00, precioMax: 8.00 },
];