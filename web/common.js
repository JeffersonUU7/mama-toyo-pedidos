// Código compartido por index.html y cocina.html (sin librerías externas).

// Dirección de la API. Por defecto /api en el mismo origen: la página y la API salen del mismo
// servidor (Apache reenvía /api al contenedor Express), así no se necesita CORS.
// Para probar la página abierta desde otro puerto (por ejemplo un servidor estático en :5500),
// abre la página con ?api=http://localhost:3000/api   (o http://localhost:8080/api por el balanceador).
const API_BASE = (new URLSearchParams(location.search).get('api') || '/api').replace(/\/$/, '');

async function api(ruta, opciones) {
  let res;
  try {
    res = await fetch(API_BASE + ruta, opciones);
  } catch (e) {
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.');
  }
  let datos = null;
  try { datos = await res.json(); } catch (e) { /* respuesta sin JSON */ }
  if (!res.ok) {
    throw new Error((datos && datos.error) || `El servidor respondió con error ${res.status}.`);
  }
  mostrarNodo(datos && datos.node);
  return datos;
}

const money = (n) => '$' + Number(n).toFixed(2);

// Los precios del menú real son rangos (docs/DECISIONES.md, Decisión 4).
// Esta función acepta {precio} (un solo valor) o {precioMin, precioMax}.
function rango(min, max) {
  return Number(min).toFixed(2) === Number(max).toFixed(2) ? money(min) : `${money(min)} – ${money(max)}`;
}
function limites(obj, sufijo = '') {
  // Devuelve [min, max] de un plato (sufijo '') o de un pedido (total/totalMin/totalMax).
  const base = sufijo === 'total' ? 'total' : 'precio';
  const un = obj[base];
  const min = obj[base + 'Min'] ?? un;
  const max = obj[base + 'Max'] ?? un;
  return [Number(min), Number(max)];
}

function mostrarNodo(node) {
  const el = document.getElementById('nodo');
  if (el && node) el.textContent = node;
}

function el(tag, clase, texto) {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto !== undefined) e.textContent = texto; // textContent: nunca inyecta HTML del servidor
  return e;
}

const hora = (iso) => new Date(iso).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' });
