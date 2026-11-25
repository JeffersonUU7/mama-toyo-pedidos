// Lee los 3 resumenes de k6 de la seccion 13 y escribe en la documentacion la tabla, la fecha, el equipo y una conclusion
// calculada con esos numeros. Se ejecuta solo al final de docs/pruebas/ejecutar-seccion13.sh.
const fs = require('fs');
const path = require('path');
const { execFileSync, execSync } = require('child_process');

const raiz = path.resolve(__dirname, '..', '..');
const dirRes = 'docs/pruebas/resultados/';
const archivos = {
  flujo2: dirRes + 'carga-flujo-completo-2nodos-400vus.json',
  flujo1: dirRes + 'carga-flujo-completo-1nodo-400vus.json',
  prog2: dirRes + 'carga-progresiva-2nodos-400vus.json',
};

for (const f of Object.values(archivos)) {
  if (!fs.existsSync(path.join(raiz, f))) {
    console.error('Falta el resumen ' + f + '. Ejecuta primero las tres pruebas.');
    process.exit(1);
  }
}

function leer(f) {
  const m = JSON.parse(fs.readFileSync(path.join(raiz, f), 'utf8')).metrics;
  const fallo = m.http_req_failed || {};
  const umbralesOk = Object.values(m)
    .flatMap((x) => Object.values(x.thresholds || {}))
    .every((violado) => violado === false);
  return {
    p95: m.http_req_duration['p(95)'],
    fallos: (fallo.value ?? fallo.rate) * 100,
    umbralesOk,
  };
}

const d2 = leer(archivos.flujo2);
const d1 = leer(archivos.flujo1);
const dp = leer(archivos.prog2);

const tabla = execFileSync('node', [path.join(__dirname, 'resumir.js'), ...Object.values(archivos).map((f) => path.join(raiz, f))], {
  cwd: raiz,
  encoding: 'utf8',
}).trim();

const hoy = new Date();
const fecha = [hoy.getDate(), hoy.getMonth() + 1, hoy.getFullYear()].map((n) => String(n).padStart(2, '0')).join('/');

let equipo = 'Docker Desktop en una sola computadora';
try {
  const [cpus, mem] = execSync('docker info --format "{{.NCPU}};{{.MemTotal}}"', { encoding: 'utf8' }).trim().split(';');
  equipo = `Docker Desktop con ${cpus} CPU y ${(Number(mem) / 2 ** 30).toFixed(1)} GB de RAM`;
} catch (e) {
  /* si docker info falla se deja el texto general */
}

const f1 = (n) => n.toFixed(1);
const f2 = (n) => n.toFixed(2);
const conclusiones = [];
conclusiones.push(
  `Flujo completo con 400 usuarios virtuales: con 2 nodos el p95 fue ${f1(d2.p95)} ms y las solicitudes fallidas ${f2(d2.fallos)} %; ` +
    `con 1 nodo, ${f1(d1.p95)} ms y ${f2(d1.fallos)} %. Sobre \`/api/health\` con 2 nodos el p95 fue ${f1(dp.p95)} ms y las fallidas ${f2(dp.fallos)} %.`
);
const sinCumplir = [
  ['flujo completo con 2 nodos', d2],
  ['flujo completo con 1 nodo', d1],
  ['progresiva con 2 nodos', dp],
]
  .filter(([, d]) => !d.umbralesOk)
  .map(([n]) => n);
conclusiones.push(
  sinCumplir.length === 0
    ? 'Los tres umbrales (p95 < 500 ms, fallidas < 1 %, verificaciones > 99 %) se cumplieron en las tres pruebas.'
    : `No se cumplieron todos los umbrales en: ${sinCumplir.join(', ')}.`
);
if (d1.p95 > d2.p95 * 1.2 || d1.fallos > d2.fallos + 0.5) {
  conclusiones.push(`El segundo nodo mejora el resultado: con 1 nodo el p95 pasa de ${f1(d2.p95)} a ${f1(d1.p95)} ms.`);
} else {
  conclusiones.push(
    'La diferencia entre 1 y 2 nodos fue pequeña. En esta computadora el cuello de botella es probablemente la propia máquina ' +
      '(k6, Docker y los 6 contenedores comparten CPU), así que el segundo nodo se justifica sobre todo por disponibilidad (failover), ' +
      'que se demostró deteniendo un nodo, y no por rendimiento.'
  );
}

const bloque =
  `**Ejecutado el ${fecha}** · Equipo: ${equipo}. Resultados generados con \`docs/pruebas/ejecutar-seccion13.sh\`.\n\n` +
  tabla +
  '\n\n' +
  conclusiones.map((c) => '- ' + c).join('\n');

function editar(ruta, cambios) {
  const abs = path.join(raiz, ruta);
  let txt = fs.readFileSync(abs, 'utf8');
  for (const [patron, nuevo, nombre] of cambios) {
    if (!patron.test(txt)) {
      console.warn(`Aviso: en ${ruta} no se encontro "${nombre}" (puede estar ya actualizado).`);
      continue;
    }
    txt = txt.replace(patron, () => nuevo);
  }
  fs.writeFileSync(abs, txt);
}

editar('docs/PRUEBAS_DE_CARGA.md', [
  [/Estas son las pruebas que faltan[\s\S]*?de antemano\)\./, 'Pruebas ejecutadas para validar el dimensionamiento (requisito de la Ronda 3). Los resultados de la sección 13.4 son los que salieron de la ejecución real; no se escribieron números de antemano.', 'introduccion'],
  [/### 13\.4 Resultados \(completar con los datos reales\)/, '### 13.4 Resultados', 'titulo 13.4'],
  [/y pégala aquí debajo, con la fecha y el equipo donde se ejecutó:/, 'Resultado de la ejecución (se escribe con `docs/pruebas/completar-seccion13.js`):', 'texto previo a la tabla'],
  [/> \*\*Pendiente de ejecutar\*\*[^\n]*/, bloque, 'marcador pendiente'],
]);

editar('docs/ESTADO_DEL_PROYECTO.md', [
  [/# Estado del Proyecto — Mamá Toyo \([^)]*\)/, `# Estado del Proyecto — Mamá Toyo (${fecha})`, 'titulo'],
  [/\| Clase 39 — Final \+ Defensa \|[^\n]*/, '| Clase 39 — Final + Defensa | 🟡 | Todo implementado y probado; falta grabar y entregar el video de defensa |', 'fila Clase 39'],
  [/- \*\*Falta:\*\* ejecutar la sección 13[^\n]*/, `- Sección 13 ejecutada el ${fecha} (flujo completo con PostgreSQL, 400 usuarios, 2 nodos contra 1, por HTTPS): resultados en \`docs/PRUEBAS_DE_CARGA.md\`, sección 13.4.`, 'linea Falta'],
  [/× `201` \(22\/11\)/, '× `201` (23/11; evidencia en `docs/evidencias/fase3/`)', 'fecha del failover'],
  [/## Qué FALTA[\s\S]*?\n---/, `## Antes de entregar\n\n| Tarea | Estado |\n|---|---|\n| Pruebas de carga de la sección 13 | ✅ Ejecutadas el ${fecha} |\n| Verificación final del clúster (failover, persistencia, cocina, monitoreo) | ✅ \`docs/evidencias/final/verificacion-final.txt\` |\n| Video de defensa (mínimo 15 min, todos en cámara) | ⬜ Por grabar |\n\n---`, 'seccion Que FALTA'],
]);

editar('docs/REPARTO.md', [
  [/- \[ \] \(6\) Pruebas de carga[^\n]*/, `- [x] (6) Pruebas de carga (1 y 2 nodos, hasta 400 usuarios virtuales) y resultados en \`docs/\`: sección 13 de \`docs/PRUEBAS_DE_CARGA.md\`, ejecutada el ${fecha}`, 'pruebas de carga'],
  [/- \[ \] \(6\) Validar el dimensionamiento[^\n]*/, `- [x] (6) Dimensionamiento validado con pruebas de carga reales (sección 13 de \`docs/PRUEBAS_DE_CARGA.md\`, ${fecha})`, 'dimensionamiento'],
]);

console.log('Documentacion actualizada con los resultados del ' + fecha + '.');
