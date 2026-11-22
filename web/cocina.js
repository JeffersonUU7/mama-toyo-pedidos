// Vista de cocina: GET /cocina (pendientes, en orden de llegada). Se refresca sola cada 5 s.
// Cada pedido tiene un botón "Marcar listo" que llama PATCH /pedidos/:numero con {estado:'listo'}.

const INTERVALO_MS = 5000;
let nombres = new Map(); // platoId -> nombre
const enviando = new Set(); 
let avisoListo = ''; 
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
    const lista = pendientes ?? [];
    $('error').textContent = avisoListo;
    $('error').hidden = !avisoListo;
    pintar(lista);
    $('estado').textContent = `${lista.length} pendiente(s) · actualizado ${new Date().toLocaleTimeString('es-SV')} · se refresca cada 5 s`;
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

    const listo = el('button', 'btn ready', enviando.has(p.numero) ? 'Guardando…' : 'Marcar listo');
    listo.type = 'button';
    listo.disabled = enviando.has(p.numero);
    listo.setAttribute('aria-label', `Marcar listo el pedido ${p.numero} de ${p.cliente}`);
    listo.onclick = () => marcarListo(p.numero, listo);
    t.append(listo);

    cont.append(t);
  }
}

async function marcarListo(numero, boton) {
  if (enviando.has(numero)) return;
  enviando.add(numero);
  boton.disabled = true;
  boton.textContent = 'Guardando…';
  avisoListo = '';
  $('error').hidden = true;
  try {
    await api('/pedidos/' + numero, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'listo' }),
    });
  } catch (e) {
    avisoListo = `No se pudo marcar el pedido #${numero} como listo. ${e.message}`;
  }
  enviando.delete(numero);
  await actualizar(); // el pedido listo desaparece de la lista de pendientes
}

$('actualizar').onclick = actualizar;
cargarNombres().then(actualizar);
setInterval(() => { if (!document.hidden) actualizar(); }, INTERVALO_MS);
