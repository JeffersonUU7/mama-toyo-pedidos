// Convierte uno o varios resúmenes de k6 (--summary-export) en una tabla Markdown para pegar en la documentación.
// Uso:  node docs/pruebas/resumir.js docs/pruebas/resultados/carga-flujo-completo-2nodos-400vus.json [otro.json ...]
const fs = require('fs');

const archivos = process.argv.slice(2);
if (archivos.length === 0) {
  console.error('Uso: node docs/pruebas/resumir.js <resumen-k6.json> [...]');
  process.exit(1);
}

const ms = (v) => (typeof v === 'number' ? v.toFixed(1) + ' ms' : 'n/d');
const filas = archivos.map((archivo) => {
  let m;
  try {
    m = JSON.parse(fs.readFileSync(archivo, 'utf8')).metrics;
  } catch (e) {
    m = null;
  }
  if (!m) {
    // Los archivos antiguos (p. ej. pedidos-5vus.json) son salida cruda de k6 (--out json), no un resumen.
    return [archivo.split('/').pop().replace('.json', ''), 'no es un resumen de k6 (usar --summary-export)', '', '', '', '', '', '', ''];
  }
  const dur = m.http_req_duration || {};
  const fallo = m.http_req_failed || {};
  const chk = m.checks || {};
  const pct = (x) => (typeof x === 'number' ? (x * 100).toFixed(2) + ' %' : 'n/d');
  // En --summary-export, cada umbral vale `true` si SE VIOLÓ y `false` si se cumplió.
  const umbrales = Object.values(m)
    .flatMap((x) => Object.values(x.thresholds || {}))
    .every((violado) => violado === false);
  return [
    archivo.split('/').pop().replace('.json', ''),
    m.vus_max ? m.vus_max.max ?? m.vus_max.value : 'n/d',
    m.http_reqs ? m.http_reqs.count : 'n/d',
    ms(dur.avg),
    ms(dur['p(95)']),
    ms(dur.max),
    pct(fallo.value ?? fallo.rate),
    pct((chk.value ?? chk.rate)),
    umbrales ? 'cumplidos' : 'NO cumplidos',
  ];
});

const cab = ['Prueba', 'VU máx.', 'Solicitudes', 'Promedio', 'p95', 'Máximo', 'Fallidas', 'Checks OK', 'Umbrales'];
console.log('| ' + cab.join(' | ') + ' |');
console.log('|' + cab.map(() => '---').join('|') + '|');
for (const f of filas) console.log('| ' + f.join(' | ') + ' |');
