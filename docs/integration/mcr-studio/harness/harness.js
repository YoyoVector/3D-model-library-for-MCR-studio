// MCR-like host page: three r128 global, library IIFE global, MCR project data in plan coordinates.
const project = window.PROJECT;
const L = McrParametric3D, profile = L.TraySystemProfiles.get('LADDER_PROFILE_STANDARD');
const net = L.trayNetworkFromPlan(project.routeNodes, project.traySegments.map(t => ({ id: t.id, from: t.from, to: t.to, width: t.width_mm, height: t.height_mm })), L.PlanFrames.PAGE_Y_DOWN_METRES);
const q = new URLSearchParams(location.search);
const opts = { bendWidth: q.get('bend') === 'narrow' ? 'NARROWEST_LEG' : 'WIDEST_LEG', nodeOverrides: q.get('ovr') ? JSON.parse(q.get('ovr')) : {} };
const norm = L.normalizeTrayNetwork(net, profile, opts);
const lay = L.resolveTrayNetwork(norm.network, profile, opts);
const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.9;
renderer.setSize(innerWidth, innerHeight); document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#08111d');
scene.add(new THREE.HemisphereLight(0xc9e9ff, 0x304359, 1.0));
const sun = new THREE.DirectionalLight(0xffefd6, 1.35); sun.position.set(40, 80, 30); scene.add(sun);
const fill = new THREE.DirectionalLight(0x65c9ff, 0.7); fill.position.set(-50, 30, -20); scene.add(fill);
const mat = (c) => new THREE.MeshStandardMaterial({ color: new THREE.Color(c).convertSRGBToLinear(), metalness: 0.25, roughness: 0.48 });
const host = { straight: mat('#8aa4b5'), fitting: mat('#e0a458'), reducer: mat('#6fd3a6') };
for (const f of lay.fittings) scene.add(f.instance.getThreeMesh({ materials: { body: f.role === 'REDUCER' ? host.reducer : host.fitting } }));
for (const s of lay.straights) scene.add(s.instance.getThreeMesh({ materials: { body: host.straight } }));
// Cables along the physical centerline through the fittings (library pathPoints, mm → m).
const cableMat = new THREE.MeshBasicMaterial({ color: 0x37d8ff });
for (const c of project.cables || []) {
  const pts = lay.pathPoints(L.updateRouteForChanges(c.routeSegmentIds, norm)).map(p => new THREE.Vector3(p[0] / 1000, p[1] / 1000 - 0.04, p[2] / 1000));
  if (pts.length < 2) continue;
  const path = new THREE.CurvePath(); for (let i = 1; i < pts.length; i++) path.add(new THREE.LineCurve3(pts[i - 1], pts[i]));
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(path, Math.min(4000, pts.length * 4), 0.018, 6, false), cableMat));
}
// MCR node positions exactly where MCR puts them: vector(p) = (x, z, y) metres.
const dot = new THREE.MeshBasicMaterial({ color: 0xff4d6d });
for (const n of norm.network.nodes) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), dot); const p = L.PlanFrames.PAGE_Y_DOWN_METRES.toPlan(n.position); m.position.set(p.x, p.z, p.y); scene.add(m); }
const box = new THREE.Box3().setFromObject(scene);
let target = box.getCenter(new THREE.Vector3()), dist = box.getSize(new THREE.Vector3()).length() * 0.75;
const focus = q.get('focus');
if (focus) { const n = norm.network.nodes.find(n => n.id === focus); target = new THREE.Vector3(n.position[0] / 1000, n.position[1] / 1000, n.position[2] / 1000); dist = Number(q.get('dist') || 9); }
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.01, 10000);
const dir = new THREE.Vector3(...(q.get('dir') || '0.55,0.6,0.75').split(',').map(Number)).normalize();
camera.position.copy(target).addScaledVector(dir, dist);
const controls = new THREE.OrbitControls(camera, renderer.domElement); controls.target.copy(target); controls.update();
renderer.render(scene, camera);
const cnt = {}; lay.fittings.forEach(f => { cnt[f.definitionId] = (cnt[f.definitionId] || 0) + 1; });
const lines = ['three r' + THREE.REVISION + ' | ' + (lay.ok ? 'resolve OK' : 'ERRORS: ' + lay.issues.filter(i => i.severity === 'ERROR').map(i => i.message).join(' / '))];
norm.issues.forEach(i => lines.push(i.message));
lines.push(Object.entries(cnt).map(([k, v]) => k.replace('FITTING_', '') + ' x' + v).join('  '));
lines.push('options: ' + JSON.stringify(opts)); if (focus) lines.push('focus: ' + focus + '   orange = fitting, green = reducer, grey = straight, red dot = MCR node');
document.getElementById('info').textContent = lines.join('\n');
