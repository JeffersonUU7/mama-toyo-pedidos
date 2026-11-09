// Página principal: menú (GET /menu), pedido (POST /pedidos) y consulta (GET /pedidos/:numero).

let platos = [];
const cantidades = new Map(); // platoId -> cantidad

const $ = (id) => document.getElementById(id);

function mostrarError(id, texto) {
  const e = $(id);
  e.textContent = texto || '';
  e.hidden = !texto;
}

async function cargarMenu() {
  mostrarError('error-menu');
  try {
    const datos = await api('/menu');
    platos = datos.platos || [];
    pintarMenu();
  } catch (e) {
    $('menu').textContent = '';
    mostrarError('error-menu', e.message);
    const reintentar = el('button', 'btn alt', 'Reintentar');
    reintentar.type = 'button';
    reintentar.style.marginTop = '8px';
    reintentar.onclick = cargarMenu;
    $('error-menu').append(document.createElement('br'), reintentar);
  }
}

function pintarMenu() {
  const cont = $('menu');
  cont.textContent = '';
  if (platos.length === 0) {
    cont.append(el('p', 'sub', 'Hoy no hay platos disponibles.'));
    return;
  }
  for (const p of platos) {
    const [min, max] = limites(p);
    const fila = el('div', 'dish');
    fila.dataset.id = p.id;

    const info = el('div', 'info');
    info.append(el('div', 'name', p.nombre), el('div', 'price', rango(min, max)));

    const qty = el('div', 'qty');
    const menos = el('button', '', '−');
    menos.type = 'button';
    menos.setAttribute('aria-label', `Quitar uno de ${p.nombre}`);
    const valor = el('output', '', '0');
    valor.setAttribute('aria-live', 'polite');
    const mas = el('button', '', '+');
    mas.type = 'button';
    mas.setAttribute('aria-label', `Agregar uno de ${p.nombre}`);
    menos.onclick = () => cambiar(p.id, -1);
    mas.onclick = () => cambiar(p.id, +1);
    qty.append(menos, valor, mas);

    fila.append(info, qty);
    cont.append(fila);
  }
  actualizarResumen();
}

function cambiar(id, delta) {
  const nueva = Math.max(0, Math.min(20, (cantidades.get(id) || 0) + delta));
  if (nueva === 0) cantidades.delete(id); else cantidades.set(id, nueva);
  actualizarResumen();
}

function actualizarResumen() {
  // Filas del menú
  for (const fila of $('menu').querySelectorAll('.dish')) {
    const c = cantidades.get(Number(fila.dataset.id)) || 0;
    fila.classList.toggle('sel', c > 0);
    fila.querySelector('output').textContent = c;
    fila.querySelector('.qty button').disabled = c === 0;
  }
  // Resumen del pedido
  const lista = $('lineas');
  lista.textContent = '';
  let tMin = 0, tMax = 0;
  for (const [id, c] of cantidades) {
    const p = platos.find((x) => x.id === id);
    if (!p) continue;
    const [min, max] = limites(p);
    tMin += min * c; tMax += max * c;
    const li = el('li');
    li.append(el('span', '', `${c} × ${p.nombre}`), el('span', '', rango(min * c, max * c)));
    lista.append(li);
  }
  if (cantidades.size === 0) lista.append(el('li', 'empty', 'Aún no has elegido nada.'));
  $('total').textContent = rango(tMin, tMax);
  $('nota-total').hidden = rango(tMin, tMax).includes('–') === false;
  validar();
}

function validar() {
  $('enviar').disabled = cantidades.size === 0 || !$('cliente').value.trim();
}
$('cliente').addEventListener('input', validar);

$('form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  mostrarError('error-pedido');
  $('confirmacion').hidden = true;
  const cliente = $('cliente').value.trim();
  const items = [...cantidades].map(([platoId, cantidad]) => ({ platoId, cantidad }));
  if (!cliente || items.length === 0) return;

  const boton = $('enviar');
  boton.disabled = true;
  boton.textContent = 'Enviando…';
  try {
    const { pedido } = await api('/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente, items }),
    });
    const [min, max] = limites(pedido, 'total');
    const c = $('confirmacion');
    c.textContent = '';
    c.append(
      el('span', '', '¡Pedido recibido! Tu número es:'),
      el('span', 'big', `#${pedido.numero}`),
      el('span', '', `Total: ${rango(min, max)}. Pasa a recogerlo al comedor y dinos tu número.`),
    );
    c.hidden = false;
    $('numero').value = pedido.numero;
    cantidades.clear();
    $('cliente').value = '';
    actualizarResumen();
  } catch (e) {
    mostrarError('error-pedido', e.message);
  } finally {
    boton.textContent = 'Enviar pedido';
    validar();
  }
});

// Consulta de pedido
$('form-consulta').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const out = $('resultado');
  out.textContent = '';
  const n = Number($('numero').value);
  if (!Number.isInteger(n) || n < 1) {
    out.append(el('div', 'msg err', 'Escribe un número de pedido válido.'));
    return;
  }
  try {
    const { pedido } = await api('/pedidos/' + n);
    const [min, max] = limites(pedido, 'total');
    const caja = el('div', 'found');
    const titulo = el('div');
    titulo.append(el('b', '', `Pedido #${pedido.numero} · ${pedido.cliente} `), el('span', `badge ${pedido.estado}`, pedido.estado));
    caja.append(titulo);
    const ul = el('ul');
    for (const it of pedido.items) {
      const p = platos.find((x) => x.id === it.platoId);
      ul.append(el('li', '', `${it.cantidad} × ${p ? p.nombre : 'Plato ' + it.platoId}`));
    }
    caja.append(ul, el('div', '', `Total: ${rango(min, max)}`));
    out.append(caja);
  } catch (e) {
    out.append(el('div', 'msg err', e.message));
  }
});

cargarMenu();
