/**
 * Writes the data file a harness page loads, from an MCR-Studio project (.crproj).
 *
 *   node make-data.cjs <path/to/Project.crproj> <out-name>
 *   → <out-name>-data.js next to this script (window.PROJECT = { routeNodes, traySegments, cables })
 *
 * Harness folder layout (copy these next to the pages; nothing needs npm):
 *   three.min.js, OrbitControls.js   ← MCR-Studio vendor/
 *   mcr-parametric-3d.js             ← this library's lib/index.iife.js
 *   <out-name>-data.js               ← this script
 * Then open north.html / demo02.html (or a copy that loads your <out-name>-data.js) in a browser:
 *   ?focus=<nodeId>&dist=<m>&dir=x,y,z&bend=narrow&ovr=<URL-encoded JSON nodeOverrides>
 */
const fs = require('fs');
const path = require('path');

const [src, name] = process.argv.slice(2);
if (!src || !name) {
  console.error('usage: node make-data.cjs <Project.crproj> <out-name>');
  process.exit(1);
}
let p = JSON.parse(fs.readFileSync(src, 'utf8'));
if (p.project) p = p.project;
const data = {
  routeNodes: p.routeNodes.map(({ id, x, y, z }) => ({ id, x, y, z })),
  traySegments: p.traySegments.map(({ id, from, to, width_mm, height_mm }) => ({ id, from, to, width_mm, height_mm })),
  cables: (p.cables || []).map(({ id, routeSegmentIds }) => ({ id, routeSegmentIds })),
};
const out = path.join(__dirname, `${name}-data.js`);
fs.writeFileSync(out, `window.PROJECT = ${JSON.stringify(data)};\n`);
console.log(`wrote ${out}: ${data.routeNodes.length} nodes, ${data.traySegments.length} segments, ${data.cables.length} cables`);
