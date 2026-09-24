const vm = require('vm'), fs = require('fs'), path = require('path');
const [,, mcrDir, libFile] = process.argv;
const ctx = { console }; ctx.globalThis = ctx; ctx.self = ctx; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(mcrDir, 'vendor/three.min.js'), 'utf8'), ctx);   // MCR's own r128
vm.runInContext(fs.readFileSync(libFile, 'utf8'), ctx);
const L = ctx.McrParametric3D, profile = L.TraySystemProfiles.get('LADDER_PROFILE_STANDARD');
for (const f of ['Demo02-KeyPlotPlan', 'Demo03-ProcessScene', 'North-Process-Demo', 'Legacy-1.0-North-Process']) {
  let p = JSON.parse(fs.readFileSync(path.join(mcrDir, 'samples', f + '.crproj'), 'utf8')); if (p.project) p = p.project;
  const net = L.trayNetworkFromPlan(p.routeNodes.map(n => ({ id: n.id, x: n.x, y: n.y, z: n.z })),
    p.traySegments.map(t => ({ id: t.id, from: t.from, to: t.to, width: t.width_mm, height: t.height_mm })), L.PlanFrames.PAGE_Y_DOWN_METRES);
  const norm = L.normalizeTrayNetwork(net, profile);
  const lay = L.resolveTrayNetwork(norm.network, profile);
  const count = (arr) => arr.reduce((m, x) => (m[x] = (m[x] || 0) + 1, m), {});
  console.log(`\n=== ${f}: ${p.traySegments.length} segments, ${p.cables.length} cables`);
  console.log('  normalize:', JSON.stringify(count(norm.issues.map(i => i.severity + ' ' + i.code))));
  console.log('  resolve  :', lay.ok ? 'OK' : 'ERRORS', JSON.stringify(count(lay.issues.map(i => i.severity + ' ' + i.code))));
  lay.issues.filter(i => i.severity === 'ERROR').slice(0, 5).forEach(i => console.log('    -', i.message));
  console.log('  fittings :', JSON.stringify(count(lay.fittings.map(x => x.definitionId.replace('FITTING_', '') + (x.role === 'REDUCER' ? '' : ' W' + x.instance.effectiveParameters.width)))));
  // Cable centerline vs drawing polyline (MCR today reports the polyline)
  let n = 0, sumOld = 0, sumNew = 0, bad = 0;
  for (const c of p.cables) { if (!c.routeSegmentIds?.length) continue; const r = lay.pathCenterline(L.updateRouteForChanges(c.routeSegmentIds, norm)); if (!r.ok) { bad++; continue; } n++; sumOld += r.polylineMm; sumNew += r.lengthMm; }
  console.log(`  cables   : ${n} measured (${bad} not measurable), drawing ${(sumOld / 1000).toFixed(1)} m → centerline ${(sumNew / 1000).toFixed(1)} m (${((sumNew / sumOld - 1) * 100).toFixed(2)}%)`);
  const bom = lay.bom();
  console.log('  straights:', bom.straights.map(s => `W${s.width} ${(s.totalLengthMm / 1000).toFixed(1)} m = ${s.pieces} pcs`).join('; '));
}
