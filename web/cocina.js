// Vista de cocina: GET /cocina (pendientes, en orden de llegada). Se refresca sola cada 5 s.

const INTERVALO_MS = 5000;
let nombres = new Map(); // platoId -> nombre
const $ = (id) => document.getElementById(id);

async function cargarNombres() {
  try {
    const { platos } = await api('/menu');
    nombres = new Map(platos.map((p) => [p.id, p.nombre]));
  } catch (e) { /* si falla, se muestra "Plato N" */ }
}

async function actualizar() {
  try {
    const { pendientes } = await api('/cocina');
    $('error').hidden = true;
    pintar(pendientes || []);
    $('estado').textContent = `${pendientes.length} pendiente(s) · actualizado ${new Date().toLocaleTimeString('es-SV')} · se refresca cada 5 s`;
  } catch (e) {
    $('error').textContent = e.message + ' Se reintentará automáticamente.';
    $('error').hidden = false;
  }
}

function pintar(pedidos) {
  const cont = $('cocina');
  cont.textContent = '';
  if (pedidos.length === 0) {
    cont.append(el('div', 'empty-state', 'No hay pedidos pendientes. ¡Todo al día!'));
    return;
  }
  for (const p of pedidos) {
    const t = el('article', 'ticket');
    const cab = el('div', 'head');
    cab.append(el('span', 'num', `#${p.numero}`), el('span', 'time', hora(p.creado)));
    t.append(cab, el('div', 'who', p.cliente));
    const ul = el('ul');
    for (const it of p.items) {
      ul.append(el('li', '', `${it.cantidad} × ${nombres.get(it.platoId) || 'Plato ' + it.platoId}`));
    }
    const [min, max] = limites(p, 'total');
    t.append(ul, el('div', 't', rango(min, max)));
    cont.append(t);
  }
}

$('actualizar').onclick = actualizar;
cargarNombres().then(actualizar);
setInterval(() => { if (!document.hidden) actualizar(); }, INTERVALO_MS);
