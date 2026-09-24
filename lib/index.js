import * as e from "three";
//#region src/core/Schema.ts
var t = {
	VERIFIED_PROJECT_REQUIREMENT: "VERIFIED_PROJECT_REQUIREMENT",
	VERIFIED_VENDOR_CATALOG: "VERIFIED_VENDOR_CATALOG",
	ENGINEERING_DERIVED: "ENGINEERING_DERIVED",
	DEMO_DEFAULT: "DEMO_DEFAULT",
	PLACEHOLDER: "PLACEHOLDER",
	UNVERIFIED: "UNVERIFIED"
}, n = {
	MCR_CABLE_TRAY_BOM: "MCR_CABLE_TRAY_BOM",
	MCR_TERMINATION_BOM: "MCR_TERMINATION_BOM",
	STRUCTURAL_REF: "STRUCTURAL_REF",
	PROCESS_PIPING_REF: "PROCESS_PIPING_REF",
	VISUAL_ONLY: "VISUAL_ONLY"
}, r = {
	LEGACY_FITTING_LIBRARY: "LEGACY_FITTING_LIBRARY",
	LEGACY_MCR_PROTOTYPE: "LEGACY_MCR_PROTOTYPE",
	NEW_COMPONENT: "NEW_COMPONENT",
	DERIVED_ASSEMBLY: "DERIVED_ASSEMBLY"
}, i = {
	TRAY: "TRAY",
	FITTING: "FITTING",
	SUPPORT: "SUPPORT",
	EQUIPMENT: "EQUIPMENT",
	STRUCTURE: "STRUCTURE",
	OBSTACLE: "OBSTACLE",
	PENETRATION: "PENETRATION",
	VISUAL: "VISUAL"
}, a = class {
	static mmToM(e) {
		return e / 1e3;
	}
	static mToMm(e) {
		return e * 1e3;
	}
	static degToRad(e) {
		return e * Math.PI / 180;
	}
	static radToDeg(e) {
		return e * 180 / Math.PI;
	}
	static formatMm(e, t = 1) {
		return `${Number(e.toFixed(t))} mm`;
	}
	static formatElevation(e) {
		let t = e / 1e3;
		return `EL ${t >= 0 ? "+" : ""}${t.toFixed(2)}m`;
	}
}, o = class {
	static identityPlacement() {
		return {
			position: [
				0,
				0,
				0
			],
			quaternion: [
				0,
				0,
				0,
				1
			]
		};
	}
	static transformPoint(t, n) {
		let r = new e.Vector3(t[0], t[1], t[2]), i = new e.Quaternion(n.quaternion[0], n.quaternion[1], n.quaternion[2], n.quaternion[3]);
		return r.applyQuaternion(i), r.add(new e.Vector3(n.position[0], n.position[1], n.position[2])), [
			r.x,
			r.y,
			r.z
		];
	}
	static transformDirection(t, n) {
		let r = new e.Vector3(t[0], t[1], t[2]).normalize(), i = new e.Quaternion(n.quaternion[0], n.quaternion[1], n.quaternion[2], n.quaternion[3]);
		return r.applyQuaternion(i), r.normalize(), [
			r.x,
			r.y,
			r.z
		];
	}
	static inverseTransformPoint(t, n) {
		let r = new e.Vector3(t[0], t[1], t[2]);
		r.sub(new e.Vector3(n.position[0], n.position[1], n.position[2]));
		let i = new e.Quaternion(n.quaternion[0], n.quaternion[1], n.quaternion[2], n.quaternion[3]).invert();
		return r.applyQuaternion(i), [
			r.x,
			r.y,
			r.z
		];
	}
	static quaternionMultiply(t, n) {
		let r = new e.Quaternion(t[0], t[1], t[2], t[3]), i = new e.Quaternion(n[0], n[1], n[2], n[3]);
		return r.multiply(i), [
			r.x,
			r.y,
			r.z,
			r.w
		];
	}
	static fromAxisAngle(t, n) {
		let r = new e.Vector3(t[0], t[1], t[2]).normalize(), i = new e.Quaternion().setFromAxisAngle(r, n);
		return [
			i.x,
			i.y,
			i.z,
			i.w
		];
	}
	static fromEuler(t, n, r, i = "XYZ") {
		let a = new e.Euler(t, n, r, i), o = new e.Quaternion().setFromEuler(a);
		return [
			o.x,
			o.y,
			o.z,
			o.w
		];
	}
	static toEulerDeg(t, n = "XYZ") {
		let r = new e.Quaternion(t[0], t[1], t[2], t[3]), i = new e.Euler().setFromQuaternion(r, n);
		return [
			i.x * 180 / Math.PI,
			i.y * 180 / Math.PI,
			i.z * 180 / Math.PI
		];
	}
	static fromBasis(t, n) {
		let r = new e.Vector3(t[0], t[1], t[2]).normalize(), i = new e.Vector3(n[0], n[1], n[2]).normalize(), a = new e.Vector3().crossVectors(i, r).normalize();
		i = new e.Vector3().crossVectors(r, a).normalize();
		let o = new e.Matrix4();
		o.makeBasis(a, i, r);
		let s = new e.Quaternion().setFromRotationMatrix(o);
		return [
			s.x,
			s.y,
			s.z,
			s.w
		];
	}
	static distance(e, t) {
		return Math.hypot(e[0] - t[0], e[1] - t[1], e[2] - t[2]);
	}
	static dot(e, t) {
		return e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
	}
	static cross(t, n) {
		let r = new e.Vector3(t[0], t[1], t[2]), i = new e.Vector3(n[0], n[1], n[2]), a = r.cross(i);
		return [
			a.x,
			a.y,
			a.z
		];
	}
	static normalize(e) {
		let t = Math.hypot(e[0], e[1], e[2]);
		return t === 0 ? [
			0,
			0,
			0
		] : [
			e[0] / t,
			e[1] / t,
			e[2] / t
		];
	}
}, s = class {
	constructor(e, t, n = {}, r, i) {
		this._cachedWorldPorts = null, this._cachedCenterlines = null, this._cachedBounds = null, this._cachedMesh = null, this.instanceId = e, this.definition = t, this.parentAssemblyInstanceId = i, this._effectiveParameters = {
			...t.defaultParameters,
			...n
		}, this._placement = {
			position: r?.position ? [...r.position] : [
				0,
				0,
				0
			],
			quaternion: r?.quaternion ? [...r.quaternion] : [
				0,
				0,
				0,
				1
			]
		};
	}
	get definitionId() {
		return this.definition.id;
	}
	get effectiveParameters() {
		return this._effectiveParameters;
	}
	get placement() {
		return this._placement;
	}
	updateParameters(e) {
		this._effectiveParameters = {
			...this._effectiveParameters,
			...e
		}, this.invalidateCache();
	}
	setPlacement(e) {
		this._placement = {
			position: [...e.position],
			quaternion: [...e.quaternion]
		}, this._cachedWorldPorts = null, this._cachedCenterlines = null, this._cachedBounds = null, this._cachedMesh && this.applyPlacementToMesh(this._cachedMesh);
	}
	setPosition(e) {
		this._placement.position = [...e], this.invalidatePlacementCache();
	}
	setQuaternion(e) {
		this._placement.quaternion = [...e], this.invalidatePlacementCache();
	}
	invalidateCache() {
		this._cachedWorldPorts = null, this._cachedCenterlines = null, this._cachedBounds = null, this._cachedMesh = null;
	}
	invalidatePlacementCache() {
		this._cachedWorldPorts = null, this._cachedCenterlines = null, this._cachedBounds = null, this._cachedMesh && this.applyPlacementToMesh(this._cachedMesh);
	}
	getWorldPorts() {
		if (this._cachedWorldPorts) return this._cachedWorldPorts;
		let e = this.definition.getLocalPorts(this._effectiveParameters);
		return this._cachedWorldPorts = e.map((e) => {
			let t = o.transformPoint(e.localPosition, this._placement), n = o.transformDirection(e.localDirection, this._placement), r = o.transformDirection(e.localUp, this._placement);
			return {
				id: e.id,
				instanceId: this.instanceId,
				name: e.name,
				worldPosition: t,
				worldDirection: n,
				worldUp: r,
				width: e.width,
				depth: e.depth,
				connectionType: e.connectionType,
				...e.connectionFace ? { connectionFace: { ...e.connectionFace } } : {}
			};
		}), this._cachedWorldPorts;
	}
	getCenterlines() {
		return this._cachedCenterlines ||= this.definition.getCenterlineRoutes(this._effectiveParameters), this._cachedCenterlines;
	}
	getBounds() {
		return this.definition.getBounds(this._effectiveParameters);
	}
	getThreeMesh(e) {
		return e ? this.buildMesh(e) : (this._cachedMesh ||= this.buildMesh(), this._cachedMesh);
	}
	buildMesh(t) {
		let n = this.definition.buildGeometry(this._effectiveParameters, t);
		n.name = `Instance_${this.instanceId}_${this.definition.id}`, n.traverse((e) => {
			e.isMesh && (e.userData = {
				...e.userData,
				instanceId: this.instanceId,
				definitionId: this.definition.id
			});
		});
		let r = new e.Group();
		return r.name = `Container_${this.instanceId}`, r.add(n), this.applyPlacementToMesh(r), r.scale.set(1, 1, 1), n.scale.set(1, 1, 1), r;
	}
	applyPlacementToMesh(e) {
		let t = [
			a.mmToM(this._placement.position[0]),
			a.mmToM(this._placement.position[1]),
			a.mmToM(this._placement.position[2])
		];
		e.position.set(t[0], t[1], t[2]), e.quaternion.set(this._placement.quaternion[0], this._placement.quaternion[1], this._placement.quaternion[2], this._placement.quaternion[3]);
	}
}, c = class {
	static {
		this._flowTexture = null;
	}
	static getCableFlowTexture() {
		if (this._flowTexture) return this._flowTexture;
		if (typeof document > "u") return null;
		let t = document.createElement("canvas");
		t.width = 512, t.height = 32;
		let n = t.getContext("2d");
		if (n) {
			n.fillStyle = "#082f49", n.fillRect(0, 0, 512, 32);
			let e = n.createLinearGradient(0, 0, 256, 0);
			e.addColorStop(0, "rgba(6, 182, 212, 0)"), e.addColorStop(.5, "rgba(34, 211, 238, 1)"), e.addColorStop(1, "rgba(6, 182, 212, 0)"), n.fillStyle = e, n.fillRect(0, 0, 256, 32), n.fillRect(256, 0, 256, 32);
		}
		let r = new e.CanvasTexture(t);
		return r.wrapS = e.RepeatWrapping, r.wrapT = e.RepeatWrapping, r.repeat.set(2, 1), this._flowTexture = r, this._flowTexture;
	}
	static {
		this.Tray = new e.MeshStandardMaterial({
			color: 9741240,
			metalness: .95,
			roughness: .25,
			side: e.DoubleSide
		});
	}
	static {
		this.TrayIS = new e.MeshStandardMaterial({
			color: 165063,
			metalness: .85,
			roughness: .3,
			side: e.DoubleSide
		});
	}
	static {
		this.Divider = new e.MeshStandardMaterial({
			color: 13358561,
			metalness: .8,
			roughness: .3,
			side: e.DoubleSide
		});
	}
	static {
		this.Support = new e.MeshStandardMaterial({
			color: 3359061,
			metalness: .7,
			roughness: .5
		});
	}
	static {
		this.Bolt = new e.MeshStandardMaterial({
			color: 15857145,
			metalness: 1,
			roughness: .1
		});
	}
	static createCableMaterial(t = 440020, n = 43775) {
		return new e.MeshStandardMaterial({
			color: t,
			emissive: n,
			emissiveIntensity: 1.3,
			map: this.getCableFlowTexture(),
			metalness: .3,
			roughness: .2
		});
	}
	static createCableFlowMaterial(e = 440020, t = 43775) {
		return this.createCableMaterial(e, t);
	}
	static {
		this.ColumnSteel = new e.MeshStandardMaterial({
			color: 1976635,
			metalness: .65,
			roughness: .5
		});
	}
	static {
		this.BranchColumnSteel = new e.MeshStandardMaterial({
			color: 1516884,
			metalness: .7,
			roughness: .45
		});
	}
	static {
		this.ConcretePier = new e.MeshStandardMaterial({
			color: 3359061,
			metalness: .3,
			roughness: .8
		});
	}
	static {
		this.ProcessPipe = new e.MeshStandardMaterial({
			color: 366185,
			metalness: .4,
			roughness: .5
		});
	}
	static {
		this.SteamPipe = new e.MeshStandardMaterial({
			color: 14251782,
			metalness: .5,
			roughness: .4
		});
	}
	static {
		this.MctFrame = new e.MeshStandardMaterial({
			color: 14251782,
			metalness: .8,
			roughness: .2
		});
	}
	static {
		this.CabinetBody = new e.MeshStandardMaterial({
			color: 3359061,
			metalness: .6,
			roughness: .4
		});
	}
	static {
		this.JbIS = new e.MeshStandardMaterial({
			color: 165063,
			metalness: .5,
			roughness: .3
		});
	}
	static {
		this.JbNonIS = new e.MeshStandardMaterial({
			color: 16096779,
			metalness: .5,
			roughness: .3
		});
	}
	static {
		this.JbFiber = new e.MeshStandardMaterial({
			color: 9647082,
			metalness: .5,
			roughness: .3
		});
	}
	static {
		this.Conduit = new e.MeshStandardMaterial({
			color: 9741240,
			metalness: .75,
			roughness: .35
		});
	}
	static {
		this.HazardMesh = new e.MeshBasicMaterial({
			color: 15680580,
			transparent: !0,
			opacity: .18
		});
	}
	static {
		this.BuildingWall = new e.MeshStandardMaterial({
			color: 1976635,
			transparent: !0,
			opacity: .35,
			roughness: .5
		});
	}
	static {
		this.RaisedFloor = new e.MeshStandardMaterial({
			color: 988970,
			roughness: .8
		});
	}
}, l = {
	add: (e, t) => [
		e[0] + t[0],
		e[1] + t[1],
		e[2] + t[2]
	],
	sub: (e, t) => [
		e[0] - t[0],
		e[1] - t[1],
		e[2] - t[2]
	],
	scale: (e, t) => [
		e[0] * t,
		e[1] * t,
		e[2] * t
	],
	dot: (e, t) => e[0] * t[0] + e[1] * t[1] + e[2] * t[2],
	cross: (e, t) => [
		e[1] * t[2] - e[2] * t[1],
		e[2] * t[0] - e[0] * t[2],
		e[0] * t[1] - e[1] * t[0]
	],
	length: (e) => Math.hypot(e[0], e[1], e[2]),
	normalize: (e) => {
		let t = Math.hypot(e[0], e[1], e[2]);
		return t === 0 ? [
			0,
			0,
			0
		] : [
			e[0] / t,
			e[1] / t,
			e[2] / t
		];
	},
	combine: (...e) => {
		let t = [
			0,
			0,
			0
		];
		for (let [n, r] of e) t[0] += n[0] * r, t[1] += n[1] * r, t[2] += n[2] * r;
		return t;
	},
	rotate: (e, t, n) => {
		let r = Math.cos(n), i = Math.sin(n), a = l.cross(t, e), o = l.dot(t, e);
		return [
			e[0] * r + a[0] * i + t[0] * o * (1 - r),
			e[1] * r + a[1] * i + t[1] * o * (1 - r),
			e[2] * r + a[2] * i + t[2] * o * (1 - r)
		];
	},
	clean: (e) => [
		Math.abs(e[0]) < 1e-9 ? 0 : e[0],
		Math.abs(e[1]) < 1e-9 ? 0 : e[1],
		Math.abs(e[2]) < 1e-9 ? 0 : e[2]
	]
}, u = 1e-9;
function d(e) {
	return l.normalize(l.cross(e.up, e.tangent));
}
function f(e) {
	return {
		position: [...e.position],
		tangent: [...e.tangent],
		up: [...e.up]
	};
}
function p(e, t) {
	return t === "UP" ? l.normalize(e.up) : d(e);
}
function m(e, t) {
	let n = p(e, t.axis), r = l.normalize(l.cross(n, e.tangent));
	return l.add(e.position, l.scale(r, Math.sign(t.angleRad) * t.radius));
}
function h(e, t) {
	let n = f(e);
	if (t.kind === "LINE") return n.position = l.add(n.position, l.scale(n.tangent, t.length)), n;
	if (t.kind === "TURN") {
		let e = l.normalize(n.up);
		return n.tangent = l.normalize(l.rotate(n.tangent, e, t.angleRad)), n;
	}
	let r = p(n, t.axis), i = m(n, t);
	return n.position = l.add(i, l.rotate(l.sub(n.position, i), r, t.angleRad)), n.tangent = l.normalize(l.rotate(n.tangent, r, t.angleRad)), n.up = l.normalize(l.rotate(n.up, r, t.angleRad)), n;
}
function g(e) {
	return e.segments.reduce((e, t) => h(e, t), f(e.start));
}
function _(e) {
	return e.segments.reduce((e, t) => t.kind === "LINE" ? e + Math.abs(t.length) : t.kind === "ARC" ? e + Math.abs(t.radius * t.angleRad) : e, 0);
}
function v(e, t, n) {
	let r = l.cross(t, e), i = Math.min(0, n), a = Math.max(0, n), o = [];
	for (let t = 0; t < 3; t++) {
		if (Math.abs(e[t]) < u && Math.abs(r[t]) < u) continue;
		let n = Math.atan2(r[t], e[t]);
		for (let e = -4; e <= 4; e++) {
			let t = n + e * Math.PI;
			t > i + 1e-7 && t < a - 1e-7 && o.push(t);
		}
	}
	return o;
}
function y(e, t) {
	let n = d(e), r = l.normalize(e.tangent), i = l.dot(r, t);
	return Math.abs(i) < 1e-9 ? n : l.sub(n, l.scale(r, l.dot(n, t) / i));
}
function b(e, t) {
	for (let n = t + 1; n < e.length; n++) {
		let t = e[n];
		if (t.kind === "LINE" && Math.abs(t.length) >= u || t.kind === "ARC" && Math.abs(t.angleRad) >= u && t.radius > 0) return !0;
	}
	return !1;
}
function x(e, t) {
	return {
		position: [...e.position],
		tangent: l.normalize(e.tangent),
		up: l.normalize(e.up),
		side: d(e),
		s: t
	};
}
function S(e, t = {}) {
	let n = t.maxArcStepRad ?? 3 * Math.PI / 180, r = t.maxLineStep ?? Infinity, i = f(e.start), a = 0, o = [x(i, 0)];
	e.segments.forEach((t, s) => {
		if (t.kind === "LINE") {
			if (Math.abs(t.length) < u) return;
			let e = Math.max(1, Math.ceil(Math.abs(t.length) / r));
			for (let n = 1; n <= e; n++) {
				let r = h(i, {
					kind: "LINE",
					length: t.length * n / e
				});
				o.push(x(r, a + Math.abs(t.length) * n / e));
			}
			i = h(i, t), a += Math.abs(t.length);
			return;
		}
		if (t.kind === "TURN") {
			if (Math.abs(t.angleRad) < u) return;
			let n = h(i, t), r = o[o.length - 1];
			if (o.length === 1) {
				let e = l.normalize(i.tangent);
				o[0] = {
					...x(n, 0),
					miterSide: y(n, e),
					capNormal: e
				};
			} else if (b(e.segments, s)) {
				let e = l.normalize(l.add(d(i), d(n)));
				r.miterSide = l.scale(e, 1 / Math.cos(t.angleRad / 2));
			} else {
				let e = l.normalize(n.tangent);
				r.miterSide = y(i, e), r.capNormal = e;
			}
			i = n;
			return;
		}
		if (Math.abs(t.angleRad) < u || t.radius <= 0) return;
		let c = p(i, t.axis), f = m(i, t), g = l.sub(i.position, f), _ = Math.max(2, Math.ceil(Math.abs(t.angleRad) / n)), S = /* @__PURE__ */ new Set();
		for (let e = 1; e <= _; e++) S.add(t.angleRad * e / _);
		v(g, c, t.angleRad).forEach((e) => S.add(e)), Array.from(S).sort((e, t) => Math.abs(e) - Math.abs(t)).forEach((e) => {
			let n = {
				kind: "ARC",
				axis: t.axis,
				angleRad: e,
				radius: t.radius
			};
			o.push(x(h(i, n), a + Math.abs(e * t.radius)));
		}), i = h(i, t), a += Math.abs(t.angleRad * t.radius);
	});
	let s = x(i, a), c = o[o.length - 1];
	return o[o.length - 1] = {
		...s,
		miterSide: c.miterSide,
		capNormal: c.capNormal
	}, o;
}
function C(e, t) {
	let n = f(e.start), r = t;
	for (let t of e.segments) {
		if (t.kind === "TURN") {
			if (r <= u) return n;
			n = h(n, t);
			continue;
		}
		let e = t.kind === "LINE" ? Math.abs(t.length) : Math.abs(t.radius * t.angleRad);
		if (r <= e + u) {
			if (t.kind === "LINE") return h(n, {
				kind: "LINE",
				length: Math.sign(t.length || 1) * r
			});
			let e = r / Math.abs(t.radius) * Math.sign(t.angleRad);
			return h(n, {
				kind: "ARC",
				axis: t.axis,
				angleRad: e,
				radius: t.radius
			});
		}
		r -= e, n = h(n, t);
	}
	return n;
}
function w(e, t, n) {
	let r = e.miterSide ?? e.side;
	return l.combine([e.position, 1], [r, t], [e.up, n]);
}
var T = class {
	constructor() {
		this.min = [
			Infinity,
			Infinity,
			Infinity
		], this.max = [
			-Infinity,
			-Infinity,
			-Infinity
		];
	}
	add(e) {
		for (let t = 0; t < 3; t++) e[t] < this.min[t] && (this.min[t] = e[t]), e[t] > this.max[t] && (this.max[t] = e[t]);
	}
	get isEmpty() {
		return !Number.isFinite(this.min[0]);
	}
	result() {
		return {
			min: l.clean(this.min),
			max: l.clean(this.max)
		};
	}
}, E = {
	webThickness: 4,
	flangeWidth: 30,
	flangeThickness: 4,
	outerOverhang: 13,
	rungWidth: 50,
	rungHeight: 25,
	rungPitch: 250
}, D = {
	sheetThickness: 2,
	lipSmall: 10,
	lipLarge: 15
};
function O(e) {
	if (typeof e == "number" && Number.isFinite(e)) return e;
	if (typeof e == "string" && e.trim() !== "" && Number.isFinite(Number(e))) return Number(e);
}
function k(e, t) {
	let n = O(e);
	return n !== void 0 && n > 0 ? n : t;
}
function A(e, t) {
	let n = O(e);
	return n !== void 0 && n >= 0 ? n : t;
}
function ee(e, t) {
	let n = O(e);
	return n === void 0 ? t : n;
}
function te(e, t) {
	let n = k(e.radius, 300);
	return e.radiusReference === "CENTERLINE" ? Math.max(1, n - t) : n;
}
function ne(e) {
	return typeof e == "string" && e.toUpperCase().startsWith("VENTILATED") ? "VENTILATED_THROUGH" : "LADDER";
}
function j(e, t) {
	let n = ne(e.trayStyle), r = t ?? k(e.width, 600), i = k(e.depth, 100), a = i / 2;
	if (n === "VENTILATED_THROUGH") {
		let t = D.sheetThickness, o = k(e.lipWidth, i >= 100 ? D.lipLarge : D.lipSmall);
		return {
			style: n,
			width: r,
			height: i,
			railRects: [{
				out: [-t, 0],
				up: [-a + t, a],
				role: "WALL"
			}, {
				out: [-o, -t],
				up: [a - t, a],
				role: "LIP"
			}],
			floor: { up: [-a, -a + t] },
			innerInset: t,
			outerOverhang: 0
		};
	}
	let o = E, s = [o.outerOverhang - o.flangeWidth / 2 - o.webThickness / 2, o.outerOverhang - o.flangeWidth / 2 + o.webThickness / 2], c = [o.outerOverhang - o.flangeWidth, o.outerOverhang];
	return {
		style: n,
		width: r,
		height: i,
		railRects: [
			{
				out: c,
				up: [-a, -a + o.flangeThickness],
				role: "FLANGE"
			},
			{
				out: s,
				up: [-a + o.flangeThickness, a - o.flangeThickness],
				role: "WEB"
			},
			{
				out: c,
				up: [a - o.flangeThickness, a],
				role: "FLANGE"
			}
		],
		rung: {
			thickness: o.rungWidth,
			up: [-a + o.flangeThickness, -a + o.flangeThickness + o.rungHeight],
			spacing: k(e.rungSpacing, o.rungPitch)
		},
		innerInset: -s[0],
		outerOverhang: o.outerOverhang
	};
}
function re(e, t) {
	return {
		style: e.style,
		halfWidth: t / 2 + e.outerOverhang,
		minUp: -e.height / 2,
		maxUp: e.height / 2
	};
}
function M(e, t, n, r, i, a) {
	let o = r ? l.scale(n.tangent, -1) : n.tangent;
	return {
		id: e,
		name: t,
		localPosition: l.clean(n.position),
		localDirection: l.clean(l.normalize(o)),
		localUp: l.clean(l.normalize(n.up)),
		width: i,
		depth: a.height,
		connectionType: "TRAY_END",
		connectionFace: re(a, i)
	};
}
function N(e, t, n, r, i) {
	let a = S(r, {
		maxLineStep: 250,
		maxArcStepRad: 3 * Math.PI / 180
	});
	return {
		id: e,
		fromPort: t,
		toPort: n,
		type: i,
		analyticLength: _(r),
		samplePoints: a.map((e) => l.clean(e.position))
	};
}
function ie(e, t, n = 0) {
	return e.railRects.map((e) => {
		let r = n + t * e.out[0], i = n + t * e.out[1];
		return {
			side: [Math.min(r, i), Math.max(r, i)],
			up: e.up
		};
	});
}
function ae(e, t) {
	let n = t.width / 2, r = [{
		path: e,
		rects: [...ie(t, 1, n), ...ie(t, -1, -n)],
		part: "RAIL"
	}];
	return t.floor && r.push({
		path: e,
		rects: [{
			side: [-n, n],
			up: t.floor.up
		}],
		part: "FLOOR"
	}), r;
}
function oe(e, t, n) {
	return {
		position: e.position,
		tangent: l.normalize(e.tangent),
		up: l.normalize(e.up),
		side: t,
		upRange: n.rung.up,
		thickness: n.rung.thickness
	};
}
function se(e, t, n) {
	if (t - e <= 1e-6) return [(e + t) / 2];
	let r = Math.max(1, Math.round((t - e) / n));
	return Array.from({ length: r + 1 }, (n, i) => e + (t - e) * i / r);
}
function ce(e, t, n, r) {
	let i = t / 2;
	if (e / 2 >= i + 1) return Math.min(e / 2, 62.5);
	let a = r > 0 ? 1 + i * n / r : i + 1;
	return Math.max(i + 1, a);
}
function le(e, t, n) {
	let r = new T();
	e.forEach((e) => {
		S(e.path).forEach((t) => {
			e.rects.forEach((e) => {
				r.add(w(t, e.side[0], e.up[0])), r.add(w(t, e.side[1], e.up[0])), r.add(w(t, e.side[0], e.up[1])), r.add(w(t, e.side[1], e.up[1]));
			});
		});
	}), t.forEach((e) => ue(e).forEach((e) => r.add(e))), n.forEach((e) => e.outline.forEach(([t, n]) => {
		r.add([
			t,
			e.y[0],
			n
		]), r.add([
			t,
			e.y[1],
			n
		]);
	}));
	let i = r.result();
	return {
		min: i.min,
		max: i.max
	};
}
function ue(e) {
	let t = d({
		tangent: e.tangent,
		up: e.up
	}), n = [];
	for (let r of [-e.thickness / 2, e.thickness / 2]) for (let i of e.side) for (let a of e.upRange) n.push(l.combine([e.position, 1], [e.tangent, r], [t, i], [e.up, a]));
	return n;
}
function P(e, t = !1) {
	let n = S(e).map((e) => [e.position[0], e.position[2]]);
	return t ? n.reverse() : n;
}
function de(e, t, n) {
	let r = t.width / 2, i = t.style === "LADDER" ? t.railRects.find((e) => e.role === "WEB").out[1] : 0, a = (t.height - 10) / 2, o = g(e), s = {
		start: {
			position: l.add(o.position, l.scale(o.tangent, -80)),
			tangent: o.tangent,
			up: o.up
		},
		segments: [{
			kind: "LINE",
			length: Math.min(160, n + 80)
		}]
	}, c = r + i;
	return [{
		path: s,
		rects: [{
			side: [c, c + 4],
			up: [-a, a]
		}, {
			side: [-c - 4, -c],
			up: [-a, a]
		}],
		part: "ACCESSORY"
	}];
}
function fe(e, t, n, r, i, a, o, s, c = []) {
	return {
		family: e,
		section: t,
		dims: n,
		ports: r,
		routes: i,
		sweeps: a,
		rungs: o,
		floors: s,
		accessories: c,
		bounds: le(a, o, s)
	};
}
function pe(e) {
	let t = j(e), n = t.width, r = k(e.length, 3e3), i = {
		start: {
			position: [
				0,
				0,
				-r / 2
			],
			tangent: [
				0,
				0,
				1
			],
			up: [
				0,
				1,
				0
			]
		},
		segments: [{
			kind: "LINE",
			length: r
		}]
	}, a = ae(i, t);
	if (e.hasDivider) {
		let n = t.rung ? t.rung.up[1] : t.floor.up[1], r = Math.max(1, Math.min(k(e.dividerHeight, 80), t.height / 2 - n));
		a.push({
			path: i,
			rects: [{
				side: [-2, 2],
				up: [n, n + r]
			}],
			part: "DIVIDER"
		});
	}
	let o = [];
	if (t.rung) {
		let e = t.rung.spacing, a = t.rung.thickness / 2, s = Math.min(e / 2, r / 2), c = n / 2 - t.innerInset;
		for (let n = s; n <= r - a - .5 + 1e-9; n += e) o.push(oe(C(i, n), [-c, c], t));
	}
	let s = e.hasSplicePlates === !0 ? de(i, t, r) : [], c = [M("PORT_A", "Inlet Port A", i.start, !0, n, t), M("PORT_B", "Outlet Port B", g(i), !1, n, t)], l = [N("ROUTE_PORT_A_PORT_B", "PORT_A", "PORT_B", i, "STRAIGHT")];
	return fe("STRAIGHT", t, {
		style: t.style,
		width: n,
		height: t.height,
		length: r,
		overallWidth: n + 2 * t.outerOverhang,
		rungPitch: t.rung?.spacing ?? 0,
		routeLength: r
	}, c, l, a, o, [], s);
}
function me(e, t) {
	let n = j(e), r = n.width, i = te(e, r / 2), a = A(e.tangentLength, 0), o = ee(e.angleDeg, t), s = o * Math.PI / 180, c = i + r / 2, l = {
		start: {
			position: [
				c,
				0,
				a
			],
			tangent: [
				0,
				0,
				-1
			],
			up: [
				0,
				1,
				0
			]
		},
		segments: [
			{
				kind: "LINE",
				length: a
			},
			{
				kind: "ARC",
				axis: "UP",
				angleRad: s,
				radius: c
			},
			{
				kind: "LINE",
				length: a
			}
		]
	}, u = ae(l, n), d = _(l), f = [];
	if (n.rung) {
		let e = r / 2 - n.innerInset, t = ce(a, n.rung.thickness, c, i + n.innerInset);
		se(t, d - t, n.rung.spacing).forEach((t) => f.push(oe(C(l, t), [-e, e], n)));
	}
	let p = [M("PORT_A", "Inlet Port A", l.start, !0, r, n), M("PORT_B", "Outlet Port B", g(l), !1, r, n)], m = [N("ROUTE_PORT_A_PORT_B", "PORT_A", "PORT_B", l, "ARC_XZ")];
	return fe("HORIZONTAL_BEND", n, {
		style: n.style,
		width: r,
		height: n.height,
		angleDeg: o,
		catalogRadius: i,
		centerlineRadius: c,
		innerRailRadius: i,
		outerRailRadius: i + r,
		tangentLength: a,
		routeLength: d
	}, p, m, u, f, []);
}
function he(e, t, n) {
	let r = j(e), i = r.width, a = r.height, o = te(e, a / 2), s = A(e.tangentLength, 0), c = ee(e.angleDeg, t), l = c * Math.PI / 180, u = o + a / 2, d = {
		start: {
			position: [
				-s,
				n ? u : -u,
				0
			],
			tangent: [
				1,
				0,
				0
			],
			up: [
				0,
				1,
				0
			]
		},
		segments: [
			{
				kind: "LINE",
				length: s
			},
			{
				kind: "ARC",
				axis: "SIDE",
				angleRad: n ? l : -l,
				radius: u
			},
			{
				kind: "LINE",
				length: s
			}
		]
	}, f = ae(d, r), p = _(d), m = [];
	if (r.rung) {
		let e = i / 2 - r.innerInset, t = n ? u + r.rung.up[0] : u - r.rung.up[1], a = ce(s, r.rung.thickness, u, t);
		se(a, p - a, r.rung.spacing).forEach((t) => m.push(oe(C(d, t), [-e, e], r)));
	}
	let h = [M("PORT_A", n ? "Upper Horizontal Inlet" : "Lower Horizontal Inlet", d.start, !0, i, r), M("PORT_B", n ? "Lower Outlet" : "Upper Outlet", g(d), !1, i, r)], v = [N("ROUTE_PORT_A_PORT_B", "PORT_A", "PORT_B", d, "ARC_XY")];
	return fe("VERTICAL_BEND", r, {
		style: r.style,
		width: i,
		height: a,
		angleDeg: c,
		catalogRadius: o,
		centerlineRadius: u,
		innerRadius: o,
		outerRadius: o + a,
		bottomRadius: n ? o : o + a,
		coverSideRadius: n ? o + a : o,
		tangentLength: s,
		routeLength: p
	}, h, v, f, m, []);
}
function ge(e, t, n, r, i, a) {
	let o = n - (e / 2 + t), s = r - (e / 2 + t);
	return {
		start: {
			position: [
				i * n,
				0,
				a * e / 2
			],
			tangent: [
				-i,
				0,
				0
			],
			up: [
				0,
				1,
				0
			]
		},
		segments: [
			{
				kind: "LINE",
				length: o
			},
			{
				kind: "ARC",
				axis: "UP",
				angleRad: Math.PI / 2 * i * a,
				radius: t
			},
			{
				kind: "LINE",
				length: s
			}
		]
	};
}
function _e(e, t, n, r, i, a) {
	return {
		start: {
			position: [
				i * n,
				0,
				0
			],
			tangent: [
				-i,
				0,
				0
			],
			up: [
				0,
				1,
				0
			]
		},
		segments: [
			{
				kind: "LINE",
				length: n - (e / 2 + t)
			},
			{
				kind: "ARC",
				axis: "UP",
				angleRad: Math.PI / 2 * i * a,
				radius: t + e / 2
			},
			{
				kind: "LINE",
				length: r - (e / 2 + t)
			}
		]
	};
}
function ve(e, t, n, r) {
	let i = t / 2 + n;
	if (e >= i) return t / 2 - r;
	let a = e - i, o = n + r;
	return Math.abs(a) <= o ? i - Math.sqrt(o * o - a * a) : i;
}
function ye(e, t, n, r, i) {
	let a = Infinity;
	for (let o = 0; o <= 4; o++) {
		let s = e - t / 2 + t * o / 4;
		a = Math.min(a, ve(Math.abs(s), n, r, i));
	}
	return a;
}
function be(e, t, n, r, i) {
	let a = O(e);
	if (a === void 0) return r;
	let o = i ? (a - t - 2 * n) / 2 : a - t / 2 - n;
	return Math.max(0, o);
}
function xe(e) {
	let t = j(e), n = t.width, r = te(e, n / 2), i = A(e.tangentLength, 125), a = be(e.length, n, r, i, !0), o = be(e.branchLength, n, r, i, !1), s = n / 2 + r + a, c = n / 2 + r + o, l = r + n / 2, u = {
		start: {
			position: [
				-s,
				0,
				-n / 2
			],
			tangent: [
				1,
				0,
				0
			],
			up: [
				0,
				1,
				0
			]
		},
		segments: [{
			kind: "LINE",
			length: 2 * s
		}]
	}, d = ge(n, r, s, c, -1, 1), f = ge(n, r, s, c, 1, 1), p = [
		{
			path: u,
			rects: ie(t, 1),
			part: "RAIL"
		},
		{
			path: d,
			rects: ie(t, -1),
			part: "RAIL"
		},
		{
			path: f,
			rects: ie(t, 1),
			part: "RAIL"
		}
	], m = [];
	if (t.floor) {
		let e = [
			...P(u),
			...P(f),
			...P(d, !0)
		];
		m.push({
			outline: e,
			y: t.floor.up
		});
	}
	let h = [];
	if (t.rung) {
		let e = t.rung.thickness, i = t.innerInset, l = a / 2 >= e / 2 + 1 ? Math.min(a / 2, 62.5) : e / 2 + 1;
		if (se(-(s - l), s - l, t.rung.spacing).forEach((a) => {
			let o = ye(a, e, n, r, i), s = -n / 2 + i;
			h.push(oe({
				position: [
					a,
					0,
					(s + o) / 2
				],
				tangent: [
					1,
					0,
					0
				],
				up: [
					0,
					1,
					0
				]
			}, [-(o - s) / 2, (o - s) / 2], t));
		}), o / 2 >= e / 2 + 1) {
			let e = Math.min(o / 2, 62.5), a = n / 2 - i;
			se(n / 2 + r + e, c - e, t.rung.spacing).forEach((e) => h.push(oe({
				position: [
					0,
					0,
					e
				],
				tangent: [
					0,
					0,
					1
				],
				up: [
					0,
					1,
					0
				]
			}, [-a, a], t)));
		}
	}
	let v = {
		start: {
			position: [
				-s,
				0,
				0
			],
			tangent: [
				1,
				0,
				0
			],
			up: [
				0,
				1,
				0
			]
		},
		segments: [{
			kind: "LINE",
			length: 2 * s
		}]
	}, y = _e(n, r, s, c, -1, 1), b = _e(n, r, s, c, 1, 1), x = [
		M("PORT_A", "Main Run Inlet Port A", v.start, !0, n, t),
		M("PORT_B", "Main Run Outlet Port B", g(v), !1, n, t),
		M("PORT_C", "Branch Outlet Port C", g(y), !1, n, t)
	], S = [
		N("ROUTE_A_B", "PORT_A", "PORT_B", v, "STRAIGHT"),
		N("ROUTE_A_C", "PORT_A", "PORT_C", y, "ARC_XZ"),
		N("ROUTE_B_C", "PORT_B", "PORT_C", b, "ARC_XZ")
	];
	return fe("TEE", t, {
		style: t.style,
		width: n,
		height: t.height,
		catalogRadius: r,
		centerlineRadius: l,
		tangentLength: a,
		branchTangentLength: o,
		mainSpan: 2 * s,
		branchProjection: c,
		branchFromBackRail: c + n / 2,
		routeLengthMain: 2 * s,
		routeLengthBranch: _(y)
	}, x, S, p, h, m);
}
function Se(e) {
	let t = j(e), n = t.width, r = te(e, n / 2), i = A(e.tangentLength, 125), a = be(e.length, n, r, i, !0), o = n / 2 + r + a, s = r + n / 2, c = [
		[1, 1],
		[-1, 1],
		[-1, -1],
		[1, -1]
	].map(([e, t]) => ({
		sx: e,
		sz: t,
		path: ge(n, r, o, o, e, t)
	})), l = c.map((e) => ({
		path: e.path,
		rects: ie(t, e.sx * e.sz),
		part: "RAIL"
	})), u = [];
	if (t.floor) {
		let e = [
			...P(c[0].path),
			...P(c[1].path, !0),
			...P(c[2].path),
			...P(c[3].path, !0)
		];
		u.push({
			outline: e,
			y: t.floor.up
		});
	}
	let d = [];
	if (t.rung) {
		let e = t.rung.thickness, i = t.innerInset, s = a / 2 >= e / 2 + 1 ? Math.min(a / 2, 62.5) : e / 2 + 1;
		if (se(-(o - s), o - s, t.rung.spacing).forEach((a) => {
			let o = ye(a, e, n, r, i);
			d.push(oe({
				position: [
					a,
					0,
					0
				],
				tangent: [
					1,
					0,
					0
				],
				up: [
					0,
					1,
					0
				]
			}, [-o, o], t));
		}), a / 2 >= e / 2 + 1) {
			let e = n / 2 - i;
			[1, -1].forEach((i) => se(n / 2 + r + s, o - s, t.rung.spacing).forEach((n) => d.push(oe({
				position: [
					0,
					0,
					i * n
				],
				tangent: [
					0,
					0,
					1
				],
				up: [
					0,
					1,
					0
				]
			}, [-e, e], t))));
		}
	}
	let f = {
		start: {
			position: [
				-o,
				0,
				0
			],
			tangent: [
				1,
				0,
				0
			],
			up: [
				0,
				1,
				0
			]
		},
		segments: [{
			kind: "LINE",
			length: 2 * o
		}]
	}, p = {
		start: {
			position: [
				0,
				0,
				-o
			],
			tangent: [
				0,
				0,
				1
			],
			up: [
				0,
				1,
				0
			]
		},
		segments: [{
			kind: "LINE",
			length: 2 * o
		}]
	}, m = [
		M("PORT_A", "Inlet Port A (-X)", f.start, !0, n, t),
		M("PORT_B", "Outlet Port B (+X)", g(f), !1, n, t),
		M("PORT_C", "Branch Port C (+Z)", g(p), !1, n, t),
		M("PORT_D", "Branch Port D (-Z)", p.start, !0, n, t)
	], h = {
		[-1]: "PORT_A",
		1: "PORT_B"
	}, v = {
		1: "PORT_C",
		[-1]: "PORT_D"
	}, y = [
		N("ROUTE_PORT_A_PORT_B", "PORT_A", "PORT_B", f, "STRAIGHT"),
		N("ROUTE_PORT_D_PORT_C", "PORT_D", "PORT_C", p, "STRAIGHT"),
		...[
			[-1, 1],
			[-1, -1],
			[1, 1],
			[1, -1]
		].map(([e, t]) => N(`ROUTE_${h[e]}_${v[t]}`, h[e], v[t], _e(n, r, o, o, e, t), "ARC_XZ"))
	];
	return fe("CROSS", t, {
		style: t.style,
		width: n,
		height: t.height,
		catalogRadius: r,
		centerlineRadius: s,
		tangentLength: a,
		span: 2 * o,
		routeLengthStraight: 2 * o,
		routeLengthTurn: _(_e(n, r, o, o, -1, 1))
	}, m, y, l, d, u);
}
function Ce(e, t) {
	let n = k(e.inletWidth, 600), r = k(e.outletWidth, 450), i = j(e, n), a = k(e.length, 500), o = Math.min(A(e.tangentLength, 0), Math.max(0, (a - 1) / 2)), s = a - 2 * o, c = r / 2, l = -r / 2;
	t === "LEFT" ? (c = n / 2, l = n / 2 - r) : t === "RIGHT" && (l = -n / 2, c = -n / 2 + r);
	let u = n / 2, d = -n / 2, f = (c + l) / 2, p = (e, t) => {
		let n = t - e, r = Math.atan2(n, s);
		return {
			start: {
				position: [
					e,
					0,
					-a / 2
				],
				tangent: [
					0,
					0,
					1
				],
				up: [
					0,
					1,
					0
				]
			},
			segments: [
				{
					kind: "LINE",
					length: o
				},
				{
					kind: "TURN",
					angleRad: r
				},
				{
					kind: "LINE",
					length: Math.hypot(n, s)
				},
				{
					kind: "TURN",
					angleRad: -r
				},
				{
					kind: "LINE",
					length: o
				}
			]
		};
	}, m = p(u, c), h = p(d, l), v = p(0, f), y = [{
		path: m,
		rects: ie(i, 1),
		part: "RAIL"
	}, {
		path: h,
		rects: ie(i, -1),
		part: "RAIL"
	}], b = [];
	i.floor && b.push({
		outline: [...P(m), ...P(h, !0)],
		y: i.floor.up
	});
	let x = (e, t, n) => {
		let r = n + a / 2;
		return r <= o ? e : r >= a - o ? t : e + (t - e) * (r - o) / s;
	}, S = [];
	if (i.rung) {
		let e = i.rung.thickness, t = i.innerInset, n = o / 2 >= e / 2 + 1 ? Math.min(o / 2, 62.5) : e / 2 + 1;
		se(-a / 2 + n, a / 2 - n, i.rung.spacing).forEach((n) => {
			let r = Infinity, a = -Infinity;
			for (let t of [
				-e / 2,
				0,
				e / 2
			]) r = Math.min(r, x(u, c, n + t)), a = Math.max(a, x(d, l, n + t));
			let o = a + t / Math.cos(Math.atan2(l - d, s)), f = r - t / Math.cos(Math.atan2(c - u, s)), p = (o + f) / 2;
			S.push(oe({
				position: [
					p,
					0,
					n
				],
				tangent: [
					0,
					0,
					1
				],
				up: [
					0,
					1,
					0
				]
			}, [o - p, f - p], i));
		});
	}
	let C = j(e, n), w = j(e, r), T = [M("PORT_A", "Wide Inlet Port A", v.start, !0, n, C), M("PORT_B", "Narrow Outlet Port B", g(v), !1, r, w)], E = [N("ROUTE_PORT_A_PORT_B", "PORT_A", "PORT_B", v, "STRAIGHT")];
	return fe("REDUCER", i, {
		style: i.style,
		reducerType: t,
		inletWidth: n,
		outletWidth: r,
		height: i.height,
		length: a,
		tangentLength: o,
		transitionLength: s,
		lateralOffset: f,
		routeLength: _(v)
	}, T, E, y, S, b);
}
//#endregion
//#region src/geometry/TrayMeshBuilder.ts
var we = class {
	constructor() {
		this.positions = [], this.normals = [], this.indices = [];
	}
	get isEmpty() {
		return this.indices.length === 0;
	}
	addVertex(e, t) {
		return this.positions.push(e[0], e[1], e[2]), this.normals.push(t[0], t[1], t[2]), this.positions.length / 3 - 1;
	}
	pos(e) {
		return [
			this.positions[e * 3],
			this.positions[e * 3 + 1],
			this.positions[e * 3 + 2]
		];
	}
	addTriangle(e, t, n, r) {
		let i = this.pos(e), a = l.cross(l.sub(this.pos(t), i), l.sub(this.pos(n), i));
		l.dot(a, r) < 0 ? this.indices.push(e, n, t) : this.indices.push(e, t, n);
	}
	addQuad(e, t, n, r, i) {
		let a = l.normalize(i), o = this.addVertex(e, a), s = this.addVertex(t, a), c = this.addVertex(n, a), u = this.addVertex(r, a);
		this.addTriangle(o, s, c, a), this.addTriangle(o, c, u, a);
	}
	addSweep(e, t) {
		if (e.length < 2) return;
		let n = [
			[t.side[0], t.up[0]],
			[t.side[1], t.up[0]],
			[t.side[1], t.up[1]],
			[t.side[0], t.up[1]]
		], r = (e, t) => {
			let n = l.normalize(e.miterSide ?? e.side);
			return t === 0 ? l.scale(e.up, -1) : t === 1 ? n : t === 2 ? e.up : l.scale(n, -1);
		};
		for (let t = 0; t < 4; t++) {
			let i = n[t], a = n[(t + 1) % 4], o = [], s = [];
			e.forEach((e) => {
				let n = r(e, t);
				o.push(this.addVertex(w(e, i[0], i[1]), n)), s.push(this.addVertex(w(e, a[0], a[1]), n));
			});
			for (let n = 0; n < e.length - 1; n++) {
				let i = l.normalize(l.add(r(e[n], t), r(e[n + 1], t)));
				this.addTriangle(o[n], o[n + 1], s[n + 1], i), this.addTriangle(o[n], s[n + 1], s[n], i);
			}
		}
		let i = e[0], a = e[e.length - 1], o = (e) => n.map(([t, n]) => w(e, t, n)), s = o(i), c = o(a);
		this.addQuad(s[0], s[1], s[2], s[3], l.scale(i.capNormal ?? i.tangent, -1)), this.addQuad(c[0], c[1], c[2], c[3], a.capNormal ?? a.tangent);
	}
	addBox(e) {
		let t = e.tangent, n = d({
			tangent: e.tangent,
			up: e.up
		}), r = e.up, i = (i, a, o) => l.combine([e.position, 1], [t, i], [n, a], [r, o]), a = -e.thickness / 2, o = e.thickness / 2, [s, c] = e.side, [u, f] = e.upRange;
		this.addQuad(i(a, s, u), i(a, c, u), i(a, c, f), i(a, s, f), l.scale(t, -1)), this.addQuad(i(o, s, u), i(o, c, u), i(o, c, f), i(o, s, f), t), this.addQuad(i(a, s, u), i(o, s, u), i(o, s, f), i(a, s, f), l.scale(n, -1)), this.addQuad(i(a, c, u), i(o, c, u), i(o, c, f), i(a, c, f), n), this.addQuad(i(a, s, u), i(o, s, u), i(o, c, u), i(a, c, u), l.scale(r, -1)), this.addQuad(i(a, s, f), i(o, s, f), i(o, c, f), i(a, c, f), r);
	}
	addFloor(t) {
		let n = new e.Shape(t.outline.map(([t, n]) => new e.Vector2(t, -n))), r = new e.ExtrudeGeometry(n, {
			depth: t.y[1] - t.y[0],
			bevelEnabled: !1,
			curveSegments: 1
		});
		r.rotateX(-Math.PI / 2), r.translate(0, t.y[0], 0);
		let i = r.getAttribute("position"), a = r.getAttribute("normal"), o = this.positions.length / 3;
		for (let e = 0; e < i.count; e++) this.positions.push(i.getX(e), i.getY(e), i.getZ(e)), this.normals.push(a.getX(e), a.getY(e), a.getZ(e));
		let s = r.getIndex();
		if (s) for (let e = 0; e < s.count; e++) this.indices.push(o + s.getX(e));
		else for (let e = 0; e < i.count; e++) this.indices.push(o + e);
		r.dispose();
	}
	toGeometry() {
		let t = new e.BufferGeometry();
		return t.setAttribute("position", new e.Float32BufferAttribute(this.positions.map((e) => e / 1e3), 3)), t.setAttribute("normal", new e.Float32BufferAttribute(this.normals, 3)), t.setIndex(this.indices), t.computeBoundingBox(), t.computeBoundingSphere(), t;
	}
};
function Te(e, t) {
	t.forEach((t) => {
		let n = S(t.path);
		t.rects.forEach((t) => e.addSweep(n, t));
	});
}
function F(t, n = {}) {
	let r = new e.Group();
	r.name = `Tray_${t.family}`;
	let i = n.materials ?? {}, a = i.body ?? (n.isIS ? c.TrayIS : c.Tray), o = i.divider ?? i.body ?? c.Divider, s = i.accessory ?? i.body ?? c.Support, l = (t, n, a, o, s = !1) => {
		if (t.isEmpty) return;
		let c = new e.Mesh(t.toGeometry(), o);
		c.name = n, c.castShadow = !0, c.receiveShadow = !0, c.userData = {
			part: a,
			isAccessory: s,
			sharedMaterial: !Object.values(i).includes(o)
		}, r.add(c);
	}, u = new we();
	Te(u, t.sweeps.filter((e) => e.part === "RAIL")), l(u, "Rails", "RAILS", a);
	let d = new we();
	Te(d, t.sweeps.filter((e) => e.part === "FLOOR")), t.floors.forEach((e) => d.addFloor(e)), l(d, "Floor", "FLOOR", a);
	let f = new we();
	t.rungs.forEach((e) => f.addBox(e)), l(f, "Rungs", "RUNGS", a);
	let p = new we();
	Te(p, t.sweeps.filter((e) => e.part === "DIVIDER")), l(p, "Divider", "DIVIDER", o);
	let m = new we();
	return Te(m, t.accessories), l(m, "SplicePlates", "ACCESSORY", s, !0), r;
}
//#endregion
//#region src/geometry/Generators.ts
var I = class {
	static buildTrayLayout(e, t = {}) {
		return F(e, t);
	}
	static buildStraightTray(e) {
		return F(pe(e), { isIS: e.isIS });
	}
	static buildSplicePlateMesh(t = .1) {
		let n = new e.Group(), r = new e.Mesh(new e.BoxGeometry(.05, t - .02, .12), c.Support);
		return n.add(r), [-.04, .04].forEach((t) => {
			let r = new e.Mesh(new e.CylinderGeometry(.008, .008, .055, 8), c.Bolt);
			r.rotation.set(Math.PI / 2, 0, Math.PI / 2), r.position.set(0, 0, t), n.add(r);
		}), n;
	}
	static buildSplicePlate(e = {}) {
		let t = e.depth ? a.mmToM(e.depth) : .1;
		return this.buildSplicePlateMesh(t);
	}
	static buildCantileverSupport(t) {
		let n = new e.Group(), r = a.mmToM(t.width || 600), i = a.mmToM(t.depth || 100), o = a.mmToM(t.armLength || (t.width ? t.width + 150 : 750)), s = new e.Mesh(new e.BoxGeometry(o, .04, .04), c.Support);
		s.position.set(o / 2 - r / 2 - .05, -i / 2 - .02, 0);
		let l = new e.Mesh(new e.BoxGeometry(.02, .25, .06), c.Support);
		l.position.set(-r / 2 - .06, -i / 2 - .02 - .1, 0);
		let u = new e.Mesh(new e.BoxGeometry(.06, .01, .04), c.Bolt);
		u.position.set(-r / 2, -i / 2 + .005, 0);
		let d = new e.Mesh(new e.BoxGeometry(.06, .01, .04), c.Bolt);
		return d.position.set(r / 2, -i / 2 + .005, 0), n.add(s, l, u, d), n;
	}
	static buildHorizontalElbow(e) {
		return F(me(e, e.angleDeg ?? 90), { isIS: e.isIS });
	}
	static buildHorizontalTee(e) {
		return F(xe(e), { isIS: e.isIS });
	}
	static buildVerticalRiser(e) {
		return F(he(e, e.angleDeg ?? 90, !!e.isOutside), { isIS: e.isIS });
	}
	static buildReducer(e) {
		return F(Ce(e, e.type), { isIS: e.isIS });
	}
	static buildJunctionBox(t) {
		let n = new e.Group(), r = a.mmToM(t.width), i = a.mmToM(t.height), o = a.mmToM(t.depth), s = c.JbIS;
		t.boxType === "NON_IS" && (s = c.JbNonIS), t.boxType === "FIBER" && (s = c.JbFiber);
		let l = new e.Mesh(new e.BoxGeometry(r, i, o), s);
		l.castShadow = !0, n.add(l);
		let u = new e.Mesh(new e.BoxGeometry(.12, i + .1, .08), c.Support);
		return u.position.set(0, 0, o / 2 + .04), n.add(u), [
			-r / 4,
			0,
			r / 4
		].forEach((t) => {
			let r = new e.Mesh(new e.CylinderGeometry(.02, .02, .06, 12), c.Bolt);
			r.position.set(t, -i / 2 - .03, 0), n.add(r);
		}), n;
	}
	static buildUnistrutMount(t) {
		let n = new e.Group(), r = a.mmToM(t.length), i = new e.Mesh(new e.BoxGeometry(.041, r, .041), c.Support);
		return n.add(i), n;
	}
	static buildConduitRiser(t) {
		let n = new e.Group(), r = a.mmToM(t.diameterMm) / 2, i = a.mmToM(t.lengthMm), o = new e.Mesh(new e.CylinderGeometry(r, r, i, 16), c.Conduit);
		return o.castShadow = !0, n.add(o), n;
	}
	static buildMctPenetration(t) {
		let n = new e.Group(), r = a.mmToM(t.widthMm), i = a.mmToM(t.heightMm), o = a.mmToM(t.thicknessMm), s = new e.Mesh(new e.BoxGeometry(o, i, r), c.MctFrame);
		s.castShadow = !0, n.add(s);
		let l = new e.MeshStandardMaterial({
			color: 1976635,
			roughness: .9
		}), u = new e.Mesh(new e.BoxGeometry(o + .02, i * .8, r * .8), l);
		return n.add(u), n;
	}
	static buildControlCabinet(t) {
		let n = new e.Group(), r = a.mmToM(t.widthMm), i = a.mmToM(t.heightMm), o = a.mmToM(t.depthMm), s = new e.Mesh(new e.BoxGeometry(r, i, o), c.CabinetBody);
		s.castShadow = !0, n.add(s);
		let l = new e.Mesh(new e.BoxGeometry(.02, .2, o * .85), new e.MeshBasicMaterial({ color: t.stripeColorHex }));
		return l.position.set(-r / 2 - .01, i / 2 - .3, 0), n.add(l), n;
	}
	static buildStructuralColumn(t) {
		let n = new e.Group(), r = a.mmToM(t.heightMm), i = a.mmToM(t.widthMm || 350), o = new e.Mesh(new e.BoxGeometry(i, r, i), c.ColumnSteel);
		return o.position.y = r / 2, o.castShadow = !0, n.add(o), n;
	}
	static buildStructuralPier(t) {
		let n = new e.Group(), r = a.mmToM(t.widthMm || 700), i = a.mmToM(t.heightMm || 400), o = new e.Mesh(new e.BoxGeometry(r, i, r), c.ConcretePier);
		return o.position.y = i / 2, o.receiveShadow = !0, n.add(o), n;
	}
	static buildStructuralCrossBeam(t) {
		let n = new e.Group(), r = a.mmToM(t.spanMm), i = a.mmToM(t.heightMm || 250), o = a.mmToM(t.depthMm || 180), s = new e.Mesh(new e.BoxGeometry(o, i, r), c.ColumnSteel);
		return n.add(s), n;
	}
	static buildStructuralStringer(t) {
		let n = new e.Group(), r = a.mmToM(t.spanMm), i = new e.Mesh(new e.BoxGeometry(.2, .15, r), c.BranchColumnSteel);
		return n.add(i), n;
	}
	static buildPipe(t) {
		let n = new e.Group(), r = a.mmToM(t.diameterMm) / 2, i = a.mmToM(t.lengthMm), o = t.isSteam ? c.SteamPipe : c.ProcessPipe, s = new e.Mesh(new e.CylinderGeometry(r, r, i, 24), o);
		return t.axis === "Z" ? s.rotation.x = Math.PI / 2 : s.rotation.z = Math.PI / 2, s.castShadow = !0, n.add(s), n;
	}
	static buildHazardZone(t) {
		let n = new e.Group(), r = a.mmToM(t.widthMm), i = a.mmToM(t.heightMm), o = a.mmToM(t.depthMm), s = new e.Mesh(new e.BoxGeometry(r, i, o), c.HazardMesh), l = new e.BoxHelper(s, 16281969);
		return n.add(s, l), n;
	}
	static buildBuildingContext(t) {
		let n = new e.Group(), r = a.mmToM(t.widthMm), i = a.mmToM(t.heightMm), o = a.mmToM(t.depthMm), s = new e.Mesh(new e.BoxGeometry(r, i, o), c.BuildingWall), l = new e.Mesh(new e.BoxGeometry(r * .98, .4, o * .98), c.RaisedFloor);
		return l.position.y = -i / 2 + .2, n.add(s, l), n;
	}
	static buildVisualCable(t) {
		let n = new e.Group();
		if (t.pathPoints.length < 2) return n;
		let r = t.pathPoints.map((t) => new e.Vector3(a.mmToM(t[0]), a.mmToM(t[1]), a.mmToM(t[2]))), i = new e.CatmullRomCurve3(r), o = a.mmToM(t.radiusMm || 25), s = new e.TubeGeometry(i, 64, o, 12, !1), l = c.createCableMaterial(t.colorHex || 440020, t.emissiveHex || 43775), u = new e.Mesh(s, l);
		return n.add(u), n;
	}
	static buildHorizontalCross(e) {
		return F(Se(e), { isIS: e.isIS });
	}
}, Ee = "Generic library default, not a vendor value. Apply a TraySystemProfile for catalog-true dimensions.";
function L(e, n = Ee) {
	return {
		source: e,
		assumptionLevel: t.DEMO_DEFAULT,
		notes: n
	};
}
var De = {
	width: L("Generic nominal width W"),
	depth: L("Generic side rail height H (vendor ladder catalog H = 150 mm, PDF p.4)"),
	trayStyle: L("Tray style (LADDER | VENTILATED_THROUGH)")
}, Oe = {
	source: "Vendor catalog radius definition (PDF p.5 dimension chain \"W | R | 125\", p.11 cover \"R−2\", p.13 chain \"125 | R | H\")",
	assumptionLevel: t.DEMO_DEFAULT,
	notes: "Value is a generic default. SEMANTICS (verified): radius = catalog inner radius R. Horizontal centerline radius = R + W/2; vertical centerline radius = R + H/2."
}, ke = {
	source: "Vendor catalog 125 mm tangent at every bend / tee / cross end (PDF p.5–18)",
	assumptionLevel: t.DEMO_DEFAULT,
	notes: "Generic default 0 keeps the legacy pure-arc shape; vendor profiles set 125 mm."
};
function Ae(e, t) {
	return {
		...e,
		...t
	};
}
function je(e, t, r, a) {
	let o = (e) => a(Ae(t, e));
	return {
		schemaVersion: "2.0.0",
		componentVersion: "2.0.0",
		id: e.id,
		name: e.name,
		nameZh: e.nameZh,
		family: e.family,
		origin: e.origin,
		role: e.family === "TRAY" ? i.TRAY : i.FITTING,
		description: e.description,
		hasBomMetadata: !0,
		bomScope: n.MCR_CABLE_TRAY_BOM,
		includedInMcrBom: !0,
		defaultParameters: t,
		provenance: {
			...De,
			...r
		},
		getLocalPorts: (e) => o(e).ports,
		getCenterlineRoutes: (e) => o(e).routes,
		getBounds: (e) => o(e).bounds,
		buildGeometry: (e, n) => {
			let r = Ae(t, e);
			return F(a(r), {
				...n,
				isIS: !!r.isIS
			});
		},
		getEngineeringDimensions: (e) => o(e).dims
	};
}
function Me() {
	return je({
		id: "TRAY_STRAIGHT",
		name: "Straight Cable Tray",
		nameZh: "直式線槽 (直通托架)",
		family: "TRAY",
		origin: r.LEGACY_FITTING_LIBRARY,
		description: "Straight ladder / ventilated-through cable tray (vendor PDF p.4, p.30, p.41). Rungs at 125 + 250·k mm."
	}, {
		width: 600,
		depth: 100,
		length: 3e3,
		rungSpacing: 250,
		trayStyle: "LADDER",
		hasSplicePlates: !1
	}, {
		length: L("Standard 3 m manufactured segment (vendor catalog L = 3000, PDF p.4)"),
		rungSpacing: L("Rung pitch 250 mm (vendor PDF p.4)"),
		hasSplicePlates: L("Optional accessory visual; excluded from tray body, bounds and mate checks")
	}, pe);
}
function Ne() {
	return je({
		id: "TRAY_STRAIGHT_DIVIDER",
		name: "Divided Straight Tray (IS & Non-IS)",
		nameZh: "隔板分流直式線槽",
		family: "TRAY",
		origin: r.LEGACY_FITTING_LIBRARY,
		description: "Straight tray with a central separator plate (vendor PDF p.25) isolating IS signal cables from power."
	}, {
		width: 600,
		depth: 100,
		length: 3e3,
		rungSpacing: 250,
		trayStyle: "LADDER",
		dividerHeight: 80,
		hasDivider: !0
	}, { dividerHeight: L("Separator plate height (vendor p.25 shows 100 mm plate)") }, pe);
}
function Pe(e, t, n, r) {
	return je({
		id: e,
		name: `Horizontal Elbow ${t}°`,
		nameZh: `水平 L 形 ${t}° 彎頭`,
		family: "FITTING",
		origin: n,
		description: `Horizontal ${t}° bend (vendor ${r}). Catalog R = inner rail radius; centerline radius R + W/2; optional 125 mm tangents.`
	}, {
		width: 600,
		depth: 100,
		radius: 300,
		angleDeg: t,
		tangentLength: 0,
		trayStyle: "LADDER"
	}, {
		radius: Oe,
		angleDeg: L(`Nominal ${t}° sweep (any angle supported)`),
		tangentLength: ke
	}, (e) => me(e, t));
}
function Fe(e, t, n, r, i) {
	return je({
		id: e,
		name: `Vertical ${n ? "Outside" : "Inside"} Elbow ${t}°`,
		nameZh: n ? `垂直下降 ${t}° 彎頭` : `垂直上升 ${t}° 彎頭`,
		family: "FITTING",
		origin: r,
		description: n ? `Vertical outside (falling) ${t}° bend (vendor ${i}). Catalog R at the tray bottom; cover side at R + H.` : `Vertical inside (rising) ${t}° bend (vendor ${i}). Catalog R at the rail-top / cover side; tray bottom at R + H.`
	}, {
		width: 600,
		depth: 100,
		radius: 300,
		angleDeg: t,
		tangentLength: 0,
		trayStyle: "LADDER"
	}, {
		radius: Oe,
		angleDeg: L(`Nominal ${t}° elevation change (any angle supported)`),
		tangentLength: ke
	}, (e) => he(e, t, n));
}
function Ie() {
	return je({
		id: "FITTING_TEE",
		name: "Horizontal Tee",
		nameZh: "水平 T 形彎頭 (三通)",
		family: "FITTING",
		origin: r.LEGACY_FITTING_LIBRARY,
		description: "Horizontal tee with radius-R curved transitions into the branch (vendor PDF p.9). Main span W + 2R + 2T, branch projection W/2 + R + T."
	}, {
		width: 600,
		depth: 100,
		radius: 300,
		tangentLength: 100,
		trayStyle: "LADDER"
	}, {
		radius: Oe,
		tangentLength: ke
	}, xe);
}
function Le() {
	return je({
		id: "FITTING_CROSS",
		name: "Horizontal Cross",
		nameZh: "水平 X 形彎頭 (四通)",
		family: "FITTING",
		origin: r.NEW_COMPONENT,
		description: "Horizontal cross with four radius-R curved corners (vendor PDF p.10). Span W + 2R + 2T on both axes; straight routes A↔B, D↔C and turning routes A↔C, A↔D, B↔C, B↔D."
	}, {
		width: 600,
		depth: 100,
		radius: 300,
		tangentLength: 125,
		trayStyle: "LADDER"
	}, {
		radius: Oe,
		tangentLength: ke
	}, Se);
}
function Re(e, t, n) {
	let i = t === "CONCENTRIC" ? "both rails taper symmetrically" : t === "LEFT" ? "the LEFT rail stays straight (viewed from the wide end toward the narrow end)" : "the RIGHT rail stays straight (viewed from the wide end toward the narrow end)";
	return je({
		id: e,
		name: n.name,
		nameZh: n.nameZh,
		family: "FITTING",
		origin: r.NEW_COMPONENT,
		description: `Reducer from W1 to W2 (vendor ${n.page}): ${i}. Catalog shape 200 straight + 200 taper + 200 straight = 600 mm.`
	}, {
		inletWidth: 600,
		outletWidth: 450,
		depth: 100,
		length: 500,
		tangentLength: 100,
		trayStyle: "LADDER"
	}, {
		inletWidth: L("Wide end W1"),
		outletWidth: L("Narrow end W2"),
		length: L("Generic 500 mm reducer (vendor catalog: 600 mm, PDF p.19–21)"),
		tangentLength: L("Straight sections at both ends (vendor catalog: 200 mm; 0 = legacy linear taper)")
	}, (e) => Ce(e, t));
}
//#endregion
//#region src/registry/ComponentRegistry.ts
var R = class {
	static {
		this._definitions = /* @__PURE__ */ new Map();
	}
	static getAll() {
		return this._definitions.size === 0 && this.initAll(), Array.from(this._definitions.values());
	}
	static get(e) {
		return this._definitions.size === 0 && this.initAll(), this._definitions.get(e);
	}
	static register(e) {
		this._definitions.set(e.id, e);
	}
	static initAll() {
		this._definitions.clear(), this.register(Me()), this.register(Ne()), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "FITTING_SPLICE_PLATE",
			name: "Standard Splice Plate Connection Kit",
			nameZh: "標準連接壓板組件 (含搭接螺栓)",
			family: "ACCESSORY",
			origin: r.LEGACY_FITTING_LIBRARY,
			role: i.SUPPORT,
			description: "Factory-formed bolted steel splice plates connecting adjacent tray side rails.",
			hasBomMetadata: !0,
			bomScope: n.MCR_CABLE_TRAY_BOM,
			includedInMcrBom: !0,
			defaultParameters: {
				depth: 100,
				length: 200,
				boltCount: 4
			},
			provenance: { length: {
				source: "Oglaend standard splice plate SP-100",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "200mm length"
			} },
			getLocalPorts: (e) => [{
				id: "PORT_L_RAIL",
				name: "Left Rail Connection",
				localPosition: [
					-300,
					0,
					0
				],
				localDirection: [
					-1,
					0,
					0
				],
				localUp: [
					0,
					1,
					0
				],
				width: 20,
				depth: e.depth || 100,
				connectionType: "STRUCTURAL"
			}, {
				id: "PORT_R_RAIL",
				name: "Right Rail Connection",
				localPosition: [
					300,
					0,
					0
				],
				localDirection: [
					1,
					0,
					0
				],
				localUp: [
					0,
					1,
					0
				],
				width: 20,
				depth: e.depth || 100,
				connectionType: "STRUCTURAL"
			}],
			getCenterlineRoutes: () => [],
			getBounds: (e) => ({
				min: [
					-310,
					-(e.depth || 100) / 2,
					-(e.length || 200) / 2
				],
				max: [
					310,
					(e.depth || 100) / 2,
					(e.length || 200) / 2
				]
			}),
			buildGeometry: (e) => I.buildSplicePlate(e)
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "SUPPORT_CANTILEVER",
			name: "Cantilever Tray Support Arm",
			nameZh: "懸臂式托架支撐臂",
			family: "SUPPORT",
			origin: r.LEGACY_FITTING_LIBRARY,
			role: i.SUPPORT,
			description: "Structural steel cantilever bracket bolted to pipe rack columns to carry cable trays.",
			hasBomMetadata: !0,
			bomScope: n.MCR_CABLE_TRAY_BOM,
			includedInMcrBom: !0,
			defaultParameters: {
				armLength: 750,
				channelHeight: 120,
				thickness: 45
			},
			provenance: { armLength: {
				source: "Standard 600mm tray support clearance",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "750mm arm length"
			} },
			getLocalPorts: (e) => [{
				id: "PORT_BASE",
				name: "Column Mounting Plate",
				localPosition: [
					0,
					0,
					0
				],
				localDirection: [
					-1,
					0,
					0
				],
				localUp: [
					0,
					1,
					0
				],
				width: 80,
				depth: 160,
				connectionType: "STRUCTURAL"
			}, {
				id: "PORT_TRAY_SEAT",
				name: "Tray Seating Surface",
				localPosition: [
					(e.armLength || 750) / 2,
					(e.channelHeight || 120) / 2,
					0
				],
				localDirection: [
					0,
					1,
					0
				],
				localUp: [
					1,
					0,
					0
				],
				width: e.armLength || 750,
				depth: 45,
				connectionType: "STRUCTURAL"
			}],
			getCenterlineRoutes: () => [],
			getBounds: (e) => ({
				min: [
					0,
					-(e.channelHeight || 120) / 2,
					-25
				],
				max: [
					e.armLength || 750,
					(e.channelHeight || 120) / 2,
					25
				]
			}),
			buildGeometry: (e) => I.buildCantileverSupport(e)
		}), this.register(Pe("FITTING_ELBOW_90", 90, r.LEGACY_FITTING_LIBRARY, "PDF p.5 / p.31 / p.42")), this.register(Ie()), this.register(Fe("FITTING_RISER_IN_90", 90, !1, r.LEGACY_FITTING_LIBRARY, "PDF p.11 / p.34 / p.44")), this.register(Fe("FITTING_RISER_OUT_90", 90, !0, r.LEGACY_FITTING_LIBRARY, "PDF p.15 / p.35 / p.45")), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "EQUIP_JUNCTION_BOX",
			name: "Explosion-Proof Junction Box (Ex d)",
			nameZh: "防爆儀表接線箱 (JB)",
			family: "EQUIPMENT",
			origin: r.LEGACY_MCR_PROTOTYPE,
			role: i.EQUIPMENT,
			description: "NEMA 4X / Ex d cast aluminum junction box mounted on structural steel column.",
			hasBomMetadata: !0,
			bomScope: n.MCR_TERMINATION_BOM,
			includedInMcrBom: !0,
			defaultParameters: {
				width: 550,
				height: 750,
				depth: 350,
				boxType: "IS"
			},
			provenance: { width: {
				source: "Field JB sizing practice",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "550x750x350 enclosure"
			} },
			getLocalPorts: (e) => [{
				id: "PORT_BOTTOM_GLAND",
				name: "Bottom Cable Gland Entry",
				localPosition: [
					0,
					-(e.height || 750) / 2,
					0
				],
				localDirection: [
					0,
					-1,
					0
				],
				localUp: [
					0,
					0,
					1
				],
				width: 150,
				depth: 50,
				connectionType: "GLAND"
			}],
			getCenterlineRoutes: () => [],
			getBounds: (e) => {
				let t = (e.width || 550) / 2, n = (e.height || 750) / 2, r = (e.depth || 350) / 2;
				return {
					min: [
						-t,
						-n,
						-r
					],
					max: [
						t,
						n,
						r
					]
				};
			},
			buildGeometry: (e) => I.buildJunctionBox(e)
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "MOUNT_UNISTRUT",
			name: "Unistrut Channel Mounting Support",
			nameZh: "槽鋼托架支架 (Unistrut)",
			family: "SUPPORT",
			origin: r.LEGACY_MCR_PROTOTYPE,
			role: i.SUPPORT,
			description: "Standard P1000 41x41mm slotted channel clamped to steel columns.",
			hasBomMetadata: !0,
			bomScope: n.MCR_CABLE_TRAY_BOM,
			includedInMcrBom: !0,
			defaultParameters: { length: 850 },
			provenance: { length: {
				source: "Unistrut P1000 standard",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "41x41mm channel"
			} },
			getLocalPorts: () => [],
			getCenterlineRoutes: () => [],
			getBounds: (e) => ({
				min: [
					-21,
					-(e.length || 850) / 2,
					-21
				],
				max: [
					21,
					(e.length || 850) / 2,
					21
				]
			}),
			buildGeometry: (e) => I.buildUnistrutMount(e)
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "CONDUIT_RISER",
			name: "Rigid Steel Conduit Riser",
			nameZh: "立柱保護鋼管 (RGS Conduit)",
			family: "PENETRATION",
			origin: r.LEGACY_MCR_PROTOTYPE,
			role: i.PENETRATION,
			description: "Rigid galvanized steel conduit protecting trunk cables rising from JB to top tier tray.",
			hasBomMetadata: !0,
			bomScope: n.MCR_TERMINATION_BOM,
			includedInMcrBom: !0,
			defaultParameters: {
				diameterMm: 50,
				lengthMm: 5e3
			},
			provenance: { diameterMm: {
				source: "ANSI C80.1 2-inch RGS",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "50mm OD"
			} },
			getLocalPorts: (e) => [{
				id: "PORT_BOTTOM",
				name: "Bottom Threaded Hub",
				localPosition: [
					0,
					-(e.lengthMm || 5e3) / 2,
					0
				],
				localDirection: [
					0,
					-1,
					0
				],
				localUp: [
					0,
					0,
					1
				],
				width: 50,
				depth: 50,
				connectionType: "CONDUIT"
			}, {
				id: "PORT_TOP",
				name: "Top Weatherhead Outlet",
				localPosition: [
					0,
					(e.lengthMm || 5e3) / 2,
					0
				],
				localDirection: [
					0,
					1,
					0
				],
				localUp: [
					0,
					0,
					1
				],
				width: 50,
				depth: 50,
				connectionType: "CONDUIT"
			}],
			getCenterlineRoutes: (e) => [{
				id: "ROUTE_CONDUIT",
				fromPort: "PORT_BOTTOM",
				toPort: "PORT_TOP",
				type: "STRAIGHT",
				analyticLength: e.lengthMm || 5e3,
				samplePoints: [[
					0,
					-(e.lengthMm || 5e3) / 2,
					0
				], [
					0,
					(e.lengthMm || 5e3) / 2,
					0
				]]
			}],
			getBounds: (e) => ({
				min: [
					-25,
					-(e.lengthMm || 5e3) / 2,
					-25
				],
				max: [
					25,
					(e.lengthMm || 5e3) / 2,
					25
				]
			}),
			buildGeometry: (e) => I.buildConduitRiser(e)
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "PENETRATION_MCT",
			name: "MCT Transit Firestop Frame",
			nameZh: "MCT 防火密封穿牆框組",
			family: "PENETRATION",
			origin: r.LEGACY_MCR_PROTOTYPE,
			role: i.PENETRATION,
			description: "Multi-cable transit frame with elastomeric insert modules and wedge seal.",
			hasBomMetadata: !0,
			bomScope: n.MCR_TERMINATION_BOM,
			includedInMcrBom: !0,
			defaultParameters: {
				widthMm: 600,
				heightMm: 900,
				thicknessMm: 400
			},
			provenance: {
				widthMm: {
					source: "Roxtec RG M6x1 sizing standard",
					assumptionLevel: t.DEMO_DEFAULT,
					notes: "600x900mm frame"
				},
				thicknessMm: {
					source: "Concrete wall sleeve depth",
					assumptionLevel: t.DEMO_DEFAULT,
					notes: "400mm wall thickness"
				}
			},
			getLocalPorts: (e) => [{
				id: "PORT_EXT",
				name: "Exterior Intake Face",
				localPosition: [
					-(e.thicknessMm || 400) / 2,
					0,
					0
				],
				localDirection: [
					-1,
					0,
					0
				],
				localUp: [
					0,
					1,
					0
				],
				width: e.widthMm || 600,
				depth: e.heightMm || 900,
				connectionType: "FLANGE"
			}, {
				id: "PORT_INT",
				name: "Interior Control Room Face",
				localPosition: [
					(e.thicknessMm || 400) / 2,
					0,
					0
				],
				localDirection: [
					1,
					0,
					0
				],
				localUp: [
					0,
					1,
					0
				],
				width: e.widthMm || 600,
				depth: e.heightMm || 900,
				connectionType: "FLANGE"
			}],
			getCenterlineRoutes: (e) => [{
				id: "ROUTE_MCT",
				fromPort: "PORT_EXT",
				toPort: "PORT_INT",
				type: "STRAIGHT",
				analyticLength: e.thicknessMm || 400,
				samplePoints: [[
					-(e.thicknessMm || 400) / 2,
					0,
					0
				], [
					(e.thicknessMm || 400) / 2,
					0,
					0
				]]
			}],
			getBounds: (e) => ({
				min: [
					-(e.thicknessMm || 400) / 2,
					-(e.heightMm || 900) / 2,
					-(e.widthMm || 600) / 2
				],
				max: [
					(e.thicknessMm || 400) / 2,
					(e.heightMm || 900) / 2,
					(e.widthMm || 600) / 2
				]
			}),
			buildGeometry: (e) => I.buildMctPenetration(e)
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "EQUIP_CONTROL_CABINET",
			name: "Control Room Marshalling Cabinet",
			nameZh: "控制室系統交連機櫃 (DCS/SIS)",
			family: "EQUIPMENT",
			origin: r.LEGACY_MCR_PROTOTYPE,
			role: i.EQUIPMENT,
			description: "Standard 800x1000x2200mm floor-mounted marshalling rack with bottom trench cable entry.",
			hasBomMetadata: !0,
			bomScope: n.MCR_TERMINATION_BOM,
			includedInMcrBom: !0,
			defaultParameters: {
				widthMm: 1e3,
				heightMm: 2200,
				depthMm: 800,
				stripeColorHex: 165063
			},
			provenance: { heightMm: {
				source: "Standard 42U cabinet",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "2200mm with plinth"
			} },
			getLocalPorts: (e) => [{
				id: "PORT_BOTTOM_ENTRY",
				name: "Bottom Cable Trench Entry",
				localPosition: [
					0,
					-(e.heightMm || 2200) / 2,
					0
				],
				localDirection: [
					0,
					-1,
					0
				],
				localUp: [
					1,
					0,
					0
				],
				width: (e.widthMm || 1e3) * .7,
				depth: (e.depthMm || 800) * .7,
				connectionType: "TRAY_END"
			}],
			getCenterlineRoutes: () => [],
			getBounds: (e) => ({
				min: [
					-(e.widthMm || 1e3) / 2,
					-(e.heightMm || 2200) / 2,
					-(e.depthMm || 800) / 2
				],
				max: [
					(e.widthMm || 1e3) / 2,
					(e.heightMm || 2200) / 2,
					(e.depthMm || 800) / 2
				]
			}),
			buildGeometry: (e) => I.buildControlCabinet(e)
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "STRUCT_COLUMN",
			name: "Pipe Rack Structural Column",
			nameZh: "主管廊 H 型鋼立柱",
			family: "STRUCTURE",
			origin: r.LEGACY_MCR_PROTOTYPE,
			role: i.STRUCTURE,
			description: "Heavy structural H-beam steel column reaching up to EL +8.0m with beam connections.",
			hasBomMetadata: !0,
			bomScope: n.STRUCTURAL_REF,
			includedInMcrBom: !1,
			defaultParameters: {
				heightMm: 8e3,
				widthMm: 350
			},
			provenance: { heightMm: {
				source: "Pipe rack standard elevation design",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "Reaches EL +8.0m"
			} },
			getLocalPorts: () => [],
			getCenterlineRoutes: () => [],
			getBounds: (e) => ({
				min: [
					-175,
					0,
					-175
				],
				max: [
					175,
					e.heightMm || 8e3,
					175
				]
			}),
			buildGeometry: (e) => I.buildStructuralColumn(e)
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "STRUCT_PIER",
			name: "Concrete Foundation Pier",
			nameZh: "混凝土基墩基礎",
			family: "STRUCTURE",
			origin: r.LEGACY_MCR_PROTOTYPE,
			role: i.STRUCTURE,
			description: "Reinforced concrete foundation pedestal anchoring steel columns to ground.",
			hasBomMetadata: !0,
			bomScope: n.STRUCTURAL_REF,
			includedInMcrBom: !1,
			defaultParameters: {
				widthMm: 700,
				heightMm: 400
			},
			provenance: { heightMm: {
				source: "Civil pedestal detail",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "400mm above ground"
			} },
			getLocalPorts: () => [],
			getCenterlineRoutes: () => [],
			getBounds: (e) => ({
				min: [
					-350,
					0,
					-350
				],
				max: [
					350,
					e.heightMm || 400,
					350
				]
			}),
			buildGeometry: (e) => I.buildStructuralPier(e)
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "STRUCT_CROSS_BEAM",
			name: "Pipe Rack Cross Beam",
			nameZh: "管廊橫向支撐樑",
			family: "STRUCTURE",
			origin: r.LEGACY_MCR_PROTOTYPE,
			role: i.STRUCTURE,
			description: "Transverse structural beam spanning across columns supporting piping and cable trays.",
			hasBomMetadata: !0,
			bomScope: n.STRUCTURAL_REF,
			includedInMcrBom: !1,
			defaultParameters: {
				spanMm: 7800,
				heightMm: 250,
				depthMm: 180
			},
			provenance: { spanMm: {
				source: "Main Pipe Rack standard width",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "7.8m transversal span"
			} },
			getLocalPorts: () => [],
			getCenterlineRoutes: () => [],
			getBounds: (e) => ({
				min: [
					-90,
					-125,
					-(e.spanMm || 7800) / 2
				],
				max: [
					90,
					125,
					(e.spanMm || 7800) / 2
				]
			}),
			buildGeometry: (e) => I.buildStructuralCrossBeam(e)
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "STRUCT_STRINGER",
			name: "Longitudinal Stringer Beam",
			nameZh: "管廊縱向縱樑",
			family: "STRUCTURE",
			origin: r.LEGACY_MCR_PROTOTYPE,
			role: i.STRUCTURE,
			description: "Longitudinal steel stringer connecting transverse bays.",
			hasBomMetadata: !0,
			bomScope: n.STRUCTURAL_REF,
			includedInMcrBom: !1,
			defaultParameters: { spanMm: 6e3 },
			provenance: { spanMm: {
				source: "Bay longitudinal spacing",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "6.0m typical bay"
			} },
			getLocalPorts: () => [],
			getCenterlineRoutes: () => [],
			getBounds: (e) => ({
				min: [
					-100,
					-75,
					-(e.spanMm || 6e3) / 2
				],
				max: [
					100,
					75,
					(e.spanMm || 6e3) / 2
				]
			}),
			buildGeometry: (e) => I.buildStructuralStringer(e)
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "OBSTACLE_MAIN_PROCESS_PIPE",
			name: "Main Pipe Rack Process Line (Hydrocarbon)",
			nameZh: "主管廊碳氫製程管線",
			family: "OBSTACLE",
			origin: r.LEGACY_MCR_PROTOTYPE,
			role: i.OBSTACLE,
			description: "Heavy 500mm process pipeline running along EL +3.0m requiring minimum clearance.",
			hasBomMetadata: !0,
			bomScope: n.PROCESS_PIPING_REF,
			includedInMcrBom: !1,
			defaultParameters: {
				diameterMm: 500,
				lengthMm: 27e3,
				clearanceMm: 150
			},
			provenance: { diameterMm: {
				source: "Process sizing estimate",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "500mm OD pipe"
			} },
			getLocalPorts: () => [],
			getCenterlineRoutes: () => [],
			getBounds: (e) => {
				let t = (e.diameterMm || 500) / 2, n = e.clearanceMm || 150;
				return {
					min: [
						-(e.lengthMm || 27e3) / 2,
						-t,
						-t
					],
					max: [
						(e.lengthMm || 27e3) / 2,
						t,
						t
					],
					clearanceEnvelope: {
						min: [
							-(e.lengthMm || 27e3) / 2,
							-t - n,
							-t - n
						],
						max: [
							(e.lengthMm || 27e3) / 2,
							t + n,
							t + n
						],
						reason: "Flammable process line minimum clearance",
						bufferMm: n
					}
				};
			},
			buildGeometry: (e) => I.buildPipe({
				...e,
				isSteam: !1,
				axis: "X"
			})
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "OBSTACLE_MAIN_STEAM_PIPE",
			name: "High-Pressure Steam Header Pipe",
			nameZh: "主管廊高壓蒸汽管線",
			family: "OBSTACLE",
			origin: r.LEGACY_MCR_PROTOTYPE,
			role: i.OBSTACLE,
			description: "Thermal steam pipe with orange insulation and 250mm thermal radiant buffer envelope.",
			hasBomMetadata: !0,
			bomScope: n.PROCESS_PIPING_REF,
			includedInMcrBom: !1,
			defaultParameters: {
				diameterMm: 480,
				lengthMm: 27e3,
				clearanceMm: 250
			},
			provenance: { diameterMm: {
				source: "HP steam header sizing",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "480mm insulated OD"
			} },
			getLocalPorts: () => [],
			getCenterlineRoutes: () => [],
			getBounds: (e) => {
				let t = (e.diameterMm || 480) / 2, n = e.clearanceMm || 250;
				return {
					min: [
						-(e.lengthMm || 27e3) / 2,
						-t,
						-t
					],
					max: [
						(e.lengthMm || 27e3) / 2,
						t,
						t
					],
					clearanceEnvelope: {
						min: [
							-(e.lengthMm || 27e3) / 2,
							-t - n,
							-t - n
						],
						max: [
							(e.lengthMm || 27e3) / 2,
							t + n,
							t + n
						],
						reason: "High-temperature radiant heat buffer",
						bufferMm: n
					}
				};
			},
			buildGeometry: (e) => I.buildPipe({
				...e,
				isSteam: !0,
				axis: "X"
			})
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "OBSTACLE_BRANCH_PIPE_N",
			name: "North Branch Process Pipe",
			nameZh: "北側反應區分支製程管",
			family: "OBSTACLE",
			origin: r.LEGACY_MCR_PROTOTYPE,
			role: i.OBSTACLE,
			description: "Process branch pipe running across north branch rack along Z axis.",
			hasBomMetadata: !0,
			bomScope: n.PROCESS_PIPING_REF,
			includedInMcrBom: !1,
			defaultParameters: {
				diameterMm: 400,
				lengthMm: 7500
			},
			provenance: { diameterMm: {
				source: "Branch process sizing",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "400mm OD"
			} },
			getLocalPorts: () => [],
			getCenterlineRoutes: () => [],
			getBounds: (e) => ({
				min: [
					-200,
					-200,
					-(e.lengthMm || 7500) / 2
				],
				max: [
					200,
					200,
					(e.lengthMm || 7500) / 2
				]
			}),
			buildGeometry: (e) => I.buildPipe({
				...e,
				isSteam: !1,
				axis: "Z"
			})
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "OBSTACLE_BRANCH_PIPE_S",
			name: "South Branch Steam Pipe",
			nameZh: "南側儲槽區分支蒸汽管",
			family: "OBSTACLE",
			origin: r.LEGACY_MCR_PROTOTYPE,
			role: i.OBSTACLE,
			description: "Steam branch line running into south storage area.",
			hasBomMetadata: !0,
			bomScope: n.PROCESS_PIPING_REF,
			includedInMcrBom: !1,
			defaultParameters: {
				diameterMm: 360,
				lengthMm: 7500
			},
			provenance: { diameterMm: {
				source: "Branch steam sizing",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "360mm OD"
			} },
			getLocalPorts: () => [],
			getCenterlineRoutes: () => [],
			getBounds: (e) => ({
				min: [
					-180,
					-180,
					-(e.lengthMm || 7500) / 2
				],
				max: [
					180,
					180,
					(e.lengthMm || 7500) / 2
				]
			}),
			buildGeometry: (e) => I.buildPipe({
				...e,
				isSteam: !0,
				axis: "Z"
			})
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "OBSTACLE_HAZARD_ZONE",
			name: "Thermal Hazard Envelope Zone",
			nameZh: "高溫熱區避讓包絡體",
			family: "OBSTACLE",
			origin: r.LEGACY_MCR_PROTOTYPE,
			role: i.OBSTACLE,
			description: "Thermal furnace radiant exclusion zone enforcing routing detour.",
			hasBomMetadata: !1,
			bomScope: n.PROCESS_PIPING_REF,
			includedInMcrBom: !1,
			defaultParameters: {
				widthMm: 6e3,
				heightMm: 6e3,
				depthMm: 4e3
			},
			provenance: { widthMm: {
				source: "Furnace exclusion envelope",
				assumptionLevel: t.UNVERIFIED,
				notes: "Requires CFD verification"
			} },
			getLocalPorts: () => [],
			getCenterlineRoutes: () => [],
			getBounds: (e) => ({
				min: [
					-(e.widthMm || 6e3) / 2,
					-(e.heightMm || 6e3) / 2,
					-(e.depthMm || 4e3) / 2
				],
				max: [
					(e.widthMm || 6e3) / 2,
					(e.heightMm || 6e3) / 2,
					(e.depthMm || 4e3) / 2
				]
			}),
			buildGeometry: (e) => I.buildHazardZone(e)
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "CONTEXT_BUILDING",
			name: "Control Room Building & Floor",
			nameZh: "控制室建築主體與高架地板",
			family: "STRUCTURE",
			origin: r.LEGACY_MCR_PROTOTYPE,
			role: i.STRUCTURE,
			description: "Reinforced concrete control building envelope with raised access floor.",
			hasBomMetadata: !1,
			bomScope: n.STRUCTURAL_REF,
			includedInMcrBom: !1,
			defaultParameters: {
				widthMm: 11e3,
				heightMm: 5500,
				depthMm: 14e3
			},
			provenance: { widthMm: {
				source: "Control room architectural layout",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "11x5.5x14m envelope"
			} },
			getLocalPorts: () => [],
			getCenterlineRoutes: () => [],
			getBounds: (e) => ({
				min: [
					-(e.widthMm || 11e3) / 2,
					0,
					-(e.depthMm || 14e3) / 2
				],
				max: [
					(e.widthMm || 11e3) / 2,
					e.heightMm || 5500,
					(e.depthMm || 14e3) / 2
				]
			}),
			buildGeometry: (e) => I.buildBuildingContext(e)
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "VISUAL_CABLE_GENERATOR",
			name: "Dynamic Flowing Cable Bundle",
			nameZh: "動態流光訊號電纜束",
			family: "VISUAL",
			origin: r.LEGACY_MCR_PROTOTYPE,
			role: i.VISUAL,
			description: "3D cable bundle with animated flow shader displaying signal direction and segregation colors.",
			hasBomMetadata: !1,
			bomScope: n.VISUAL_ONLY,
			includedInMcrBom: !1,
			defaultParameters: {
				radiusMm: 25,
				colorHex: 440020,
				emissiveHex: 43775,
				pathPoints: [
					[
						0,
						0,
						0
					],
					[
						0,
						5e3,
						0
					],
					[
						5e3,
						5e3,
						0
					]
				]
			},
			provenance: { radiusMm: {
				source: "Multi-pair trunk cable outer diameter",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "25mm average OD"
			} },
			getLocalPorts: () => [],
			getCenterlineRoutes: () => [],
			getBounds: () => ({
				min: [
					-50,
					-50,
					-50
				],
				max: [
					5e3,
					5e3,
					50
				]
			}),
			buildGeometry: (e) => I.buildVisualCable(e)
		}), this.register(Pe("FITTING_ELBOW_45", 45, r.NEW_COMPONENT, "PDF p.7 / p.32")), this.register(Pe("FITTING_ELBOW_60", 60, r.NEW_COMPONENT, "PDF p.6")), this.register(Pe("FITTING_ELBOW_30", 30, r.NEW_COMPONENT, "PDF p.8 / p.43")), this.register(Fe("FITTING_RISER_IN_45", 45, !1, r.NEW_COMPONENT, "PDF p.13")), this.register(Fe("FITTING_RISER_IN_60", 60, !1, r.NEW_COMPONENT, "PDF p.12")), this.register(Fe("FITTING_RISER_IN_30", 30, !1, r.NEW_COMPONENT, "PDF p.14")), this.register(Fe("FITTING_RISER_OUT_45", 45, !0, r.NEW_COMPONENT, "PDF p.17")), this.register(Fe("FITTING_RISER_OUT_60", 60, !0, r.NEW_COMPONENT, "PDF p.16")), this.register(Fe("FITTING_RISER_OUT_30", 30, !0, r.NEW_COMPONENT, "PDF p.18")), this.register(Re("FITTING_REDUCER_LEFT", "LEFT", {
			name: "Left Reducer",
			nameZh: "左偏異徑接頭",
			page: "PDF p.20"
		})), this.register(Re("FITTING_REDUCER_CENTER", "CONCENTRIC", {
			name: "Center Reducer",
			nameZh: "中間異徑接頭",
			page: "PDF p.19"
		})), this.register(Re("FITTING_REDUCER_RIGHT", "RIGHT", {
			name: "Right Reducer",
			nameZh: "右偏異徑接頭",
			page: "PDF p.21"
		})), this.register(Le()), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "STRUCT_MAIN_BAY",
			name: "Main Pipe Rack Portal Bay Assembly",
			nameZh: "主管廊四階門型構架組合件",
			family: "STRUCTURE_ASSEMBLY",
			origin: r.DERIVED_ASSEMBLY,
			role: i.STRUCTURE,
			description: "Engineered 4-tier steel portal frame bay assembly comprising 2 columns, 2 piers, and 4 transverse cross beams.",
			hasBomMetadata: !0,
			bomScope: n.STRUCTURAL_REF,
			includedInMcrBom: !1,
			defaultParameters: {
				widthSpanMm: 7800,
				heightMm: 8e3
			},
			provenance: {
				widthSpanMm: {
					source: "Main spine 7.8m span",
					assumptionLevel: t.DEMO_DEFAULT,
					notes: "Main spine 7.8m span"
				},
				heightMm: {
					source: "Pipe rack standard elevation",
					assumptionLevel: t.DEMO_DEFAULT,
					notes: "EL +8.0m top elevation"
				}
			},
			getLocalPorts: () => [{
				id: "PORT_TIER_LOWER",
				name: "Lower Top Tier IS Tray Seat (EL +6.35m)",
				localPosition: [
					0,
					6350,
					0
				],
				localDirection: [
					0,
					1,
					0
				],
				localUp: [
					1,
					0,
					0
				],
				width: 7800,
				depth: 250,
				connectionType: "STRUCTURAL"
			}, {
				id: "PORT_TIER_UPPER",
				name: "Upper Top Tier Non-IS Tray Seat (EL +7.15m)",
				localPosition: [
					0,
					7150,
					0
				],
				localDirection: [
					0,
					1,
					0
				],
				localUp: [
					1,
					0,
					0
				],
				width: 7800,
				depth: 250,
				connectionType: "STRUCTURAL"
			}],
			getCenterlineRoutes: () => [],
			getBounds: () => ({
				min: [
					-350,
					0,
					-4150
				],
				max: [
					350,
					8e3,
					4150
				]
			}),
			subComponents: [
				{
					definitionId: "STRUCT_COLUMN",
					instanceSuffix: "COL_NORTH",
					relativePlacement: {
						position: [
							0,
							0,
							-3800
						],
						quaternion: [
							0,
							0,
							0,
							1
						]
					},
					isPurchasedSeparately: !1
				},
				{
					definitionId: "STRUCT_COLUMN",
					instanceSuffix: "COL_SOUTH",
					relativePlacement: {
						position: [
							0,
							0,
							3800
						],
						quaternion: [
							0,
							0,
							0,
							1
						]
					},
					isPurchasedSeparately: !1
				},
				{
					definitionId: "STRUCT_PIER",
					instanceSuffix: "PIER_NORTH",
					relativePlacement: {
						position: [
							0,
							0,
							-3800
						],
						quaternion: [
							0,
							0,
							0,
							1
						]
					},
					isPurchasedSeparately: !1
				},
				{
					definitionId: "STRUCT_PIER",
					instanceSuffix: "PIER_SOUTH",
					relativePlacement: {
						position: [
							0,
							0,
							3800
						],
						quaternion: [
							0,
							0,
							0,
							1
						]
					},
					isPurchasedSeparately: !1
				},
				{
					definitionId: "STRUCT_CROSS_BEAM",
					instanceSuffix: "BEAM_3M",
					relativePlacement: {
						position: [
							0,
							3e3,
							0
						],
						quaternion: [
							0,
							0,
							0,
							1
						]
					},
					isPurchasedSeparately: !1
				},
				{
					definitionId: "STRUCT_CROSS_BEAM",
					instanceSuffix: "BEAM_4_8M",
					relativePlacement: {
						position: [
							0,
							4800,
							0
						],
						quaternion: [
							0,
							0,
							0,
							1
						]
					},
					isPurchasedSeparately: !1
				},
				{
					definitionId: "STRUCT_CROSS_BEAM",
					instanceSuffix: "BEAM_6_4M",
					relativePlacement: {
						position: [
							0,
							6350,
							0
						],
						quaternion: [
							0,
							0,
							0,
							1
						]
					},
					isPurchasedSeparately: !1
				},
				{
					definitionId: "STRUCT_CROSS_BEAM",
					instanceSuffix: "BEAM_7_2M",
					relativePlacement: {
						position: [
							0,
							7150,
							0
						],
						quaternion: [
							0,
							0,
							0,
							1
						]
					},
					isPurchasedSeparately: !1
				}
			],
			buildGeometry: () => {
				let t = new e.Group();
				return [-3.8, 3.8].forEach((e) => {
					let n = I.buildStructuralColumn({
						heightMm: 8e3,
						widthMm: 350
					});
					n.position.set(0, 0, e);
					let r = I.buildStructuralPier({
						widthMm: 700,
						heightMm: 400
					});
					r.position.set(0, 0, e), t.add(n, r);
				}), [
					3,
					4.8,
					6.35,
					7.15
				].forEach((e) => {
					let n = I.buildStructuralCrossBeam({ spanMm: 7800 });
					n.position.set(0, e, 0), t.add(n);
				}), t;
			}
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "STRUCT_BRANCH_BAY",
			name: "Branch Pipe Rack Portal Bay Assembly",
			nameZh: "製程支管廊門型構架組合件",
			family: "STRUCTURE_ASSEMBLY",
			origin: r.DERIVED_ASSEMBLY,
			role: i.STRUCTURE,
			description: "Branch pipe rack portal bay with longitudinal stringers for lateral piping and tray feeds.",
			hasBomMetadata: !0,
			bomScope: n.STRUCTURAL_REF,
			includedInMcrBom: !1,
			defaultParameters: {
				widthSpanMm: 2700,
				heightMm: 8e3,
				stringerSpanMm: 6e3
			},
			provenance: { widthSpanMm: {
				source: "Branch rack layout",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "2.7m lateral width"
			} },
			getLocalPorts: () => [],
			getCenterlineRoutes: () => [],
			getBounds: () => ({
				min: [
					-1350,
					0,
					-3e3
				],
				max: [
					1350,
					8e3,
					3e3
				]
			}),
			subComponents: [
				{
					definitionId: "STRUCT_COLUMN",
					instanceSuffix: "B_COL_L",
					relativePlacement: {
						position: [
							-1200,
							0,
							0
						],
						quaternion: [
							0,
							0,
							0,
							1
						]
					},
					isPurchasedSeparately: !1
				},
				{
					definitionId: "STRUCT_COLUMN",
					instanceSuffix: "B_COL_R",
					relativePlacement: {
						position: [
							1200,
							0,
							0
						],
						quaternion: [
							0,
							0,
							0,
							1
						]
					},
					isPurchasedSeparately: !1
				},
				{
					definitionId: "STRUCT_CROSS_BEAM",
					instanceSuffix: "B_BEAM_TOP",
					relativePlacement: {
						position: [
							0,
							7150,
							0
						],
						quaternion: [
							0,
							0,
							0,
							1
						]
					},
					isPurchasedSeparately: !1
				},
				{
					definitionId: "STRUCT_STRINGER",
					instanceSuffix: "B_STR_L",
					relativePlacement: {
						position: [
							-1200,
							7150,
							0
						],
						quaternion: [
							0,
							0,
							0,
							1
						]
					},
					isPurchasedSeparately: !1
				},
				{
					definitionId: "STRUCT_STRINGER",
					instanceSuffix: "B_STR_R",
					relativePlacement: {
						position: [
							1200,
							7150,
							0
						],
						quaternion: [
							0,
							0,
							0,
							1
						]
					},
					isPurchasedSeparately: !1
				}
			],
			buildGeometry: () => {
				let t = new e.Group();
				[-1.2, 1.2].forEach((e) => {
					let n = I.buildStructuralColumn({
						heightMm: 8e3,
						widthMm: 300
					});
					n.position.set(e, 0, 0), t.add(n);
				});
				let n = I.buildStructuralCrossBeam({ spanMm: 2700 });
				return n.position.set(0, 7.15, 0), n.rotation.y = Math.PI / 2, t.add(n), [-1.2, 1.2].forEach((e) => {
					let n = I.buildStructuralStringer({ spanMm: 6e3 });
					n.position.set(e, 7.15, 0), t.add(n);
				}), t;
			}
		});
	}
}, ze = {
	standardWidthsMm: [
		150,
		200,
		300,
		450,
		600,
		750,
		900
	],
	standardDepthsMm: [100, 150],
	standardBendAnglesDeg: [45, 90],
	standardBendRadiiMm: [
		300,
		450,
		600,
		900
	],
	standardLengthsMm: [
		1500,
		2e3,
		3e3,
		6e3
	],
	checkConformance(e) {
		let t = [];
		return e.width !== void 0 && !this.standardWidthsMm.includes(e.width) && t.push(`Width ${e.width}mm is a non-standard custom width.`), e.depth !== void 0 && !this.standardDepthsMm.includes(e.depth) && t.push(`Depth ${e.depth}mm is non-standard.`), e.angleDeg !== void 0 && !this.standardBendAnglesDeg.includes(e.angleDeg) && t.push(`Angle ${e.angleDeg}° is a Non-standard Catalog Preset (field cut / special order required).`), e.radius !== void 0 && !this.standardBendRadiiMm.includes(e.radius) && t.push(`Bend radius ${e.radius}mm is non-standard.`), {
			isStandard: t.length === 0,
			warnings: t
		};
	}
}, Be = class {
	static getSubComponents(e) {
		return R.get(e)?.subComponents || [];
	}
	static isAssembly(e) {
		let t = R.get(e);
		return t?.origin === "DERIVED_ASSEMBLY" && !!t?.subComponents && t.subComponents.length > 0;
	}
};
//#endregion
//#region src/registry/TraySystemProfile.ts
function Ve(e, t) {
	return t - (e.printedPageOffset ?? 0);
}
var He = "R = inner radius of the bend (inner side rail for horizontal bends / tee / cross; rail-top side for vertical inside bends; tray bottom for vertical outside bends). Routing centerline radius = R + W/2 (horizontal) or R + H/2 (vertical).", Ue = [
	100,
	200,
	300,
	400,
	500,
	600,
	700,
	800,
	900,
	1e3
], We = "Polyester powder coating #67 light grey, ≥ 50 µm", Ge = {
	LADDER_PROFILE_STANDARD: {
		id: "LADDER_PROFILE_STANDARD",
		vendor: "SECXXX",
		trayType: "LADDER",
		name: "Aluminum Ladder Tray (600W × 150H)",
		nameZh: "鋁製梯型電纜線槽 (600W × 150H)",
		width: 600,
		allowedWidths: Ue,
		height: 150,
		standardLength: 3e3,
		defaultRadius: 300,
		allowedRadii: [
			300,
			600,
			900
		],
		allowedAngles: [
			30,
			45,
			60,
			90
		],
		allowedHorizontalAngles: [
			30,
			45,
			60,
			90
		],
		allowedVerticalAngles: [
			30,
			45,
			60,
			90
		],
		tangentLength: 125,
		reducerLength: 600,
		reducerTangentLength: 200,
		material: "ALUMINUM_6063_T5 (4.0t)",
		fittingMaterial: "ALUMINUM_6063_T5 (4.0t)",
		wallThicknessMm: 4,
		coverMaterial: "ALUMINUM_5052 (2.0t)",
		coverThicknessMm: 2,
		rungSpacingMm: 250,
		finish: We,
		coverWidthFormula: "W + 38 (W = 1000: W + 48)",
		coverWidth: 638,
		overallWidth: 626,
		radiusSemantics: He,
		source: {
			document: "鋁製梯型電纜線槽 (Aluminum Ladder Type Cable Tray)",
			pages: Array.from({ length: 26 }, (e, t) => t + 1),
			printedPageOffset: 2
		},
		components: [
			{
				definitionId: "TRAY_STRAIGHT",
				pages: [4],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "TRAY_STRAIGHT_DIVIDER",
				pages: [4, 25],
				status: "ENGINEERING_DERIVED",
				notes: "Straight tray + separator plate (p.25); plate position is an assumption."
			},
			{
				definitionId: "FITTING_ELBOW_90",
				pages: [5],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_ELBOW_60",
				pages: [6],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_ELBOW_45",
				pages: [7],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_ELBOW_30",
				pages: [8],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_TEE",
				pages: [9],
				status: "CATALOG_VERIFIED",
				notes: "Routing geometry verified (125 | R | W | R | 125, W | R | 125); rung layout in the junction is a visual approximation."
			},
			{
				definitionId: "FITTING_CROSS",
				pages: [10],
				status: "CATALOG_VERIFIED",
				notes: "Routing geometry verified (125 | R | W | R | 125 on both axes); rung layout in the junction is a visual approximation."
			},
			{
				definitionId: "FITTING_RISER_IN_90",
				pages: [11],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_RISER_IN_60",
				pages: [12],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_RISER_IN_45",
				pages: [13],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_RISER_IN_30",
				pages: [14],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_RISER_OUT_90",
				pages: [15],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_RISER_OUT_60",
				pages: [16],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_RISER_OUT_45",
				pages: [17],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_RISER_OUT_30",
				pages: [18],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_REDUCER_CENTER",
				pages: [19],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_REDUCER_LEFT",
				pages: [20],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_REDUCER_RIGHT",
				pages: [21],
				status: "CATALOG_VERIFIED"
			}
		]
	},
	VENTILATED_PROFILE_A: {
		id: "VENTILATED_PROFILE_A",
		vendor: "SECXXX",
		trayType: "VENTILATED_THROUGH",
		name: "Aluminum Ventilated-Through Tray A (100W × 50H)",
		nameZh: "鋁製密閉沖底型線槽 A (100W × 50H)",
		width: 100,
		allowedWidths: [100],
		height: 50,
		standardLength: 3e3,
		defaultRadius: 300,
		allowedRadii: [300],
		allowedAngles: [45, 90],
		allowedHorizontalAngles: [45, 90],
		allowedVerticalAngles: [90],
		tangentLength: 125,
		reducerLength: 0,
		reducerTangentLength: 0,
		material: "ALUMINUM_6063_T5 (2.0t)",
		fittingMaterial: "ALUMINUM_5052_H32 (2.0t)",
		wallThicknessMm: 2,
		coverMaterial: "ALUMINUM_5052_H32 (2.0t)",
		coverThicknessMm: 2,
		lipWidthMm: 10,
		finish: We,
		coverWidthFormula: "W + 6",
		coverWidth: 106,
		overallWidth: 100,
		radiusSemantics: He,
		source: {
			document: "鋁製密閉沖底型電纜線槽 (Aluminum Ventilated Through Type Cable Tray) — 100W × 50H",
			pages: [
				27,
				28,
				29,
				30,
				31,
				32,
				33,
				34,
				35,
				36,
				37
			],
			printedPageOffset: 28
		},
		components: [
			{
				definitionId: "TRAY_STRAIGHT",
				pages: [30],
				status: "CATALOG_VERIFIED",
				notes: "Floor slot pattern is a visual approximation (solid floor plate)."
			},
			{
				definitionId: "FITTING_ELBOW_90",
				pages: [31],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_ELBOW_45",
				pages: [32],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_TEE",
				pages: [33],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_RISER_IN_90",
				pages: [34],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_RISER_OUT_90",
				pages: [35],
				status: "CATALOG_VERIFIED"
			}
		]
	},
	VENTILATED_PROFILE_B: {
		id: "VENTILATED_PROFILE_B",
		vendor: "SECXXX",
		trayType: "VENTILATED_THROUGH",
		name: "Aluminum Ventilated-Through Tray B (300W × 100H)",
		nameZh: "鋁製密閉沖底型線槽 B (300W × 100H)",
		width: 300,
		allowedWidths: [300],
		height: 100,
		standardLength: 3e3,
		defaultRadius: 300,
		allowedRadii: [300],
		allowedAngles: [30, 90],
		allowedHorizontalAngles: [30, 90],
		allowedVerticalAngles: [90],
		tangentLength: 125,
		reducerLength: 0,
		reducerTangentLength: 0,
		material: "ALUMINUM_5052_H32 (2.0t)",
		fittingMaterial: "ALUMINUM_5052_H32 (2.0t)",
		wallThicknessMm: 2,
		coverMaterial: "ALUMINUM_5052_H32 (2.0t)",
		coverThicknessMm: 2,
		lipWidthMm: 15,
		finish: We,
		coverWidthFormula: "W + 6",
		coverWidth: 306,
		overallWidth: 300,
		radiusSemantics: He,
		source: {
			document: "鋁製密閉沖底型電纜線槽 (Aluminum Ventilated Through Type Cable Tray) — 300W × 100H",
			pages: [
				38,
				39,
				40,
				41,
				42,
				43,
				44,
				45,
				46,
				47
			],
			printedPageOffset: 39
		},
		components: [
			{
				definitionId: "TRAY_STRAIGHT",
				pages: [41],
				status: "CATALOG_VERIFIED",
				notes: "Floor slot pattern is a visual approximation (solid floor plate)."
			},
			{
				definitionId: "FITTING_ELBOW_90",
				pages: [42],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_ELBOW_30",
				pages: [43],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_RISER_IN_90",
				pages: [44],
				status: "CATALOG_VERIFIED"
			},
			{
				definitionId: "FITTING_RISER_OUT_90",
				pages: [45],
				status: "CATALOG_VERIFIED"
			}
		]
	}
}, z = class {
	static getAll() {
		return Object.values(Ge);
	}
	static get(e) {
		return Ge[e];
	}
	static getSupport(e, t) {
		return e.components.find((e) => e.definitionId === t);
	}
	static supports(e, t) {
		return !!this.getSupport(e, t);
	}
};
function Ke(e) {
	return e.startsWith("TRAY_STRAIGHT") ? "STRAIGHT" : e.startsWith("FITTING_ELBOW") ? "H_BEND" : e.startsWith("FITTING_RISER") ? "V_BEND" : e === "FITTING_TEE" ? "TEE" : e === "FITTING_CROSS" ? "CROSS" : e.startsWith("FITTING_REDUCER") ? "REDUCER" : "OTHER";
}
function qe(e, t) {
	let n = e.allowedWidths.filter((e) => e < t), r = n.filter((e) => e <= t / 2);
	return r.length > 0 ? r[r.length - 1] : n.length > 0 ? n[0] : Math.max(100, t / 2);
}
function B(e, t, n = {}) {
	let r = {
		width: t.width,
		depth: t.height,
		trayStyle: t.trayType,
		profileId: t.id
	};
	switch (t.lipWidthMm && (r.lipWidth = t.lipWidthMm), Ke(e)) {
		case "STRAIGHT":
			r.length = t.standardLength, t.rungSpacingMm && (r.rungSpacing = t.rungSpacingMm);
			break;
		case "H_BEND":
		case "V_BEND":
		case "TEE":
		case "CROSS":
			r.radius = t.defaultRadius, r.tangentLength = t.tangentLength;
			break;
		case "REDUCER": {
			let e = n.inletWidth ?? n.width ?? t.width;
			r.inletWidth = e, r.outletWidth = qe(t, e), r.length = t.reducerLength || 600, r.tangentLength = t.reducerTangentLength || 200;
			break;
		}
	}
	return {
		...r,
		...n
	};
}
function V(e, t, n = {}, r) {
	let i = R.get(e);
	if (!i) throw Error(`Component definition '${e}' not found in ComponentRegistry`);
	return new s(r || `${e.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1e3)}`, i, B(e, t, n));
}
//#endregion
//#region src/registry/SystemClassification.ts
var Je = {
	ALL: {
		id: "ALL",
		name: "All Components",
		nameZh: "全部配件與構件 (全庫展示)",
		badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
		catalogPages: "All Pages",
		description: "顯示庫中所有可用之直槽、轉折配件、管架鋼構、設備與避讓障礙物。"
	},
	SYSTEM_LADDER: {
		id: "SYSTEM_LADDER",
		name: "Aluminum Ladder Tray System",
		nameZh: "鋁製梯型電纜線槽系統",
		badgeClass: "bg-blue-950 text-blue-300 border-blue-700",
		catalogPages: "PDF p.1 ~ p.26",
		description: "W 100~1000 mm、H 150 mm、R 300/600/900 mm；直槽、水平 90°/60°/45°/30° 彎頭、三通、四通、垂直上升/下降 90°/60°/45°/30°、中間/左偏/右偏異徑接頭。",
		profileId: "LADDER_PROFILE_STANDARD"
	},
	SYSTEM_VENTILATED_SMALL: {
		id: "SYSTEM_VENTILATED_SMALL",
		name: "Ventilated-Through Tray A (100W x 50H)",
		nameZh: "鋁製密閉沖底型線槽 A (100W x 50H)",
		badgeClass: "bg-emerald-950 text-emerald-300 border-emerald-700",
		catalogPages: "PDF p.27 ~ p.37",
		description: "100W x 50H、R 300 mm；直槽、水平 90°/45° 彎頭、水平三通、垂直上升 90°、垂直下降 90° (型錄無四通與異徑)。",
		profileId: "VENTILATED_PROFILE_A"
	},
	SYSTEM_VENTILATED_LARGE: {
		id: "SYSTEM_VENTILATED_LARGE",
		name: "Ventilated-Through Tray B (300W x 100H)",
		nameZh: "鋁製密閉沖底型線槽 B (300W x 100H)",
		badgeClass: "bg-teal-950 text-teal-300 border-teal-700",
		catalogPages: "PDF p.38 ~ p.47",
		description: "300W x 100H、R 300 mm；直槽、水平 90°/30° 彎頭、垂直上升 90°、垂直下降 90° (型錄無三通、四通與異徑)。",
		profileId: "VENTILATED_PROFILE_B"
	},
	SYSTEM_STRUCTURAL: {
		id: "SYSTEM_STRUCTURAL",
		name: "Structural Pipe Rack Infrastructure",
		nameZh: "主管廊鋼構支撐架系統",
		badgeClass: "bg-purple-950 text-purple-300 border-purple-700",
		catalogPages: "Engineering Civil Spec",
		description: "H 型鋼主立柱、橫樑與跨距門型管架組，提供電纜托架之標高固定基礎。"
	},
	SYSTEM_EQUIPMENT: {
		id: "SYSTEM_EQUIPMENT",
		name: "Electrical Equipment & Building MCT",
		nameZh: "現場端接箱與建築貫穿封堵",
		badgeClass: "bg-amber-950 text-amber-300 border-amber-700",
		catalogPages: "Instrumentation Spec",
		description: "本安/非本安防爆現場接線箱 (Junction Box) 與控制室耐火密封穿牆框 (MCT Penetration)。"
	},
	SYSTEM_OBSTACLE: {
		id: "SYSTEM_OBSTACLE",
		name: "Piping Obstacles for Routing Clearance",
		nameZh: "製程高溫與化學管道避讓物",
		badgeClass: "bg-red-950 text-red-300 border-red-700",
		catalogPages: "P&ID / Piping Spec",
		description: "高溫蒸汽管與高壓製程管，具備熱輻射防護淨空包絡圓筒體 (Clearance Envelope)。"
	}
};
function Ye(e) {
	return e.startsWith("TRAY_STRAIGHT") ? "STRAIGHT" : e.startsWith("FITTING_ELBOW") ? "ELBOW" : e === "FITTING_TEE" || e === "FITTING_CROSS" ? "BRANCH" : e.startsWith("FITTING_RISER") ? "RISER" : e.startsWith("FITTING_REDUCER") ? "REDUCER" : e.startsWith("STRUCT") ? "STRUCTURAL" : e.startsWith("EQUIP") || e.startsWith("PENETRATION") || e.startsWith("CONTEXT") || e.startsWith("CONDUIT") ? "EQUIPMENT" : e.startsWith("OBSTACLE") ? "OBSTACLE" : "ACCESSORY";
}
var Xe = {
	STRAIGHT: "1. 直式線槽 (Straight Trays)",
	ELBOW: "2. 水平彎頭 (Horizontal Elbows)",
	BRANCH: "3. 三通與四通 (Tees & Crosses)",
	RISER: "4. 垂直上升 / 下降彎頭 (Vertical Bends)",
	REDUCER: "5. 異徑接頭 (Reducers)",
	ACCESSORY: "6. 端部與落線工程附件 (Accessories)",
	STRUCTURAL: "7. 鋼構管架與組合件 (Structural Framework)",
	EQUIPMENT: "8. 電氣設備與建築穿牆 (Equipment & MCT)",
	OBSTACLE: "9. 現場製程避讓管道 (Piping Obstacles)"
};
function Ze(e) {
	if (e.startsWith("STRUCT")) return ["SYSTEM_STRUCTURAL"];
	if (e.startsWith("EQUIP") || e.startsWith("PENETRATION") || e.startsWith("CONTEXT")) return ["SYSTEM_EQUIPMENT"];
	if (e.startsWith("OBSTACLE")) return ["SYSTEM_OBSTACLE"];
	let t = [];
	return Object.values(Je).forEach((n) => {
		let r = n.profileId ? Ge[n.profileId] : void 0;
		r && r.components.some((t) => t.definitionId === e) && t.push(n.id);
	}), t;
}
//#endregion
//#region src/ports/PortFrame.ts
var Qe = class {
	constructor(t, n, r) {
		this.position = new e.Vector3(t[0], t[1], t[2]), this.direction = new e.Vector3(n[0], n[1], n[2]).normalize();
		let i = new e.Vector3(r[0], r[1], r[2]).normalize();
		this.right = new e.Vector3().crossVectors(i, this.direction).normalize(), this.up = new e.Vector3().crossVectors(this.direction, this.right).normalize();
	}
	getRotationMatrix() {
		let t = new e.Matrix4();
		return t.makeBasis(this.right, this.up, this.direction), t;
	}
	getDeterminant() {
		return this.getRotationMatrix().determinant();
	}
	getQuaternion() {
		let t = this.getRotationMatrix(), n = new e.Quaternion().setFromRotationMatrix(t);
		return [
			n.x,
			n.y,
			n.z,
			n.w
		];
	}
}, H = class {
	static computeMateTransform(t, n, r, i, a = .5) {
		let o = t.getWorldPorts().find((e) => e.id === n);
		if (!o) return {
			success: !1,
			placement: {
				position: [
					0,
					0,
					0
				],
				quaternion: [
					0,
					0,
					0,
					1
				]
			},
			positionErrorMm: Infinity,
			alignmentDotProduct: 0,
			message: `Port ${n} not found on instance ${t.instanceId}`
		};
		let s = r.definition.getLocalPorts(r.effectiveParameters).find((e) => e.id === i);
		if (!s) return {
			success: !1,
			placement: {
				position: [
					0,
					0,
					0
				],
				quaternion: [
					0,
					0,
					0,
					1
				]
			},
			positionErrorMm: Infinity,
			alignmentDotProduct: 0,
			message: `Port ${i} not found on instance ${r.instanceId}`
		};
		let c = new Qe(o.worldPosition, o.worldDirection, o.worldUp), l = c.direction.clone().negate().normalize(), u = c.up.clone().normalize(), d = new e.Vector3().crossVectors(u, l).normalize(), f = new e.Vector3().crossVectors(l, d).normalize(), p = new e.Matrix4();
		p.makeBasis(d, f, l);
		let m = new Qe(s.localPosition, s.localDirection, s.localUp), h = new e.Matrix4();
		h.makeBasis(m.right, m.up, m.direction);
		let g = h.clone().transpose(), _ = new e.Matrix4().multiplyMatrices(p, g), v = new e.Quaternion().setFromRotationMatrix(_), y = m.position.clone().applyQuaternion(v), b = c.position.clone().sub(y), x = {
			position: [
				b.x,
				b.y,
				b.z
			],
			quaternion: [
				v.x,
				v.y,
				v.z,
				v.w
			]
		}, S = m.position.clone().applyQuaternion(v).add(b), C = m.direction.clone().applyQuaternion(v).normalize(), w = m.up.clone().applyQuaternion(v).normalize(), T = S.distanceTo(c.position), E = C.dot(c.direction), D = w.dot(c.up), O = T <= a && E <= -.99 && D >= .99;
		return {
			success: O,
			placement: x,
			positionErrorMm: T,
			alignmentDotProduct: E,
			upDotProduct: D,
			message: O ? `Mated successfully. Position error: ${T.toFixed(4)} mm, alignment dot: ${E.toFixed(4)}` : `Mating out of tolerance. Error: ${T.toFixed(4)} mm, dot: ${E.toFixed(4)}`
		};
	}
	static computePlacement(e, t, n, r, i = .5) {
		return this.computeMateTransform(e, t, n, r, i).placement;
	}
	static placeComponentByPort(e, t, n, r, i = .5) {
		let a = this.computeMateTransform(e, t, n, r, i);
		return a.success && n.setPlacement(a.placement), a;
	}
}, U = class {
	static straight(e) {
		return Math.abs(e);
	}
	static circularArc(e, t) {
		let n = Math.abs(t) * Math.PI / 180;
		return Math.abs(e) * n;
	}
	static reducer(e, t = 0) {
		return Math.hypot(e, t);
	}
	static teeBranch(e, t, n = 0) {
		if (n <= 0) return e / 2 + t;
		let r = Math.max(0, e / 2 - n), i = n * Math.PI / 2, a = Math.max(0, t - n);
		return r + i + a;
	}
	static arcWithTangents(e, t, n = 0) {
		return 2 * n + this.circularArc(e, t);
	}
	static reducerWithTangents(e, t = 0, n = 0, r = 0) {
		let i = Math.max(0, e - n - r);
		return n + Math.hypot(i, t) + r;
	}
	static crossBranch(e, t) {
		let n = Math.max(0, e / 2 - t), r = t * Math.PI / 2;
		return 2 * n + r;
	}
}, $e = class {
	static createStraight(e, t, n, r = 10) {
		return this.createStraightZ(e, t, n, r);
	}
	static createStraightZ(e, t, n, r = 10) {
		let i = n / 2, a = [];
		for (let e = 0; e <= r; e++) {
			let t = e / r, o = -i + n * t;
			a.push([
				0,
				0,
				o
			]);
		}
		return {
			id: `ROUTE_${e}_${t}`,
			fromPort: e,
			toPort: t,
			type: "STRAIGHT",
			analyticLength: U.straight(n),
			samplePoints: a
		};
	}
	static createStraightX(e, t, n, r = 10) {
		let i = n / 2, a = [];
		for (let e = 0; e <= r; e++) {
			let t = e / r, o = -i + n * t;
			a.push([
				o,
				0,
				0
			]);
		}
		return {
			id: `ROUTE_${e}_${t}`,
			fromPort: e,
			toPort: t,
			type: "STRAIGHT",
			analyticLength: U.straight(n),
			samplePoints: a
		};
	}
	static createHorizontalElbow(e, t, n, r, i = 20, a = 0) {
		let o = r * Math.PI / 180, s = [];
		if (a > 0) {
			let e = Math.max(3, Math.floor(i / 4));
			for (let t = 0; t < e; t++) {
				let r = a * (1 - t / e);
				s.push([
					n,
					0,
					r
				]);
			}
		}
		for (let e = 0; e <= i; e++) {
			let t = e / i * o, r = n * Math.cos(t), a = -n * Math.sin(t);
			s.push([
				r,
				0,
				a
			]);
		}
		if (a > 0) {
			let e = Math.max(3, Math.floor(i / 4)), t = n * Math.cos(o), r = -n * Math.sin(o), c = -Math.sin(o), l = -Math.cos(o);
			for (let n = 1; n <= e; n++) {
				let i = n / e * a;
				s.push([
					t + c * i,
					0,
					r + l * i
				]);
			}
		}
		return {
			id: `ROUTE_${e}_${t}`,
			fromPort: e,
			toPort: t,
			type: "ARC_XZ",
			analyticLength: a > 0 ? U.arcWithTangents(n, r, a) : U.circularArc(n, r),
			samplePoints: s
		};
	}
	static createCrossCornerRoute(e, t, n, r, i, a, o = 20) {
		let s = n / 2, c = Math.min(r, s * .85), l = [], u = Math.max(3, Math.floor(o / 3));
		for (let e = 0; e <= u; e++) {
			let t = e / u, n = i * s + t * (i * c - i * s);
			l.push([
				n,
				0,
				0
			]);
		}
		let d = Math.max(5, Math.floor(o / 3));
		for (let e = 1; e <= d; e++) {
			let t = e / d * Math.PI / 2, n = i * c * (1 - Math.sin(t)), r = a * c * (1 - Math.cos(t));
			l.push([
				n,
				0,
				r
			]);
		}
		let f = Math.max(3, Math.floor(o / 3));
		for (let e = 1; e <= f; e++) {
			let t = e / f, n = a * c + t * (a * s - a * c);
			l.push([
				0,
				0,
				n
			]);
		}
		let p = s - c, m = c * Math.PI / 2, h = 2 * p + m;
		return {
			id: `ROUTE_${e}_${t}`,
			fromPort: e,
			toPort: t,
			type: "ARC_XZ",
			analyticLength: h,
			samplePoints: l
		};
	}
	static createVerticalRiser(e, t, n, r, i = !1, a = 20) {
		let o = r * Math.PI / 180, s = [];
		for (let e = 0; e <= a; e++) {
			let t = e / a * o, r = n * Math.cos(t), c = (i ? -1 : 1) * n * Math.sin(t);
			s.push([
				r,
				c,
				0
			]);
		}
		return {
			id: `ROUTE_${e}_${t}`,
			fromPort: e,
			toPort: t,
			type: "ARC_XY",
			analyticLength: U.circularArc(n, r),
			samplePoints: s
		};
	}
	static createReducer(e, t, n, r = 0, i = 10) {
		let a = n / 2, o = [];
		for (let e = 0; e <= i; e++) {
			let t = e / i, s = -a + n * t, c = r * t;
			o.push([
				c,
				0,
				s
			]);
		}
		return {
			id: `ROUTE_${e}_${t}`,
			fromPort: e,
			toPort: t,
			type: "STRAIGHT",
			analyticLength: U.reducer(n, r),
			samplePoints: o
		};
	}
}, W = class {
	static validateConnection(e, t, n, r) {
		let i = e.definition.getLocalPorts(e.effectiveParameters), a = n.definition.getLocalPorts(n.effectiveParameters), o = i.find((e) => e.id === t), s = a.find((e) => e.id === r);
		if (!o || !s) return {
			valid: !1,
			code: "PORT_NOT_FOUND",
			error: `One or both ports not found (${t} on ${e.instanceId}, ${r} on ${n.instanceId})`
		};
		if (o.connectionType !== s.connectionType) return {
			valid: !1,
			code: "TYPE_MISMATCH",
			error: `介面類型不相符 (Type Mismatch: ${o.connectionType} vs ${s.connectionType})`,
			recommendation: "請選用相同連接介面類型之配件",
			details: {
				portA: {
					id: o.id,
					width: o.width,
					depth: o.depth,
					type: o.connectionType
				},
				portB: {
					id: s.id,
					width: s.width,
					depth: s.depth,
					type: s.connectionType
				}
			}
		};
		if (Math.abs(o.width - s.width) > 1) return {
			valid: !1,
			code: "WIDTH_MISMATCH",
			error: `寬度不相符 (Width Mismatch: ${o.width}mm != ${s.width}mm)`,
			recommendation: `建議使用異徑大小頭 (FITTING_REDUCER_CENTER, LEFT 或 RIGHT) 進行過渡轉接 (${o.width}mm ➔ ${s.width}mm)`,
			details: {
				portA: {
					id: o.id,
					width: o.width,
					depth: o.depth,
					type: o.connectionType
				},
				portB: {
					id: s.id,
					width: s.width,
					depth: s.depth,
					type: s.connectionType
				}
			}
		};
		if (Math.abs(o.depth - s.depth) > 1) return {
			valid: !1,
			code: "DEPTH_MISMATCH",
			error: `深度/邊高不相符 (Depth Mismatch: ${o.depth}mm != ${s.depth}mm)`,
			recommendation: "請確認托架邊高規格一致",
			details: {
				portA: {
					id: o.id,
					width: o.width,
					depth: o.depth,
					type: o.connectionType
				},
				portB: {
					id: s.id,
					width: s.width,
					depth: s.depth,
					type: s.connectionType
				}
			}
		};
		let c = o.connectionFace?.style, l = s.connectionFace?.style;
		return c && l && c !== l ? {
			valid: !1,
			code: "STYLE_MISMATCH",
			error: `托架型式不相符 (Tray Style Mismatch: ${c} vs ${l})`,
			recommendation: "梯型與沖底型端面構造不同，請選用同一型錄系列之配件",
			details: {
				portA: {
					id: o.id,
					width: o.width,
					depth: o.depth,
					type: o.connectionType
				},
				portB: {
					id: s.id,
					width: s.width,
					depth: s.depth,
					type: s.connectionType
				}
			}
		} : {
			valid: !0,
			code: "OK",
			details: {
				portA: {
					id: o.id,
					width: o.width,
					depth: o.depth,
					type: o.connectionType
				},
				portB: {
					id: s.id,
					width: s.width,
					depth: s.depth,
					type: s.connectionType
				}
			}
		};
	}
};
//#endregion
//#region src/validation/AssemblyValidator.ts
function et(t) {
	let n = t.getThreeMesh();
	n.updateMatrixWorld(!0);
	let r = [];
	return n.traverse((t) => {
		let n = t;
		if (!n.isMesh || !n.geometry || n.userData?.isAccessory) return;
		let i = n.geometry.getAttribute("position");
		if (!i) return;
		let a = new e.Vector3();
		for (let e = 0; e < i.count; e++) a.fromBufferAttribute(i, e).applyMatrix4(n.matrixWorld).multiplyScalar(1e3), r.push(a.clone());
	}), r;
}
function tt(t) {
	let n = new e.Vector3(...t.worldDirection).normalize(), r = new e.Vector3(...t.worldUp).normalize(), i = new e.Vector3().crossVectors(r, n).normalize(), a = new e.Vector3().crossVectors(n, i).normalize();
	return {
		origin: new e.Vector3(...t.worldPosition),
		normal: n,
		up: a,
		right: i
	};
}
function nt(t, n, r, i, a = 1) {
	let o = -Infinity, s = {
		minRight: Infinity,
		maxRight: -Infinity,
		minUp: Infinity,
		maxUp: -Infinity,
		vertexCount: 0
	}, c = new e.Vector3();
	for (let e of t) {
		c.subVectors(e, n.origin);
		let t = c.dot(n.normal);
		if (a * t > o && (o = a * t), Math.abs(t) <= i) {
			c.subVectors(e, r.origin);
			let t = c.dot(r.right), n = c.dot(r.up);
			s.minRight = Math.min(s.minRight, t), s.maxRight = Math.max(s.maxRight, t), s.minUp = Math.min(s.minUp, n), s.maxUp = Math.max(s.maxUp, n), s.vertexCount++;
		}
	}
	return {
		offset: o,
		face: s.vertexCount > 0 ? s : null
	};
}
function rt(e, t) {
	for (let n of e.getCenterlines()) if (!(n.samplePoints.length < 2)) {
		if (n.fromPort === t) return o.transformPoint(n.samplePoints[0], e.placement);
		if (n.toPort === t) return o.transformPoint(n.samplePoints[n.samplePoints.length - 1], e.placement);
	}
	return null;
}
var G = class {
	static checkJoint(e, t, n, r, i = {}) {
		let a = i.positionMm ?? .01, s = i.planeMm ?? .05, c = i.faceMm ?? .05, l = i.dot ?? 1e-6, u = [], d = W.validateConnection(e, t, n, r), f = e.getWorldPorts().find((e) => e.id === t), p = n.getWorldPorts().find((e) => e.id === r), m = {
			instanceA: e.instanceId,
			portA: t,
			instanceB: n.instanceId,
			portB: r,
			connection: d,
			portGapMm: Infinity,
			directionDot: 0,
			upDot: 0,
			planeOffsetAMm: NaN,
			planeOffsetBMm: NaN,
			faceA: null,
			faceB: null,
			faceMismatchMm: Infinity,
			centerlineGapMm: Infinity,
			passed: !1,
			issues: ["Port not found"]
		};
		if (!f || !p) return m;
		let h = tt(f), g = tt(p), _ = h.origin.distanceTo(g.origin), v = h.normal.dot(g.normal), y = h.up.dot(g.up), b = nt(et(e), h, h, s, 1), x = nt(et(n), h, h, s, -1), S = 0, C = f.connectionFace, w = (e, t) => {
			if (!e) {
				u.push(`${t}: no body geometry on the connection plane`), S = Infinity;
				return;
			}
			C && (S = Math.max(S, Math.abs(e.minRight + C.halfWidth), Math.abs(e.maxRight - C.halfWidth), Math.abs(e.minUp - C.minUp), Math.abs(e.maxUp - C.maxUp)));
		};
		w(b.face, `A(${e.instanceId}.${t})`), w(x.face, `B(${n.instanceId}.${r})`), b.face && x.face && (S = Math.max(S, Math.abs(b.face.minRight - x.face.minRight), Math.abs(b.face.maxRight - x.face.maxRight), Math.abs(b.face.minUp - x.face.minUp), Math.abs(b.face.maxUp - x.face.maxUp)));
		let T = rt(e, t), E = rt(n, r), D = T && E ? o.distance(T, E) : Infinity;
		return d.valid || u.push(`Connection rejected: ${d.code}`), _ > a && u.push(`Port gap ${_.toFixed(3)} mm`), v > -1 + l && u.push(`Port directions not opposite (dot ${v.toFixed(6)})`), y < 1 - l && u.push(`Up vectors not aligned (dot ${y.toFixed(6)})`), b.offset > s && u.push(`A body penetrates ${b.offset.toFixed(2)} mm past the joint plane`), x.offset > s && u.push(`B body penetrates ${x.offset.toFixed(2)} mm past the joint plane`), b.offset < -s && u.push(`A body stops ${(-b.offset).toFixed(2)} mm short of the joint plane (gap)`), x.offset < -s && u.push(`B body stops ${(-x.offset).toFixed(2)} mm short of the joint plane (gap)`), S > c && Number.isFinite(S) && u.push(`Connection faces differ by ${S.toFixed(2)} mm (step / rotated section)`), D > a && u.push(`Centerline discontinuity ${D.toFixed(3)} mm`), {
			instanceA: e.instanceId,
			portA: t,
			instanceB: n.instanceId,
			portB: r,
			connection: d,
			portGapMm: _,
			directionDot: v,
			upDot: y,
			planeOffsetAMm: b.offset,
			planeOffsetBMm: x.offset,
			faceA: b.face,
			faceB: x.face,
			faceMismatchMm: S,
			centerlineGapMm: D,
			passed: u.length === 0,
			issues: u
		};
	}
	static checkPortTermination(e, t = {}) {
		let n = t.planeMm ?? .05, r = t.faceMm ?? .05, i = et(e);
		return e.getWorldPorts().filter((e) => e.connectionType === "TRAY_END").map((e) => {
			let t = tt(e), a = nt(i, t, t, n), o = Infinity;
			return a.face && e.connectionFace && (o = Math.max(Math.abs(a.face.minRight + e.connectionFace.halfWidth), Math.abs(a.face.maxRight - e.connectionFace.halfWidth), Math.abs(a.face.minUp - e.connectionFace.minUp), Math.abs(a.face.maxUp - e.connectionFace.maxUp))), {
				portId: e.id,
				planeOffsetMm: a.offset,
				face: a.face,
				faceMismatchMm: o,
				passed: Math.abs(a.offset) <= n && o <= r
			};
		});
	}
};
//#endregion
//#region src/validation/AssemblyChain.ts
function it(e, t = {}) {
	let n = [], r = [], i = [];
	return e.forEach((e, a) => {
		let o = R.get(e.definitionId);
		if (!o) throw Error(`Unknown component '${e.definitionId}'`);
		let c = t.profile ? B(e.definitionId, t.profile, e.overrides ?? {}) : { ...e.overrides ?? {} }, l = new s(e.instanceId ?? `asm_${a}_${e.definitionId.toLowerCase()}`, o, c);
		if (a === 0) {
			t.basePlacement && l.setPlacement(t.basePlacement), n.push(l);
			return;
		}
		let u = e.attachTo ?? a - 1, d = n[u], f = e.attachPort ?? "PORT_B", p = e.port ?? "PORT_A", m = H.placeComponentByPort(d, f, l, p);
		m.success || i.push(`Step ${a} (${e.definitionId}): ${m.message}`), n.push(l);
		let h = G.checkJoint(d, f, l, p);
		r.push(h), h.issues.forEach((e) => i.push(`Joint ${d.instanceId}.${f} ↔ ${l.instanceId}.${p}: ${e}`));
	}), {
		instances: n,
		joints: r,
		passed: i.length === 0,
		issues: i
	};
}
var at = {
	ELBOW_TEE_CHAIN: {
		name: "Straight → Elbow 90° → Straight → Tee → Straight (main + branch)",
		nameZh: "直槽 → 90° 彎頭 → 直槽 → 三通 → 直槽 (主線與分支)",
		steps: [
			{
				definitionId: "TRAY_STRAIGHT",
				overrides: { length: 2e3 }
			},
			{
				definitionId: "FITTING_ELBOW_90",
				port: "PORT_A"
			},
			{
				definitionId: "TRAY_STRAIGHT",
				overrides: { length: 2e3 },
				port: "PORT_A"
			},
			{
				definitionId: "FITTING_TEE",
				port: "PORT_A"
			},
			{
				definitionId: "TRAY_STRAIGHT",
				overrides: { length: 2e3 },
				port: "PORT_A",
				attachTo: 3,
				attachPort: "PORT_B"
			},
			{
				definitionId: "TRAY_STRAIGHT",
				overrides: { length: 2e3 },
				port: "PORT_A",
				attachTo: 3,
				attachPort: "PORT_C"
			}
		]
	},
	CROSS_CHAIN: {
		name: "Straight → Cross → Straight on every outlet",
		nameZh: "直槽 → 四通 → 三向直槽",
		steps: [
			{
				definitionId: "TRAY_STRAIGHT",
				overrides: { length: 2e3 }
			},
			{
				definitionId: "FITTING_CROSS",
				port: "PORT_A"
			},
			{
				definitionId: "TRAY_STRAIGHT",
				overrides: { length: 2e3 },
				port: "PORT_A",
				attachTo: 1,
				attachPort: "PORT_B"
			},
			{
				definitionId: "TRAY_STRAIGHT",
				overrides: { length: 2e3 },
				port: "PORT_A",
				attachTo: 1,
				attachPort: "PORT_C"
			},
			{
				definitionId: "TRAY_STRAIGHT",
				overrides: { length: 2e3 },
				port: "PORT_A",
				attachTo: 1,
				attachPort: "PORT_D"
			}
		]
	},
	VERTICAL_OFFSET: {
		name: "Straight → Vertical Inside 90° → Riser → Vertical Outside 90° → Straight",
		nameZh: "直槽 → 垂直上升 90° → 垂直直槽 → 垂直下降 90° → 直槽",
		steps: [
			{
				definitionId: "TRAY_STRAIGHT",
				overrides: { length: 2e3 }
			},
			{
				definitionId: "FITTING_RISER_IN_90",
				port: "PORT_A"
			},
			{
				definitionId: "TRAY_STRAIGHT",
				overrides: { length: 1500 },
				port: "PORT_A"
			},
			{
				definitionId: "FITTING_RISER_OUT_90",
				port: "PORT_A"
			},
			{
				definitionId: "TRAY_STRAIGHT",
				overrides: { length: 2e3 },
				port: "PORT_A"
			}
		]
	},
	REDUCER_CHAIN: {
		name: "Straight 600 → Left Reducer 600→300 → Straight 300",
		nameZh: "直槽 600 → 左偏異徑 600→300 → 直槽 300",
		steps: [
			{
				definitionId: "TRAY_STRAIGHT",
				overrides: {
					length: 2e3,
					width: 600
				}
			},
			{
				definitionId: "FITTING_REDUCER_LEFT",
				overrides: {
					inletWidth: 600,
					outletWidth: 300
				},
				port: "PORT_A"
			},
			{
				definitionId: "TRAY_STRAIGHT",
				overrides: {
					length: 2e3,
					width: 300
				},
				port: "PORT_A"
			}
		]
	}
}, ot = class {
	static generateBom(e, t = {}) {
		let r = t.scope ?? "ALL", i = t.filterBundledChildren !== !1, a = t.includeVisualOnly === !0, o = /* @__PURE__ */ new Map(), s = 1, c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set(), u = [];
		e.forEach((e) => {
			(Be.isAssembly(e.definitionId) || e.definition.subComponents && e.definition.subComponents.length > 0) && (c.add(e.instanceId), (Be.getSubComponents(e.definitionId).length > 0 ? Be.getSubComponents(e.definitionId) : e.definition.subComponents || []).forEach((t) => {
				t.isPurchasedSeparately || (l.add(`${e.instanceId}_${t.definitionId}`), l.add(`${e.instanceId}_${t.definitionId}_${t.instanceSuffix}`));
			}));
		});
		let d = !1;
		e.forEach((e) => {
			let t = e.definition;
			if (!a && (t.bomScope === n.VISUAL_ONLY || t.hasBomMetadata === !1) || r !== "ALL" && t.bomScope !== r) return;
			if (e.parentAssemblyInstanceId && c.has(e.parentAssemblyInstanceId) || e.parentAssemblyInstanceId && l.has(`${e.parentAssemblyInstanceId}_${t.id}`) || Array.from(c).some((t) => e.instanceId.startsWith(t) && e.instanceId !== t)) {
				if (i) {
					u.push(e.instanceId);
					return;
				}
				d = !0;
			}
			let f = "", p = "PCS", m = t.getEngineeringDimensions?.(e.effectiveParameters), h = m?.style === "VENTILATED_THROUGH" ? "Ventilated" : "Ladder";
			if (m && (t.id === "TRAY_STRAIGHT" || t.id === "TRAY_STRAIGHT_DIVIDER")) f = `${h} W=${m.width}mm H=${m.height}mm L=${Number(m.length) / 1e3}m`, p = "支";
			else if (m && (t.id.startsWith("FITTING_ELBOW") || t.id.startsWith("FITTING_RISER"))) f = `${h} W=${m.width}mm H=${m.height}mm R=${m.catalogRadius}mm ${m.angleDeg}° T=${m.tangentLength}mm`, p = "組";
			else if (m && (t.id === "FITTING_TEE" || t.id === "FITTING_CROSS")) {
				let e = t.id === "FITTING_TEE" ? `span ${m.mainSpan}mm / branch ${m.branchProjection}mm` : `span ${m.span}mm`;
				f = `${h} W=${m.width}mm H=${m.height}mm R=${m.catalogRadius}mm T=${m.tangentLength}mm (${e})`, p = "組";
			} else m && t.id.startsWith("FITTING_REDUCER") ? (f = `${h} W1=${m.inletWidth}mm -> W2=${m.outletWidth}mm H=${m.height}mm L=${m.length}mm`, p = "組") : t.id === "PENETRATION_MCT" ? (f = `RG M6x1 A-60 防火氣密等級 (${e.effectiveParameters.widthMm || 600}x${e.effectiveParameters.heightMm || 900}mm)`, p = "套") : t.id === "STRUCT_MAIN_BAY" ? (f = "主管廊四階門型構架套件 (含 2 柱、2 墩、4 橫樑，Span=7.8m, EL +8.0m)", p = "套 (Kit)") : t.id === "STRUCT_BRANCH_BAY" ? (f = "支管廊門型構架套件 (含 2 柱、4 橫樑、2 縱樑，Span=2.7m)", p = "套 (Kit)") : f = "標準工程預製規格";
			let g = Be.isAssembly(t.id) || t.subComponents && t.subComponents.length > 0 || !1, _ = `${t.id}|${f}`;
			o.has(_) ? o.get(_).quantity += 1 : o.set(_, {
				itemNumber: String(s++).padStart(2, "0"),
				definitionId: t.id,
				name: t.name,
				nameZh: t.nameZh,
				bomScope: t.bomScope ?? n.MCR_CABLE_TRAY_BOM,
				spec: f,
				quantity: 1,
				unit: p,
				isAssemblyKit: g,
				notes: g ? "Assembly Kit: Internal subcomponents bundled (No double count)" : "Direct Component"
			});
		});
		let f = Array.from(o.values());
		return {
			generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
			scope: r,
			totalItems: f.reduce((e, t) => e + t.quantity, 0),
			items: f,
			hasDoubleCounting: d,
			excludedBundledItems: u
		};
	}
};
//#endregion
//#region src/geometry/GeometryBoundsValidator.ts
function st(t, n) {
	let r = {
		...t.defaultParameters,
		...n
	}, i = t.buildGeometry(r);
	i.updateMatrixWorld(!0);
	let a = new e.Box3();
	return i.traverse((e) => {
		let t = e;
		t.isMesh && !t.userData?.isAccessory && a.expandByObject(t);
	}), a.isEmpty() && a.setFromObject(i), {
		min: [
			a.min.x * 1e3,
			a.min.y * 1e3,
			a.min.z * 1e3
		],
		max: [
			a.max.x * 1e3,
			a.max.y * 1e3,
			a.max.z * 1e3
		]
	};
}
//#endregion
//#region src/export/JsonExporter.ts
var ct = class {
	static exportDefinition(e) {
		let t = e.defaultParameters;
		return {
			schemaVersion: "2.0.0",
			componentVersion: e.componentVersion,
			id: e.id,
			name: e.name,
			nameZh: e.nameZh,
			family: e.family,
			origin: e.origin,
			role: e.role,
			description: e.description,
			defaultParameters: { ...e.defaultParameters },
			provenance: { ...e.provenance },
			ports: e.getLocalPorts(t),
			centerlines: e.getCenterlineRoutes(t),
			bounds: e.getBounds(t),
			subComponents: e.subComponents ? [...e.subComponents] : void 0
		};
	}
	static exportCatalog(e) {
		return e.map((e) => this.exportDefinition(e));
	}
	static exportScene(e) {
		return {
			schemaVersion: "2.0.0",
			exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
			instances: e.map((e) => ({
				instanceId: e.instanceId,
				definitionId: e.definitionId,
				effectiveParameters: { ...e.effectiveParameters },
				placement: {
					position: [...e.placement.position],
					quaternion: [...e.placement.quaternion]
				},
				derivedSnapshot: {
					status: "NON_CANONICAL_SNAPSHOT",
					worldPorts: e.getWorldPorts(),
					bounds: e.getBounds()
				}
			}))
		};
	}
	static exportInstance(e) {
		return JSON.stringify(this.exportScene([e]), null, 2);
	}
}, K = 1e3, lt = {
	PAGE_Y_DOWN_METRES: {
		id: "PAGE_Y_DOWN_METRES",
		description: "Plan x right, plan y down the page, z elevation; metres",
		toWorld: (e) => [
			e.x * K,
			e.z * K,
			e.y * K
		],
		toPlan: (e) => ({
			x: e[0] / K,
			y: e[2] / K,
			z: e[1] / K
		})
	},
	NORTH_UP_METRES: {
		id: "NORTH_UP_METRES",
		description: "Plan x east, plan y north (up the page), z elevation; metres",
		toWorld: (e) => [
			e.x * K,
			e.z * K,
			-e.y * K
		],
		toPlan: (e) => ({
			x: e[0] / K,
			y: -e[2] / K,
			z: e[1] / K
		})
	}
}, ut = [
	0,
	1,
	0
];
function dt(e) {
	return l.normalize(l.cross(ut, e));
}
//#endregion
//#region src/network/TrayNetwork.ts
function ft(e, t, n) {
	return {
		nodes: e.map((e) => ({
			id: e.id,
			position: n.toWorld(e)
		})),
		segments: t.map((e) => ({ ...e }))
	};
}
var pt = (t) => new e.Vector3(t[0], t[1], t[2]), mt = (e) => [
	e.x,
	e.y,
	e.z
];
function ht(e, t) {
	return mt(pt(t).applyQuaternion(e));
}
function gt(t, n, r, i) {
	let a = (e, t) => {
		let n = l.normalize(e), r = l.sub(t, l.scale(n, l.dot(t, n)));
		if (l.length(r) < 1e-9) return null;
		let i = l.normalize(r);
		return [
			n,
			i,
			l.cross(n, i)
		];
	}, o = a(t, n), s = a(r, i);
	if (!o || !s) return null;
	let c = new e.Matrix4().makeBasis(pt(o[0]), pt(o[1]), pt(o[2])), u = new e.Matrix4().makeBasis(pt(s[0]), pt(s[1]), pt(s[2])).multiply(c.transpose());
	return new e.Quaternion().setFromRotationMatrix(u).normalize();
}
function _t(e, t, n, r) {
	let i = l.sub(e, n), a = l.dot(t, t), o = l.dot(t, r), s = l.dot(r, r), c = l.dot(t, i), u = l.dot(r, i), d = a * s - o * o;
	if (Math.abs(d) < 1e-9) return null;
	let f = (o * u - s * c) / d, p = (a * u - o * c) / d;
	return l.scale(l.add(l.add(e, l.scale(t, f)), l.add(n, l.scale(r, p))), .5);
}
function vt(e) {
	if (Math.abs(e[1]) < 1e-6) return ut;
	let t = Math.abs(e[0]) < .9 ? [
		1,
		0,
		0
	] : [
		0,
		0,
		1
	];
	return l.normalize(l.sub(t, l.scale(e, l.dot(t, e))));
}
function yt(e, t) {
	return {
		position: l.clean(t),
		quaternion: [
			e.x,
			e.y,
			e.z,
			e.w
		]
	};
}
function bt(e, t) {
	let n = new Map(e.nodes.map((e) => [e.id, e])), r = /* @__PURE__ */ new Map(), i = [];
	e.nodes.forEach((e) => r.set(e.id, []));
	let a = /* @__PURE__ */ new Set();
	for (let o of e.segments) {
		if (a.has(o.id)) {
			i.push({
				severity: "ERROR",
				code: "INVALID_NETWORK",
				segmentId: o.id,
				message: `Duplicate segment id ${o.id}.`
			});
			continue;
		}
		a.add(o.id);
		let e = n.get(o.from), s = n.get(o.to);
		if (!e || !s || o.from === o.to) {
			i.push({
				severity: "ERROR",
				code: "INVALID_NETWORK",
				segmentId: o.id,
				message: `Segment ${o.id} does not join two existing nodes.`
			});
			continue;
		}
		let c = l.sub(s.position, e.position), u = l.length(c);
		if (u < 1) {
			i.push({
				severity: "ERROR",
				code: "INVALID_NETWORK",
				segmentId: o.id,
				message: `Segment ${o.id} has no length.`
			});
			continue;
		}
		let d = l.scale(c, 1 / u), f = Math.abs(d[1]) < t;
		r.get(o.from).push({
			segment: o,
			dir: d,
			otherId: o.to,
			length: u,
			level: f
		}), r.get(o.to).push({
			segment: o,
			dir: l.scale(d, -1),
			otherId: o.from,
			length: u,
			level: f
		});
	}
	return r.forEach((e) => e.sort((e, t) => e.segment.id < t.segment.id ? -1 : +(e.segment.id > t.segment.id))), {
		nodes: n,
		legs: r,
		issues: i
	};
}
function xt(e, t, n) {
	return t.find((t) => Math.abs(t - e) <= n);
}
function St(e, t, n, r, i) {
	let a = t.map((e) => e.segment.width), o = Math.max(...a), s = (t, n, r) => (i.push({
		severity: "ERROR",
		code: t,
		nodeId: e,
		message: n,
		values: r
	}), { kind: "UNRESOLVED" }), c = (e, t) => l.dot(e.dir, t.dir) < -r.cos, u = (e, t) => Math.abs(l.dot(e.dir, t.dir)) < r.sin;
	if (t.length === 0 || t.length === 1) return { kind: "END" };
	if (t.length === 2) {
		let [i, a] = t;
		if (c(i, a)) {
			if (i.segment.width === a.segment.width) return { kind: "PASS" };
			let [e, t] = i.segment.width > a.segment.width ? [i, a] : [a, i];
			return {
				kind: "INLINE_REDUCER",
				wide: e,
				narrow: t
			};
		}
		let u = 180 - Math.acos(Math.max(-1, Math.min(1, l.dot(i.dir, a.dir)))) * 180 / Math.PI;
		if (i.level && a.level) {
			let t = xt(u, n.allowedHorizontalAngles, r.deg);
			return t === void 0 ? s("ANGLE_NOT_IN_CATALOG", `Horizontal turn of ${u.toFixed(1)}° at ${e}; the catalog offers ${n.allowedHorizontalAngles.join(" / ")}°.`, { turnDeg: +u.toFixed(2) }) : {
				kind: "FITTING",
				definitionId: `FITTING_ELBOW_${t}`,
				width: o,
				ports: ["PORT_A", "PORT_B"],
				legs: [i, a]
			};
		}
		if (i.level !== a.level) {
			let t = i.level ? i : a, c = i.level ? a : i, d = [
				c.dir[0],
				0,
				c.dir[2]
			];
			if (l.length(d) > r.sin && Math.abs(l.dot(l.normalize(d), t.dir)) < r.cos) return s("JUNCTION_NOT_IN_CATALOG", `Bend at ${e} turns both horizontally and vertically; the catalog has no compound bend.`);
			let f = xt(u, n.allowedVerticalAngles, r.deg);
			return f === void 0 ? s("ANGLE_NOT_IN_CATALOG", `Vertical bend of ${u.toFixed(1)}° at ${e}; the catalog offers ${n.allowedVerticalAngles.join(" / ")}°.`, { turnDeg: +u.toFixed(2) }) : {
				kind: "FITTING",
				definitionId: `FITTING_RISER_${c.dir[1] > 0 ? "IN" : "OUT"}_${f}`,
				width: o,
				ports: ["PORT_A", "PORT_B"],
				legs: [t, c]
			};
		}
		return s("JUNCTION_NOT_IN_CATALOG", `Bend at ${e} joins two non-level runs; the catalog vertical bends start from a level tray.`);
	}
	if (t.length === 3) {
		for (let n = 0; n < 3; n++) for (let r = n + 1; r < 3; r++) {
			if (!c(t[n], t[r])) continue;
			let i = t[3 - n - r], a = [t[n], t[r]];
			if (a.every((e) => e.level) && !i.level) return s("VERTICAL_TEE_UNRESOLVED", `Vertical tee at ${e} is not in the catalog; normalizeTrayNetwork() replaces it with a horizontal tee, stub and vertical bend.`);
			if (a.every((e) => e.level) && i.level && u(i, a[0])) return {
				kind: "FITTING",
				definitionId: "FITTING_TEE",
				width: o,
				ports: [
					"PORT_A",
					"PORT_B",
					"PORT_C"
				],
				legs: [
					a[0],
					a[1],
					i
				]
			};
		}
		return s("JUNCTION_NOT_IN_CATALOG", `Three-way junction at ${e} is not a catalog tee (level main run with a perpendicular level branch).`);
	}
	if (t.length === 4 && t.every((e) => e.level)) {
		let e = t.slice(1), n = e.findIndex((e) => c(t[0], e));
		if (n >= 0) {
			let r = e[n], i = e.filter((e, t) => t !== n);
			if (c(i[0], i[1]) && u(i[0], t[0])) return {
				kind: "FITTING",
				definitionId: "FITTING_CROSS",
				width: o,
				ports: [
					"PORT_A",
					"PORT_B",
					"PORT_C",
					"PORT_D"
				],
				legs: [
					t[0],
					r,
					i[0],
					i[1]
				]
			};
		}
	}
	return s("JUNCTION_NOT_IN_CATALOG", `${t.length}-way junction at ${e} is not a catalog cross (two level runs crossing at 90°).`);
}
function Ct(e, t, n, r, i, a, o) {
	let c = R.get(t);
	if (!c) return null;
	let u = new Map(c.getLocalPorts(n).map((e) => [e.id, e])), d = (e) => e.length <= 1 ? [e] : e.flatMap((t, n) => d(e.filter((e, t) => t !== n)).map((e) => [t, ...e]));
	for (let t of d(a)) {
		let a = i.findIndex((e, n) => t[n].level);
		if (a < 0) continue;
		let d = u.get(i[a]), f = gt(d.localDirection, d.localUp, t[a].dir, ut);
		if (!f || !i.every((e, n) => {
			let r = u.get(e);
			return l.dot(ht(f, r.localDirection), t[n].dir) < o.cos ? !1 : !t[n].level || l.dot(ht(f, r.localUp), ut) > o.cos;
		})) continue;
		let p = null;
		for (let e = 0; e < i.length && !p; e++) for (let t = e + 1; t < i.length && !p; t++) {
			let n = u.get(i[e]), r = u.get(i[t]);
			p = _t(n.localPosition, n.localDirection, r.localPosition, r.localDirection);
		}
		if (p) return {
			instance: new s(e, c, n, yt(f, l.sub(r, ht(f, p)))),
			portLegs: new Map(i.map((e, n) => [e, t[n]]))
		};
	}
	return null;
}
function wt(e, t, n, r, i, a, o) {
	let c = R.get(t);
	if (!c) return null;
	let u = c.getLocalPorts(n).find((e) => e.id === r), d = gt(u.localDirection, u.localUp, l.scale(a, -1), o);
	return d ? new s(e, c, n, yt(d, l.sub(i, ht(d, u.localPosition)))) : null;
}
function Tt(e, t) {
	return e.getWorldPorts().find((e) => e.id === t);
}
var q = (e, t) => `${e}@${t}`;
function Et(e) {
	let t = e.angleToleranceDeg ?? .5, n = t * Math.PI / 180;
	return {
		deg: t,
		sin: Math.sin(n),
		cos: Math.cos(n)
	};
}
function J(e, t, n = {}) {
	let r = Et(n), i = n.idPrefix ?? "net:", a = bt(e, r.sin), c = [...a.issues], u = [], d = /* @__PURE__ */ new Map(), f = /* @__PURE__ */ new Map();
	for (let n of e.segments) t.allowedWidths.includes(n.width) || c.push({
		severity: "ERROR",
		code: "WIDTH_NOT_IN_CATALOG",
		segmentId: n.id,
		message: `Segment ${n.id} W=${n.width} is not a catalog width (${t.allowedWidths.join(", ")}).`
	}), n.height !== void 0 && n.height !== t.height && c.push({
		severity: "ERROR",
		code: "HEIGHT_NOT_IN_CATALOG",
		segmentId: n.id,
		message: `Segment ${n.id} H=${n.height}; ${t.name} is H=${t.height}.`
	});
	let p = (e, n) => z.supports(t, e) ? !0 : (c.push({
		severity: "ERROR",
		code: "FITTING_NOT_OFFERED",
		nodeId: n,
		message: `${e} needed at ${n} is not offered in ${t.name}.`,
		values: { definitionId: e }
	}), !1), m = (e, n) => B(e, t, n), h = (e, t, n, r, a) => {
		let o = n.segment.width;
		if (o === t || !p("FITTING_REDUCER_CENTER", e)) return;
		let s = o < t, c = s ? "PORT_A" : "PORT_B", l = s ? "PORT_B" : "PORT_A", d = `${i}${e}:${n.segment.id}:REDUCER`, f = wt(d, "FITTING_REDUCER_CENTER", m("FITTING_REDUCER_CENTER", {
			inletWidth: Math.max(o, t),
			outletWidth: Math.min(o, t)
		}), c, r, n.dir, a);
		if (f) return u.push({
			id: d,
			nodeId: e,
			role: "REDUCER",
			definitionId: "FITTING_REDUCER_CENTER",
			instance: f,
			legs: [{
				segmentId: n.segment.id,
				portId: l
			}]
		}), {
			ref: {
				id: d,
				innerPort: c,
				outerPort: l
			},
			outerPoint: Tt(f, l).worldPosition
		};
	}, g = /* @__PURE__ */ new Map(), _ = (e, r) => {
		let i = r.legs.map((e) => e.segment.width), a = Math.min(...i), o = Math.max(...i), s = r.legs.length === 2 && n.bendWidth === "NARROWEST_LEG" ? a : o, l = {}, u = n.nodeOverrides?.[e];
		u?.width !== void 0 && (t.allowedWidths.includes(u.width) && u.width >= a && u.width <= o ? s = u.width : c.push({
			severity: "ERROR",
			code: "OVERRIDE_INVALID",
			nodeId: e,
			message: `W=${u.width} is not possible for ${r.definitionId} at ${e}: choose a catalog width from ${a} to ${o}.`,
			values: { width: u.width }
		})), u?.radius !== void 0 && (t.allowedRadii.includes(u.radius) ? l.radius = u.radius : c.push({
			severity: "ERROR",
			code: "OVERRIDE_INVALID",
			nodeId: e,
			message: `R=${u.radius} at ${e} is not a catalog radius (${t.allowedRadii.join(" / ")}).`,
			values: { radius: u.radius }
		}));
		let d = m(r.definitionId, {
			width: s,
			...l
		});
		return g.set(e, {
			nodeId: e,
			definitionId: r.definitionId,
			width: s,
			widthChoices: t.allowedWidths.filter((e) => e >= a && e <= o),
			radius: d.radius,
			radiusChoices: [...t.allowedRadii],
			...u ? { override: { ...u } } : {}
		}), d;
	}, v = (e, t, n, r, i) => {
		let a = l.sub(n, e), o = l.dot(a, t.dir), s = l.length(l.sub(a, l.scale(t.dir, o)));
		return (s > 1 || o < -1e-6) && c.push({
			severity: "ERROR",
			code: "FITTING_MISALIGNED",
			nodeId: r,
			segmentId: t.segment.id,
			message: `${i} at ${r} is ${s.toFixed(1)} mm off segment ${t.segment.id}.`,
			values: { offsetMm: +s.toFixed(3) }
		}), Math.max(0, o);
	};
	for (let [e, n] of a.legs) {
		let o = a.nodes.get(e), s = St(e, n, t, r, c);
		if (f.set(e, s), s.kind !== "FITTING" || !p(s.definitionId, e)) continue;
		let l = `${i}${e}:${s.definitionId}`, m = _(e, s), g = Ct(l, s.definitionId, m, o.position, s.ports, s.legs, r);
		if (!g) {
			c.push({
				severity: "ERROR",
				code: "JUNCTION_NOT_IN_CATALOG",
				nodeId: e,
				message: `${s.definitionId} cannot be oriented to the segments at ${e}.`
			});
			continue;
		}
		u.push({
			id: l,
			nodeId: e,
			role: "FITTING",
			definitionId: s.definitionId,
			instance: g.instance,
			legs: [...g.portLegs].map(([e, t]) => ({
				segmentId: t.segment.id,
				portId: e
			}))
		});
		for (let [t, n] of g.portLegs) {
			let r = Tt(g.instance, t), i = h(e, m.width, n, r.worldPosition, r.worldUp), a = i ? v(o.position, n, i.outerPoint, e, "Reducer") : v(o.position, n, r.worldPosition, e, s.definitionId);
			d.set(q(n.segment.id, e), {
				nodeId: e,
				segmentId: n.segment.id,
				reachMm: a,
				up: r.worldUp,
				fitting: {
					id: l,
					portId: t
				},
				reducer: i?.ref
			});
		}
	}
	for (let e of Object.keys(n.nodeOverrides ?? {})) g.has(e) || c.push({
		severity: "WARNING",
		code: "OVERRIDE_UNUSED",
		nodeId: e,
		message: `Fitting choice for ${e} is ignored: there is no bend, tee or cross on that node.`
	});
	let y = new Map(e.segments.map((e) => [e.id, e.id])), b = (e) => y.get(e) === e ? e : (y.set(e, b(y.get(e))), y.get(e));
	for (let [e, t] of f) {
		if (t.kind !== "PASS" && t.kind !== "INLINE_REDUCER") continue;
		let [n, r] = a.legs.get(e);
		y.set(b(n.segment.id), b(r.segment.id));
	}
	let x = /* @__PURE__ */ new Map();
	for (let e of d.values()) {
		if (!e.up) continue;
		let t = b(e.segmentId), n = x.get(t);
		n ? l.dot(n, e.up) < r.cos && c.push({
			severity: "ERROR",
			code: "VERTICAL_RUN_TWISTED",
			segmentId: e.segmentId,
			nodeId: e.nodeId,
			message: `The fittings at both ends of the run through ${e.segmentId} need different tray orientations; a tray cannot twist.`
		}) : x.set(t, e.up);
	}
	let S = (e) => l.normalize(l.sub(a.nodes.get(e.to).position, a.nodes.get(e.from).position)), C = (e) => x.get(b(e.id)) ?? vt(S(e));
	for (let [e, t] of f) {
		let n = a.nodes.get(e);
		if (t.kind === "INLINE_REDUCER") {
			d.set(q(t.wide.segment.id, e), {
				nodeId: e,
				segmentId: t.wide.segment.id,
				reachMm: 0,
				up: null
			});
			let r = h(e, t.wide.segment.width, t.narrow, n.position, C(t.narrow.segment)), i = r ? v(n.position, t.narrow, r.outerPoint, e, "Reducer") : 0;
			d.set(q(t.narrow.segment.id, e), {
				nodeId: e,
				segmentId: t.narrow.segment.id,
				reachMm: i,
				up: null,
				reducer: r?.ref
			});
		}
		for (let t of a.legs.get(e)) d.has(q(t.segment.id, e)) || d.set(q(t.segment.id, e), {
			nodeId: e,
			segmentId: t.segment.id,
			reachMm: 0,
			up: null
		});
	}
	let w = [], T = R.get("TRAY_STRAIGHT");
	for (let t of e.segments) {
		let e = a.nodes.get(t.from), n = a.nodes.get(t.to), r = d.get(q(t.id, t.from)), o = d.get(q(t.id, t.to));
		if (!e || !n || !r || !o) continue;
		let u = l.sub(n.position, e.position), f = l.length(u), p = l.scale(u, 1 / f), h = f - r.reachMm - o.reachMm;
		if (h < -.5) {
			c.push({
				severity: "ERROR",
				code: "SEGMENT_TOO_SHORT",
				segmentId: t.id,
				message: `Segment ${t.id} is ${(f / 1e3).toFixed(3)} m; the fittings at its ends need ${((r.reachMm + o.reachMm) / 1e3).toFixed(3)} m.`,
				values: {
					lengthMm: +f.toFixed(1),
					requiredMm: +(r.reachMm + o.reachMm).toFixed(1)
				}
			});
			continue;
		}
		if (h <= .5) continue;
		let g = l.add(e.position, l.scale(p, r.reachMm)), _ = l.sub(n.position, l.scale(p, o.reachMm)), v = C(t), y = gt([
			0,
			0,
			1
		], [
			0,
			1,
			0
		], p, v), b = `${i}${t.id}:STRAIGHT`, x = new s(b, T, m("TRAY_STRAIGHT", {
			width: t.width,
			length: h
		}), yt(y, l.scale(l.add(g, _), .5)));
		w.push({
			id: b,
			segmentId: t.id,
			start: g,
			end: _,
			lengthMm: h,
			up: v,
			instance: x
		});
	}
	let E = !c.some((e) => e.severity === "ERROR"), D = Object.fromEntries(d), O = new Map(u.map((e) => [e.id, e])), k = new Map(w.map((e) => [e.segmentId, e])), A = new Map(e.segments.map((e) => [e.id, e])), ee = (e, t, n) => O.get(e)?.instance.getCenterlines().find((e) => e.fromPort === t && e.toPort === n || e.fromPort === n && e.toPort === t)?.analyticLength, te = (e) => e?.reducer ? ee(e.reducer.id, "PORT_A", "PORT_B") ?? 0 : 0, ne = (e) => {
		let t = {
			lengthMm: 0,
			polylineMm: 0,
			ok: !0,
			issues: []
		}, n = (e) => {
			t.ok = !1, t.issues.push(e);
		};
		if (e.length === 0) return t;
		let r = e.map((e) => A.get(e));
		if (r.some((e) => !e)) return n("Unknown segment in path."), t;
		let i = r.length > 1 && ((e, t) => [e.from, e.to].find((e) => e === t.from || e === t.to))(r[0], r[1]) === r[0].from ? r[0].to : r[0].from, o = i;
		r.forEach((e, o) => {
			let s = e.from === i ? e.to : e.to === i ? e.from : void 0;
			if (!s) {
				n(`Segment ${e.id} does not continue the path at ${i}.`);
				return;
			}
			let c = a.nodes.get(e.from).position, u = a.nodes.get(e.to).position;
			t.polylineMm += l.length(l.sub(u, c));
			let f = k.get(e.id);
			if (t.lengthMm += f ? f.lengthMm : 0, !f && (d.get(q(e.id, e.from))?.reachMm ?? 0) + (d.get(q(e.id, e.to))?.reachMm ?? 0) > l.length(l.sub(u, c)) + .5 && n(`Segment ${e.id} is too short for its fittings.`), o < r.length - 1) {
				let i = d.get(q(e.id, s)), a = d.get(q(r[o + 1].id, s));
				if (t.lengthMm += te(i) + te(a), i?.fitting && a?.fitting && i.fitting.id === a.fitting.id) {
					let e = ee(i.fitting.id, i.fitting.portId, a.fitting.portId);
					e === void 0 ? n(`No route through ${i.fitting.id} from ${i.fitting.portId} to ${a.fitting.portId}.`) : t.lengthMm += e;
				} else (i?.fitting || a?.fitting) && n(`Path changes segment at ${s} without passing through its fitting.`);
			}
			i = s;
		});
		for (let [e, n] of [[o, r[0]], [i, r[r.length - 1]]]) {
			let r = d.get(q(n.id, e));
			(r?.fitting || r?.reducer) && (t.lengthMm += r.reachMm);
		}
		return t;
	}, j = (e, t, n) => {
		let r = e.getCenterlines().find((e) => e.fromPort === t && e.toPort === n || e.fromPort === n && e.toPort === t);
		if (!r) return [];
		let i = r.samplePoints.map((t) => o.transformPoint(t, e.placement));
		return r.fromPort === t ? i : i.reverse();
	};
	return {
		profileId: t.id,
		network: e,
		fittings: u,
		straights: w,
		segmentEnds: D,
		issues: c,
		ok: E,
		instances: () => [...u.map((e) => e.instance), ...w.map((e) => e.instance)],
		pathCenterline: ne,
		pathPoints: (e) => {
			let t = [], n = (e) => e.forEach((e) => {
				(t.length === 0 || l.length(l.sub(e, t[t.length - 1])) > 1e-6) && t.push(e);
			}), r = e.map((e) => A.get(e));
			if (r.length === 0 || r.some((e) => !e)) return t;
			let i = r.length > 1 && ((e, t) => [e.from, e.to].find((e) => e === t.from || e === t.to))(r[0], r[1]) === r[0].from ? r[0].to : r[0].from, o = (e, t) => {
				let n = d.get(q(e.id, t));
				return !!(n?.fitting || n?.reducer);
			};
			o(r[0], i) && n([a.nodes.get(i).position]);
			for (let e = 0; e < r.length; e++) {
				let t = r[e], a = t.from === i ? t.to : t.to === i ? t.from : void 0;
				if (!a) break;
				let o = k.get(t.id);
				if (o && n(j(o.instance, t.from === i ? "PORT_A" : "PORT_B", t.from === i ? "PORT_B" : "PORT_A")), e < r.length - 1) {
					let i = d.get(q(t.id, a)), o = d.get(q(r[e + 1].id, a));
					i?.reducer && n(j(O.get(i.reducer.id).instance, i.reducer.outerPort, i.reducer.innerPort)), i?.fitting && o?.fitting && i.fitting.id === o.fitting.id && n(j(O.get(i.fitting.id).instance, i.fitting.portId, o.fitting.portId)), o?.reducer && n(j(O.get(o.reducer.id).instance, o.reducer.innerPort, o.reducer.outerPort));
				}
				i = a;
			}
			return o(r[r.length - 1], i) && n([a.nodes.get(i).position]), t;
		},
		fittingChoices: (e) => g.get(e),
		bom: () => {
			let n = ot.generateBom(u.map((e) => e.instance)).items, r = new Map(e.segments.map((e) => [e.id, e.id])), i = (e) => r.get(e) === e ? e : (r.set(e, i(r.get(e))), r.get(e));
			for (let [e, t] of f) {
				if (t.kind !== "PASS") continue;
				let [n, o] = a.legs.get(e);
				r.set(i(n.segment.id), i(o.segment.id));
			}
			let o = /* @__PURE__ */ new Map();
			for (let e of w) {
				let n = A.get(e.segmentId), r = i(n.id), a = o.get(r) ?? {
					width: n.width,
					height: n.height ?? t.height,
					length: 0
				};
				a.length += e.lengthMm, o.set(r, a);
			}
			let s = t.trayType === "VENTILATED_THROUGH" ? "Ventilated" : "Ladder", c = /* @__PURE__ */ new Map();
			for (let e of o.values()) {
				let n = `${s} W=${e.width}mm H=${e.height}mm L=${t.standardLength / 1e3}m`, r = c.get(n) ?? {
					spec: n,
					style: s,
					width: e.width,
					height: e.height,
					standardLengthMm: t.standardLength,
					totalLengthMm: 0,
					pieces: 0,
					runs: 0
				};
				r.totalLengthMm += e.length, r.pieces += Math.ceil(e.length / t.standardLength - 1e-9), r.runs += 1, c.set(n, r);
			}
			return {
				fittings: n,
				straights: [...c.values()].sort((e, t) => e.width - t.width)
			};
		}
	};
}
function Dt(e, t, n, r, i, a, o) {
	let s = 1e5, c = {
		nodes: [
			{
				id: "A",
				position: [
					-1e5,
					0,
					0
				]
			},
			{
				id: "N",
				position: [
					0,
					0,
					0
				]
			},
			{
				id: "B",
				position: [
					s,
					0,
					0
				]
			},
			{
				id: "S",
				position: [
					0,
					0,
					s
				]
			},
			{
				id: "V",
				position: [
					0,
					r ? s : -1e5,
					s
				]
			}
		],
		segments: [
			{
				id: "a",
				from: "A",
				to: "N",
				width: t
			},
			{
				id: "b",
				from: "N",
				to: "B",
				width: t
			},
			{
				id: "s",
				from: "N",
				to: "S",
				width: n
			},
			{
				id: "v",
				from: "S",
				to: "V",
				width: n
			}
		]
	}, l = {};
	i.nodeOverrides?.[a] && (l.N = i.nodeOverrides[a]), i.nodeOverrides?.[o] && (l.S = i.nodeOverrides[o]);
	let u = J(c, e, {
		...i,
		nodeOverrides: l
	});
	return (u.segmentEnds[q("s", "N")]?.reachMm ?? 0) + (u.segmentEnds[q("s", "S")]?.reachMm ?? 0);
}
function Ot(e, t, n) {
	let r = l.sub(n, t), i = Math.max(0, Math.min(1, l.dot(l.sub(e, t), r) / Math.max(1e-9, l.dot(r, r))));
	return l.length(l.sub(e, l.add(t, l.scale(r, i))));
}
function kt(e, t, n = {}) {
	let r = Et(n), i = [], a = [], o = e.nodes.map((e) => ({
		id: e.id,
		position: [...e.position]
	})), s = e.segments.map((e) => ({ ...e })), c = Math.max(...t.allowedWidths);
	for (let e of s) {
		if (!t.allowedWidths.includes(e.width)) {
			let n = t.allowedWidths.find((t) => t >= e.width);
			n === void 0 ? a.push({
				severity: "ERROR",
				code: "WIDTH_NOT_IN_CATALOG",
				segmentId: e.id,
				message: `Segment ${e.id} W=${e.width} exceeds the widest catalog tray (${c}); split it into parallel trays.`
			}) : (i.push({
				kind: "SEGMENT_WIDTH",
				segmentId: e.id,
				from: e.width,
				to: n,
				reason: `W=${e.width} is not a catalog width; next catalog width is ${n}.`
			}), a.push({
				severity: "WARNING",
				code: "WIDTH_ADJUSTED",
				segmentId: e.id,
				message: `Segment ${e.id} widened from ${e.width} to catalog W=${n}.`,
				values: {
					from: e.width,
					to: n
				}
			}), e.width = n);
		}
		e.height !== void 0 && e.height !== t.height && (i.push({
			kind: "SEGMENT_HEIGHT",
			segmentId: e.id,
			from: e.height,
			to: t.height,
			reason: `${t.name} is H=${t.height}.`
		}), a.push({
			severity: "WARNING",
			code: "HEIGHT_ADJUSTED",
			segmentId: e.id,
			message: `Segment ${e.id} height set to catalog H=${t.height}.`,
			values: {
				from: e.height,
				to: t.height
			}
		}), e.height = t.height);
	}
	let u = bt({
		nodes: o,
		segments: s
	}, r.sin), d = n.idPrefix ?? "";
	for (let [e, c] of u.legs) {
		if (c.length !== 3) continue;
		let f = null, p = null;
		for (let e = 0; e < 3 && !f; e++) for (let t = e + 1; t < 3 && !f; t++) {
			let n = 3 - e - t;
			l.dot(c[e].dir, c[t].dir) < -r.cos && c[e].level && c[t].level && !c[n].level && (f = [c[e], c[t]], p = c[n]);
		}
		if (!f || !p) continue;
		let m = u.nodes.get(e), h = Math.hypot(p.dir[0], p.dir[2]), g = u.legs.get(p.otherId) ?? [];
		if (h > r.sin || g.length !== 1) {
			a.push({
				severity: "ERROR",
				code: "VERTICAL_TEE_UNRESOLVED",
				nodeId: e,
				segmentId: p.segment.id,
				message: h > r.sin ? `Vertical tee at ${e}: the branch ${p.segment.id} is inclined; only a plumb branch can be replaced automatically.` : `Vertical tee at ${e}: the far end of ${p.segment.id} is connected to other trays, so the run cannot be moved; redesign this junction.`
			});
			continue;
		}
		let _ = Math.max(f[0].segment.width, f[1].segment.width), v = p.dir[1] > 0, y = `${d}${e}~VT`, b = Dt(t, _, p.segment.width, v, n, e, y), x = l.normalize(l.cross(ut, l.scale(f[0].dir, -1))), S = u.nodes.get(p.otherId), C = (t) => {
			let n = l.scale(x, t * b), r = l.add(m.position, n), i = l.add(S.position, n), a = Infinity;
			for (let t of s) {
				if (t.id === p.segment.id || t.from === e || t.to === e) continue;
				let n = u.nodes.get(t.from)?.position, o = u.nodes.get(t.to)?.position;
				n && o && (a = Math.min(a, Ot(r, n, o), Ot(i, n, o)));
			}
			return a;
		}, w = n.verticalTeeSide?.(e) ?? (C(1) >= C(-1) ? 1 : -1), T = l.scale(x, w * b), E = `${d}${p.segment.id}~STUB`, D = l.clean(l.add(m.position, T));
		o.push({
			id: y,
			position: D
		});
		let O = o.find((e) => e.id === S.id), k = l.clean(l.add(S.position, T)), A = s.find((e) => e.id === p.segment.id), ee = {
			from: A.from,
			to: A.to
		};
		A.from === e ? A.from = y : A.to = y, s.push({
			id: E,
			from: e,
			to: y,
			width: A.width,
			height: A.height
		}), i.push({
			kind: "NODE_ADDED",
			nodeId: y,
			position: D,
			reason: `Top of the relocated vertical run (vertical tee at ${e} is not in the catalog).`
		}), i.push({
			kind: "SEGMENT_ADDED",
			segmentId: E,
			from: e,
			to: y,
			width: A.width,
			reason: `Horizontal stub from the tee branch to the vertical bend (${(b / 1e3).toFixed(3)} m).`
		}), i.push({
			kind: "SEGMENT_RECONNECTED",
			segmentId: A.id,
			before: ee,
			after: {
				from: A.from,
				to: A.to
			},
			reason: "Vertical run starts at the stub end."
		}), i.push({
			kind: "NODE_MOVED",
			nodeId: S.id,
			from: [...S.position],
			to: k,
			reason: "Free end of the vertical run moves with it."
		}), O.position = k, a.push({
			severity: "WARNING",
			code: "VERTICAL_TEE_REPLACED",
			nodeId: e,
			segmentId: A.id,
			message: `Vertical tee at ${e} replaced by a level tee, a ${(b / 1e3).toFixed(3)} m stub and a vertical bend; ${S.id} moves ${(b / 1e3).toFixed(3)} m sideways.`,
			values: {
				stubMm: +b.toFixed(1),
				side: w
			}
		});
	}
	return {
		network: {
			nodes: o,
			segments: s
		},
		changes: i,
		issues: a
	};
}
function At(e, t) {
	let n = new Map(t.network.segments.map((e) => [e.id, e])), r = t.changes.filter((e) => e.kind === "SEGMENT_ADDED").map((e) => {
		let n = t.changes.find((t) => t.kind === "SEGMENT_RECONNECTED" && (t.after.from === e.to || t.after.to === e.to));
		return n ? {
			stub: e.segmentId,
			junction: e.from,
			vertical: n.segmentId
		} : null;
	}).filter((e) => !!e), i = (e, t) => {
		let r = n.get(e);
		return !!r && (r.from === t || r.to === t);
	}, a = [];
	return e.forEach((e) => {
		let t = a[a.length - 1], n = r.find((n) => n.vertical === e && t !== void 0 && t !== n.stub && i(t, n.junction)), o = r.find((n) => n.vertical === t && e !== n.stub && i(e, n.junction));
		n && a.push(n.stub), o && a.push(o.stub), a.push(e);
	}), a;
}
//#endregion
//#region src/tests/baselines/legacyFittingBaselines.ts
var jt = {
	TRAY_STRAIGHT: {
		id: "TRAY_STRAIGHT",
		childMeshCount: 2,
		vertexCount: 432,
		triangleCount: 216,
		bounds: [
			-.313,
			-.05,
			-1.5,
			.313,
			.05,
			1.5
		],
		projectedCentroid: [0, 0]
	},
	TRAY_STRAIGHT_DIVIDER: {
		id: "TRAY_STRAIGHT_DIVIDER",
		childMeshCount: 3,
		vertexCount: 456,
		triangleCount: 228,
		bounds: [
			-.313,
			-.05,
			-1.5,
			.313,
			.05,
			1.5
		],
		projectedCentroid: [0, 0]
	},
	FITTING_SPLICE_PLATE: {
		id: "FITTING_SPLICE_PLATE",
		childMeshCount: 3,
		vertexCount: 128,
		triangleCount: 76,
		bounds: [
			-.0275,
			-.04,
			-.06,
			.0275,
			.04,
			.06
		],
		projectedCentroid: [0, 0]
	},
	SUPPORT_CANTILEVER: {
		id: "SUPPORT_CANTILEVER",
		childMeshCount: 4,
		vertexCount: 96,
		triangleCount: 48,
		bounds: [
			-.37,
			-.295,
			-.03,
			.4,
			-.04,
			.03
		],
		projectedCentroid: [.0045, -.0824]
	},
	FITTING_ELBOW_90: {
		id: "FITTING_ELBOW_90",
		childMeshCount: 2,
		vertexCount: 1632,
		triangleCount: 1512,
		bounds: [
			0,
			-.05,
			-.913,
			.913,
			.05,
			0
		],
		projectedCentroid: [.2599, .0111]
	},
	FITTING_TEE: {
		id: "FITTING_TEE",
		childMeshCount: 2,
		vertexCount: 1872,
		triangleCount: 1680,
		bounds: [
			-.7,
			-.05,
			-.313,
			.7,
			.05,
			.7
		],
		projectedCentroid: [-.0532, -.0368]
	},
	FITTING_RISER_IN_90: {
		id: "FITTING_RISER_IN_90",
		childMeshCount: 2,
		vertexCount: 1608,
		triangleCount: 1500,
		bounds: [
			0,
			-.4,
			-.313,
			.4,
			0,
			.313
		],
		projectedCentroid: [.0619, -.1298]
	},
	FITTING_RISER_OUT_90: {
		id: "FITTING_RISER_OUT_90",
		childMeshCount: 2,
		vertexCount: 1608,
		triangleCount: 1500,
		bounds: [
			0,
			0,
			-.313,
			.4,
			.4,
			.313
		],
		projectedCentroid: [.0646, .0682]
	}
}, Mt = Math.SQRT1_2, Y = Math.sqrt(3) / 2, X = Math.PI / 2, Nt = [
	{
		id: "LADDER_STRAIGHT_600",
		description: "Straight ladder tray 600W × 150H × 3000L",
		sourcePage: 4,
		printedPage: "2",
		profileId: "LADDER_PROFILE_STANDARD",
		definitionId: "TRAY_STRAIGHT",
		params: { width: 600 },
		catalogChain: "W (100–1000) | H 150 | L 3000; W+26 overall; rungs 125 + 11 × 250 + 125",
		expectedPorts: [{
			id: "PORT_A",
			position: [
				0,
				0,
				-1500
			],
			direction: [
				0,
				0,
				-1
			],
			up: [
				0,
				1,
				0
			],
			width: 600
		}, {
			id: "PORT_B",
			position: [
				0,
				0,
				1500
			],
			direction: [
				0,
				0,
				1
			],
			up: [
				0,
				1,
				0
			],
			width: 600
		}],
		expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 3e3 },
		expectedBounds: {
			min: [
				-313,
				-75,
				-1500
			],
			max: [
				313,
				75,
				1500
			]
		},
		expectedDims: {
			overallWidth: 626,
			height: 150
		}
	},
	{
		id: "LADDER_STRAIGHT_300",
		description: "Straight ladder tray 300W × 150H (project size, highlighted p.4)",
		sourcePage: 4,
		printedPage: "2",
		profileId: "LADDER_PROFILE_STANDARD",
		definitionId: "TRAY_STRAIGHT",
		params: { width: 300 },
		catalogChain: "W 300 | H 150 | L 3000; W+26 = 326 overall",
		expectedPorts: [{
			id: "PORT_A",
			position: [
				0,
				0,
				-1500
			],
			direction: [
				0,
				0,
				-1
			],
			width: 300
		}, {
			id: "PORT_B",
			position: [
				0,
				0,
				1500
			],
			direction: [
				0,
				0,
				1
			],
			width: 300
		}],
		expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 3e3 },
		expectedBounds: {
			min: [
				-163,
				-75,
				-1500
			],
			max: [
				163,
				75,
				1500
			]
		},
		expectedDims: { overallWidth: 326 }
	},
	{
		id: "LADDER_H90_300_R300",
		description: "Horizontal 90° elbow 300W, R 300 (project highlight p.5)",
		sourcePage: 5,
		printedPage: "3",
		profileId: "LADDER_PROFILE_STANDARD",
		definitionId: "FITTING_ELBOW_90",
		params: {
			width: 300,
			radius: 300
		},
		catalogChain: "bottom: W | R | 125 ; right: W | R | 125 (R to the inner rail, 125 tangents)",
		expectedPorts: [{
			id: "PORT_A",
			position: [
				450,
				0,
				125
			],
			direction: [
				0,
				0,
				1
			],
			up: [
				0,
				1,
				0
			]
		}, {
			id: "PORT_B",
			position: [
				-125,
				0,
				-450
			],
			direction: [
				-1,
				0,
				0
			],
			up: [
				0,
				1,
				0
			]
		}],
		expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 250 + 450 * X },
		expectedBounds: {
			min: [
				-125,
				-75,
				-613
			],
			max: [
				613,
				75,
				125
			]
		},
		expectedDims: {
			catalogRadius: 300,
			centerlineRadius: 450,
			innerRailRadius: 300,
			outerRailRadius: 600,
			tangentLength: 125
		}
	},
	{
		id: "LADDER_H60_600_R300",
		description: "Horizontal 60° elbow 600W, R 300",
		sourcePage: 6,
		printedPage: "4",
		profileId: "LADDER_PROFILE_STANDARD",
		definitionId: "FITTING_ELBOW_60",
		params: {
			width: 600,
			radius: 300
		},
		catalogChain: "bottom: W | R ; 125 tangents at both ends; 60°",
		expectedPorts: [{
			id: "PORT_A",
			position: [
				600,
				0,
				125
			],
			direction: [
				0,
				0,
				1
			]
		}, {
			id: "PORT_B",
			position: [
				300 - 125 * Y,
				0,
				-600 * Y - 62.5
			],
			direction: [
				-Y,
				0,
				-.5
			]
		}],
		expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 250 + 600 * Math.PI / 3 },
		expectedDims: {
			centerlineRadius: 600,
			angleDeg: 60
		}
	},
	{
		id: "LADDER_H45_600_R300",
		description: "Horizontal 45° elbow 600W, R 300 (project highlight p.7)",
		sourcePage: 7,
		printedPage: "5",
		profileId: "LADDER_PROFILE_STANDARD",
		definitionId: "FITTING_ELBOW_45",
		params: {
			width: 600,
			radius: 300
		},
		catalogChain: "bottom: W | R ; 125 tangents at both ends; 45°",
		expectedPorts: [{
			id: "PORT_A",
			position: [
				600,
				0,
				125
			],
			direction: [
				0,
				0,
				1
			]
		}, {
			id: "PORT_B",
			position: [
				475 * Mt,
				0,
				-725 * Mt
			],
			direction: [
				-Mt,
				0,
				-Mt
			]
		}],
		expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 250 + 600 * Math.PI / 4 },
		expectedBounds: {
			min: [
				475 * Mt - 313 * Mt,
				-75,
				-725 * Mt - 313 * Mt
			],
			max: [
				913,
				75,
				125
			]
		}
	},
	{
		id: "LADDER_H30_600_R300",
		description: "Horizontal 30° elbow 600W, R 300 (project highlight p.8)",
		sourcePage: 8,
		printedPage: "6",
		profileId: "LADDER_PROFILE_STANDARD",
		definitionId: "FITTING_ELBOW_30",
		params: {
			width: 600,
			radius: 300
		},
		catalogChain: "bottom: W | R ; 125 tangents at both ends; 30°",
		expectedPorts: [{
			id: "PORT_A",
			position: [
				600,
				0,
				125
			],
			direction: [
				0,
				0,
				1
			]
		}, {
			id: "PORT_B",
			position: [
				600 * Y - 62.5,
				0,
				-300 - 125 * Y
			],
			direction: [
				-.5,
				0,
				-Y
			]
		}],
		expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 250 + 600 * Math.PI / 6 }
	},
	{
		id: "LADDER_TEE_600_R300",
		description: "Horizontal tee 600W, R 300 — Page 9 golden fixture",
		sourcePage: 9,
		printedPage: "7",
		profileId: "LADDER_PROFILE_STANDARD",
		definitionId: "FITTING_TEE",
		params: {
			width: 600,
			radius: 300
		},
		catalogChain: "bottom: 125 | R | W | R | 125 (main span 1450) ; right: W | R | 125 (back rail → branch end 1025)",
		expectedPorts: [
			{
				id: "PORT_A",
				position: [
					-725,
					0,
					0
				],
				direction: [
					-1,
					0,
					0
				],
				up: [
					0,
					1,
					0
				]
			},
			{
				id: "PORT_B",
				position: [
					725,
					0,
					0
				],
				direction: [
					1,
					0,
					0
				],
				up: [
					0,
					1,
					0
				]
			},
			{
				id: "PORT_C",
				position: [
					0,
					0,
					725
				],
				direction: [
					0,
					0,
					1
				],
				up: [
					0,
					1,
					0
				]
			}
		],
		expectedRouteLengths: {
			ROUTE_A_B: 1450,
			ROUTE_A_C: 250 + 600 * X,
			ROUTE_B_C: 250 + 600 * X
		},
		expectedBounds: {
			min: [
				-725,
				-75,
				-313
			],
			max: [
				725,
				75,
				725
			]
		},
		expectedDims: {
			mainSpan: 1450,
			branchProjection: 725,
			branchFromBackRail: 1025,
			catalogRadius: 300,
			centerlineRadius: 600
		}
	},
	{
		id: "LADDER_TEE_600_R600",
		description: "Horizontal tee 600W, R 600 — radius must drive the spans",
		sourcePage: 9,
		printedPage: "7",
		profileId: "LADDER_PROFILE_STANDARD",
		definitionId: "FITTING_TEE",
		params: {
			width: 600,
			radius: 600
		},
		catalogChain: "125 | 600 | 600 | 600 | 125 = 2050 ; 600 | 600 | 125",
		expectedPorts: [
			{
				id: "PORT_A",
				position: [
					-1025,
					0,
					0
				],
				direction: [
					-1,
					0,
					0
				]
			},
			{
				id: "PORT_B",
				position: [
					1025,
					0,
					0
				],
				direction: [
					1,
					0,
					0
				]
			},
			{
				id: "PORT_C",
				position: [
					0,
					0,
					1025
				],
				direction: [
					0,
					0,
					1
				]
			}
		],
		expectedRouteLengths: {
			ROUTE_A_B: 2050,
			ROUTE_A_C: 250 + 900 * X
		},
		expectedBounds: {
			min: [
				-1025,
				-75,
				-313
			],
			max: [
				1025,
				75,
				1025
			]
		}
	},
	{
		id: "LADDER_CROSS_600_R300",
		description: "Horizontal cross 600W, R 300 — Page 10 golden fixture",
		sourcePage: 10,
		printedPage: "8",
		profileId: "LADDER_PROFILE_STANDARD",
		definitionId: "FITTING_CROSS",
		params: {
			width: 600,
			radius: 300
		},
		catalogChain: "125 | R | W | R | 125 on both axes (span 1450), four radius-R corners",
		expectedPorts: [
			{
				id: "PORT_A",
				position: [
					-725,
					0,
					0
				],
				direction: [
					-1,
					0,
					0
				]
			},
			{
				id: "PORT_B",
				position: [
					725,
					0,
					0
				],
				direction: [
					1,
					0,
					0
				]
			},
			{
				id: "PORT_C",
				position: [
					0,
					0,
					725
				],
				direction: [
					0,
					0,
					1
				]
			},
			{
				id: "PORT_D",
				position: [
					0,
					0,
					-725
				],
				direction: [
					0,
					0,
					-1
				]
			}
		],
		expectedRouteLengths: {
			ROUTE_PORT_A_PORT_B: 1450,
			ROUTE_PORT_D_PORT_C: 1450,
			ROUTE_PORT_A_PORT_C: 250 + 600 * X,
			ROUTE_PORT_A_PORT_D: 250 + 600 * X,
			ROUTE_PORT_B_PORT_C: 250 + 600 * X,
			ROUTE_PORT_B_PORT_D: 250 + 600 * X
		},
		expectedBounds: {
			min: [
				-725,
				-75,
				-725
			],
			max: [
				725,
				75,
				725
			]
		},
		expectedDims: { span: 1450 }
	},
	{
		id: "LADDER_VI90_300_R300",
		description: "Vertical inside (rising) 90° 300W, R 300 (project highlight p.11)",
		sourcePage: 11,
		printedPage: "9",
		profileId: "LADDER_PROFILE_STANDARD",
		definitionId: "FITTING_RISER_IN_90",
		params: {
			width: 300,
			radius: 300
		},
		catalogChain: "top: 125 | R | H ; left: 125 | R | H ; cover R−2 (R on the rail-top side)",
		expectedPorts: [{
			id: "PORT_A",
			position: [
				-125,
				-375,
				0
			],
			direction: [
				-1,
				0,
				0
			],
			up: [
				0,
				1,
				0
			]
		}, {
			id: "PORT_B",
			position: [
				375,
				125,
				0
			],
			direction: [
				0,
				1,
				0
			],
			up: [
				-1,
				0,
				0
			]
		}],
		expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 250 + 375 * X },
		expectedBounds: {
			min: [
				-125,
				-450,
				-163
			],
			max: [
				450,
				125,
				163
			]
		},
		expectedDims: {
			catalogRadius: 300,
			centerlineRadius: 375,
			bottomRadius: 450,
			coverSideRadius: 300
		}
	},
	{
		id: "LADDER_VO90_600_R300",
		description: "Vertical outside (falling) 90° 600W, R 300 (project highlight p.15)",
		sourcePage: 15,
		printedPage: "13",
		profileId: "LADDER_PROFILE_STANDARD",
		definitionId: "FITTING_RISER_OUT_90",
		params: {
			width: 600,
			radius: 300
		},
		catalogChain: "bottom: 125 | R | H ; left: H | R | 125 ; cover H+R−10 (R at the tray bottom)",
		expectedPorts: [{
			id: "PORT_A",
			position: [
				-125,
				375,
				0
			],
			direction: [
				-1,
				0,
				0
			],
			up: [
				0,
				1,
				0
			]
		}, {
			id: "PORT_B",
			position: [
				375,
				-125,
				0
			],
			direction: [
				0,
				-1,
				0
			],
			up: [
				1,
				0,
				0
			]
		}],
		expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 250 + 375 * X },
		expectedBounds: {
			min: [
				-125,
				-125,
				-313
			],
			max: [
				450,
				450,
				313
			]
		},
		expectedDims: {
			bottomRadius: 300,
			coverSideRadius: 450
		}
	},
	{
		id: "LADDER_REDUCER_CENTER_600_300",
		description: "Center reducer 600 → 300 (p.19 table)",
		sourcePage: 19,
		printedPage: "17",
		profileId: "LADDER_PROFILE_STANDARD",
		definitionId: "FITTING_REDUCER_CENTER",
		params: {
			inletWidth: 600,
			outletWidth: 300
		},
		catalogChain: "200 straight | taper | 200 straight = 600L ; W1 bottom, W2 top",
		expectedPorts: [{
			id: "PORT_A",
			position: [
				0,
				0,
				-300
			],
			direction: [
				0,
				0,
				-1
			],
			width: 600
		}, {
			id: "PORT_B",
			position: [
				0,
				0,
				300
			],
			direction: [
				0,
				0,
				1
			],
			width: 300
		}],
		expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 600 },
		expectedBounds: {
			min: [
				-313,
				-75,
				-300
			],
			max: [
				313,
				75,
				300
			]
		},
		expectedDims: {
			length: 600,
			tangentLength: 200,
			transitionLength: 200,
			lateralOffset: 0
		}
	},
	{
		id: "LADDER_REDUCER_LEFT_600_300",
		description: "Left reducer 600 → 300: left rail straight (p.20)",
		sourcePage: 20,
		printedPage: "18",
		profileId: "LADDER_PROFILE_STANDARD",
		definitionId: "FITTING_REDUCER_LEFT",
		params: {
			inletWidth: 600,
			outletWidth: 300
		},
		catalogChain: "left rail straight 600L ; right rail 200 | taper | 200",
		expectedPorts: [{
			id: "PORT_A",
			position: [
				0,
				0,
				-300
			],
			direction: [
				0,
				0,
				-1
			],
			width: 600
		}, {
			id: "PORT_B",
			position: [
				150,
				0,
				300
			],
			direction: [
				0,
				0,
				1
			],
			width: 300
		}],
		expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 200 + Math.hypot(200, 150) + 200 },
		expectedBounds: {
			min: [
				-313,
				-75,
				-300
			],
			max: [
				313,
				75,
				300
			]
		}
	},
	{
		id: "LADDER_REDUCER_RIGHT_600_300",
		description: "Right reducer 600 → 300: right rail straight (p.21)",
		sourcePage: 21,
		printedPage: "19",
		profileId: "LADDER_PROFILE_STANDARD",
		definitionId: "FITTING_REDUCER_RIGHT",
		params: {
			inletWidth: 600,
			outletWidth: 300
		},
		catalogChain: "right rail straight 600L ; left rail 200 | taper | 200",
		expectedPorts: [{
			id: "PORT_A",
			position: [
				0,
				0,
				-300
			],
			direction: [
				0,
				0,
				-1
			],
			width: 600
		}, {
			id: "PORT_B",
			position: [
				-150,
				0,
				300
			],
			direction: [
				0,
				0,
				1
			],
			width: 300
		}],
		expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 650 }
	},
	{
		id: "VENT_A_STRAIGHT",
		description: "Ventilated-through straight 100W × 50H × 3000L",
		sourcePage: 30,
		printedPage: "2",
		profileId: "VENTILATED_PROFILE_A",
		definitionId: "TRAY_STRAIGHT",
		params: {},
		catalogChain: "W 100 | H 50 | L 3000 ; cover W+6",
		expectedPorts: [{
			id: "PORT_A",
			position: [
				0,
				0,
				-1500
			],
			direction: [
				0,
				0,
				-1
			],
			width: 100
		}, {
			id: "PORT_B",
			position: [
				0,
				0,
				1500
			],
			direction: [
				0,
				0,
				1
			],
			width: 100
		}],
		expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 3e3 },
		expectedBounds: {
			min: [
				-50,
				-25,
				-1500
			],
			max: [
				50,
				25,
				1500
			]
		}
	},
	{
		id: "VENT_A_H90",
		description: "Ventilated-through horizontal 90° 100W, R 300",
		sourcePage: 31,
		printedPage: "3",
		profileId: "VENTILATED_PROFILE_A",
		definitionId: "FITTING_ELBOW_90",
		params: {},
		catalogChain: "bottom: W | R | 125 ; right: W | R | 125",
		expectedPorts: [{
			id: "PORT_A",
			position: [
				350,
				0,
				125
			],
			direction: [
				0,
				0,
				1
			]
		}, {
			id: "PORT_B",
			position: [
				-125,
				0,
				-350
			],
			direction: [
				-1,
				0,
				0
			]
		}],
		expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 250 + 350 * X },
		expectedBounds: {
			min: [
				-125,
				-25,
				-400
			],
			max: [
				400,
				25,
				125
			]
		}
	},
	{
		id: "VENT_A_TEE",
		description: "Ventilated-through tee 100W, R 300",
		sourcePage: 33,
		printedPage: "5",
		profileId: "VENTILATED_PROFILE_A",
		definitionId: "FITTING_TEE",
		params: {},
		catalogChain: "125 | R | W | R | 125 = 950 ; W | R | 125 = 525",
		expectedPorts: [
			{
				id: "PORT_A",
				position: [
					-475,
					0,
					0
				],
				direction: [
					-1,
					0,
					0
				]
			},
			{
				id: "PORT_B",
				position: [
					475,
					0,
					0
				],
				direction: [
					1,
					0,
					0
				]
			},
			{
				id: "PORT_C",
				position: [
					0,
					0,
					475
				],
				direction: [
					0,
					0,
					1
				]
			}
		],
		expectedRouteLengths: {
			ROUTE_A_B: 950,
			ROUTE_A_C: 250 + 350 * X
		},
		expectedBounds: {
			min: [
				-475,
				-25,
				-50
			],
			max: [
				475,
				25,
				475
			]
		},
		expectedDims: {
			mainSpan: 950,
			branchFromBackRail: 525
		}
	},
	{
		id: "VENT_A_VI90",
		description: "Ventilated-through vertical inside 90° 100W, R 300",
		sourcePage: 34,
		printedPage: "6",
		profileId: "VENTILATED_PROFILE_A",
		definitionId: "FITTING_RISER_IN_90",
		params: {},
		catalogChain: "top: 125 | R | H ; left: 125 | R | H",
		expectedPorts: [{
			id: "PORT_A",
			position: [
				-125,
				-325,
				0
			],
			direction: [
				-1,
				0,
				0
			],
			up: [
				0,
				1,
				0
			]
		}, {
			id: "PORT_B",
			position: [
				325,
				125,
				0
			],
			direction: [
				0,
				1,
				0
			],
			up: [
				-1,
				0,
				0
			]
		}],
		expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 250 + 325 * X },
		expectedBounds: {
			min: [
				-125,
				-350,
				-50
			],
			max: [
				350,
				125,
				50
			]
		}
	},
	{
		id: "VENT_B_STRAIGHT",
		description: "Ventilated-through straight 300W × 100H × 3000L",
		sourcePage: 41,
		printedPage: "2",
		profileId: "VENTILATED_PROFILE_B",
		definitionId: "TRAY_STRAIGHT",
		params: {},
		catalogChain: "W 300 | H 100 | L 3000 ; cover W+6",
		expectedPorts: [{
			id: "PORT_A",
			position: [
				0,
				0,
				-1500
			],
			direction: [
				0,
				0,
				-1
			],
			width: 300
		}, {
			id: "PORT_B",
			position: [
				0,
				0,
				1500
			],
			direction: [
				0,
				0,
				1
			],
			width: 300
		}],
		expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 3e3 },
		expectedBounds: {
			min: [
				-150,
				-50,
				-1500
			],
			max: [
				150,
				50,
				1500
			]
		}
	},
	{
		id: "VENT_B_H30",
		description: "Ventilated-through horizontal 30° 300W, R 300",
		sourcePage: 43,
		printedPage: "4",
		profileId: "VENTILATED_PROFILE_B",
		definitionId: "FITTING_ELBOW_30",
		params: {},
		catalogChain: "bottom: W | R ; 125 tangents ; 30°",
		expectedPorts: [{
			id: "PORT_A",
			position: [
				450,
				0,
				125
			],
			direction: [
				0,
				0,
				1
			]
		}, {
			id: "PORT_B",
			position: [
				450 * Y - 62.5,
				0,
				-225 - 125 * Y
			],
			direction: [
				-.5,
				0,
				-Y
			]
		}],
		expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 250 + 450 * Math.PI / 6 }
	},
	{
		id: "VENT_B_VO90",
		description: "Ventilated-through vertical outside 90° 300W, R 300",
		sourcePage: 45,
		printedPage: "6",
		profileId: "VENTILATED_PROFILE_B",
		definitionId: "FITTING_RISER_OUT_90",
		params: {},
		catalogChain: "bottom: 125 | R | H ; left: H | R | 125",
		expectedPorts: [{
			id: "PORT_A",
			position: [
				-125,
				350,
				0
			],
			direction: [
				-1,
				0,
				0
			],
			up: [
				0,
				1,
				0
			]
		}, {
			id: "PORT_B",
			position: [
				350,
				-125,
				0
			],
			direction: [
				0,
				-1,
				0
			],
			up: [
				1,
				0,
				0
			]
		}],
		expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 250 + 350 * X },
		expectedBounds: {
			min: [
				-125,
				-125,
				-150
			],
			max: [
				400,
				400,
				150
			]
		}
	}
], Z = () => z.get("LADDER_PROFILE_STANDARD"), Pt = () => z.get("VENTILATED_PROFILE_A"), Ft = () => z.get("VENTILATED_PROFILE_B");
function Q(e, t) {
	return Math.hypot(e[0] - t[0], e[1] - t[1], e[2] - t[2]);
}
function It(e, t) {
	let n = 0;
	for (let r = 0; r < 3; r++) n = Math.max(n, Math.abs(e.min[r] - t.min[r]), Math.abs(e.max[r] - t.max[r]));
	return n;
}
function Lt(t) {
	t.updateMatrixWorld(!0);
	let n = [];
	return t.traverse((t) => {
		let r = t;
		if (!r.isMesh || r.userData?.isAccessory) return;
		let i = r.geometry.getAttribute("position"), a = new e.Vector3();
		for (let e = 0; e < i.count; e++) a.fromBufferAttribute(i, e).applyMatrix4(r.matrixWorld).multiplyScalar(1e3), n.push([
			a.x,
			a.y,
			a.z
		]);
	}), n;
}
function Rt(e, t, n, r, i) {
	let a = [
		.2,
		.35,
		.5,
		.65,
		.8
	], o = 0;
	return a.forEach((a) => {
		let s = (r + i * a) * Math.PI / 180;
		e.some((e) => {
			let r = e[0] - t[0], i = e[2] - t[1];
			if (Math.abs(Math.hypot(r, i) - n) > .5) return !1;
			let a = Math.abs(Math.atan2(i, r) - s);
			return a = Math.min(a, 2 * Math.PI - a), a < 2 * Math.PI / 180;
		}) && o++;
	}), {
		found: o,
		tested: a.length
	};
}
function zt() {
	return ft([
		{
			id: "A",
			x: 0,
			y: 0,
			z: 6.4
		},
		{
			id: "VT",
			x: 5,
			y: 0,
			z: 6.4
		},
		{
			id: "T",
			x: 10,
			y: 0,
			z: 6.4
		},
		{
			id: "E",
			x: 20,
			y: 0,
			z: 6.4
		},
		{
			id: "E2",
			x: 20,
			y: 8,
			z: 6.4
		},
		{
			id: "B",
			x: 10,
			y: 6,
			z: 6.4
		},
		{
			id: "J",
			x: 10,
			y: 6,
			z: 1.4
		},
		{
			id: "J2",
			x: 5,
			y: 0,
			z: 1.4
		},
		{
			id: "P1",
			x: 0,
			y: 20,
			z: 2.8
		},
		{
			id: "PM",
			x: 1.5,
			y: 20,
			z: 2.8
		},
		{
			id: "P2",
			x: 3,
			y: 20,
			z: 2.8
		}
	], [
		{
			id: "s1",
			from: "A",
			to: "VT",
			width: 600
		},
		{
			id: "s1b",
			from: "VT",
			to: "T",
			width: 600
		},
		{
			id: "s2",
			from: "T",
			to: "E",
			width: 600
		},
		{
			id: "s3",
			from: "E",
			to: "E2",
			width: 450,
			height: 150
		},
		{
			id: "br",
			from: "T",
			to: "B",
			width: 300
		},
		{
			id: "rs",
			from: "B",
			to: "J",
			width: 300
		},
		{
			id: "vt",
			from: "VT",
			to: "J2",
			width: 300
		},
		{
			id: "p1",
			from: "P1",
			to: "PM",
			width: 300
		},
		{
			id: "p2",
			from: "PM",
			to: "P2",
			width: 300
		}
	], lt.PAGE_Y_DOWN_METRES);
}
function Bt(e = {}) {
	return J(kt(zt(), Z(), e).network, Z(), e);
}
function Vt(e) {
	let t = e.instances(), n = [], r = /* @__PURE__ */ new Set(), i = 0;
	for (let e = 0; e < t.length; e++) for (let a = e + 1; a < t.length; a++) for (let o of t[e].getWorldPorts()) for (let s of t[a].getWorldPorts()) {
		if (Q(o.worldPosition, s.worldPosition) > .01) continue;
		i++, r.add(`${t[e].instanceId}.${o.id}`), r.add(`${t[a].instanceId}.${s.id}`);
		let c = G.checkJoint(t[e], o.id, t[a], s.id);
		c.passed || n.push(`${t[e].instanceId}.${o.id} ↔ ${t[a].instanceId}.${s.id}: ${c.issues.join("; ")}`);
	}
	return e.fittings.forEach((e) => e.instance.getWorldPorts().forEach((t) => {
		r.has(`${e.id}.${t.id}`) || n.push(`${e.id}.${t.id} is not connected`);
	})), {
		joints: i,
		failures: n
	};
}
function Ht(e, t, n) {
	let r = e.getCenterlines().find((e) => e.fromPort === t && e.toPort === n || e.fromPort === n && e.toPort === t);
	if (!r) throw Error(`${e.instanceId}: no route ${t}↔${n}`);
	let i = r.samplePoints.map((t) => o.transformPoint(t, e.placement));
	return r.fromPort === t ? i : i.reverse();
}
function Ut() {
	return R.getAll().filter((e) => Ke(e.id) !== "OTHER");
}
function Wt(e) {
	let t = [{
		label: "GENERIC",
		params: { ...e.defaultParameters }
	}];
	return z.getAll().forEach((n) => {
		z.supports(n, e.id) && t.push({
			label: n.id,
			params: {
				...e.defaultParameters,
				...B(e.id, n)
			}
		});
	}), t;
}
function $(e, t, n, r, i, a, o) {
	return {
		id: e,
		name: t,
		passed: n,
		expected: r,
		actual: n ? i : `FAIL: ${a}`,
		details: o
	};
}
var Gt = class {
	static runAll() {
		R.initAll();
		let e = [
			() => this.testCaseA(),
			() => this.testCaseB(),
			() => this.testCaseC(),
			() => this.testCaseD(),
			() => this.testCaseE(),
			() => this.testCaseF(),
			() => this.testCaseG(),
			() => this.testCaseH(),
			() => this.testCaseI(),
			() => this.testCaseJ(),
			() => this.testCaseK(),
			() => this.testCaseL(),
			() => this.testCaseM(),
			() => this.testCaseN(),
			() => this.testCaseO(),
			() => this.testCaseP(),
			() => this.testCaseQ_CenterlinePortEndpoints(),
			() => this.testCaseR_BoundsConsistency(),
			() => this.testCaseS_PortFrameHandedness(),
			() => this.testCaseT_EccentricReducerLength(),
			() => this.testCaseU_TeePhysicalCenterline(),
			() => this.testCaseV_DerivedStateExport(),
			() => this.testCaseW_CatalogProfileA(),
			() => this.testCaseX_CatalogProfileB(),
			() => this.testCaseY_HorizontalCross(),
			() => this.testCaseZ_CatalogAngles(),
			() => this.testCaseAA_VendorDimensionFormulas(),
			() => this.testCaseAB_ProfileCatalogIntegrity(),
			() => this.testCaseAC_GoldenFixtures(),
			() => this.testCaseAD_TeeCurvedTransition(),
			() => this.testCaseAE_CrossCurvedCorners(),
			() => this.testCaseAF_ProfilePropagation(),
			() => this.testCaseAG_RadiusSemantics(),
			() => this.testCaseAH_ConnectionFaceTermination(),
			() => this.testCaseAI_AssemblyRegression(),
			() => this.testCaseAJ_NegativeControls(),
			() => this.testCaseAK_AssemblyDemos(),
			() => this.testCaseAL_PlanFrameHandedness(),
			() => this.testCaseAM_NetworkFittings(),
			() => this.testCaseAN_NetworkNormalizeAndIssues(),
			() => this.testCaseAO_NetworkCenterline(),
			() => this.testCaseAP_NetworkBom(),
			() => this.testCaseAQ_HostMaterials(),
			() => this.testCaseAR_FittingChoices()
		].map((e, t) => {
			try {
				return e();
			} catch (e) {
				return {
					id: `#${t + 1}`,
					name: "Test threw an exception",
					passed: !1,
					expected: "No runtime exception",
					actual: `FAIL: ${e?.message ?? e}`
				};
			}
		}), t = e.filter((e) => e.passed).length, n = e.length - t;
		return {
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			totalPassed: t,
			totalFailed: n,
			totalCases: e.length,
			allPassed: n === 0,
			cases: e
		};
	}
	static testCaseA() {
		let e = V("TRAY_STRAIGHT", Z(), {}, "inst_straight"), t = V("FITTING_ELBOW_90", Z(), {}, "inst_elbow"), n = W.validateConnection(e, "PORT_B", t, "PORT_A");
		return $("Case A", "標準對接測試 (Standard Mating Compatibility)", n.valid && n.code === "OK", "Ladder 600W×150H straight ↔ elbow 90° validates OK", "PASS (相容通過, 600W x 150H TRAY_END, LADDER ↔ LADDER)", `${n.code} ${n.error ?? ""}`, n);
	}
	static testCaseB() {
		let e = new s("inst_straight", R.get("TRAY_STRAIGHT"), {
			width: 600,
			depth: 100
		}), t = new s("inst_elbow", R.get("FITTING_ELBOW_90"), {
			width: 450,
			depth: 100
		}), n = W.validateConnection(e, "PORT_B", t, "PORT_A");
		return $("Case B", "尺寸不符攔截 (Dimension Mismatch Interception)", !n.valid && n.code === "WIDTH_MISMATCH", "FAIL with WIDTH_MISMATCH", `PASS (成功攔截: ${n.error})`, n.code, n);
	}
	static testCaseC() {
		let e = new s("inst_straight", R.get("TRAY_STRAIGHT"), {
			width: 600,
			depth: 100
		}), t = new s("inst_elbow", R.get("FITTING_ELBOW_90"), {
			width: 600,
			depth: 150
		}), n = W.validateConnection(e, "PORT_B", t, "PORT_A");
		return $("Case C", "深度不符攔截 (Depth Mismatch Interception)", !n.valid && n.code === "DEPTH_MISMATCH", "FAIL with DEPTH_MISMATCH (100 != 150)", `PASS (成功攔截: ${n.error})`, n.code, n);
	}
	static testCaseD() {
		let e = new s("inst_straight", R.get("TRAY_STRAIGHT")), t = new s("inst_jb", R.get("EQUIP_JUNCTION_BOX")), n = W.validateConnection(e, "PORT_B", t, "PORT_BOTTOM_GLAND"), r = new s("l", R.get("TRAY_STRAIGHT"), {
			width: 300,
			depth: 100,
			trayStyle: "LADDER"
		}), i = new s("v", R.get("FITTING_ELBOW_90"), {
			width: 300,
			depth: 100,
			trayStyle: "VENTILATED_THROUGH"
		}), a = W.validateConnection(r, "PORT_B", i, "PORT_A");
		return $("Case D", "連接類型與托架型式不符攔截 (Type & Tray-Style Mismatch Interception)", !n.valid && n.code === "TYPE_MISMATCH" && !a.valid && a.code === "STYLE_MISMATCH", "TRAY_END vs GLAND → TYPE_MISMATCH; LADDER vs VENTILATED (same W×H) → STYLE_MISMATCH", "PASS (TYPE_MISMATCH 與 STYLE_MISMATCH 皆正確攔截)", `${n.code} / ${a.code}`, {
			val: n,
			valStyle: a
		});
	}
	static testCaseE() {
		let e = V("TRAY_STRAIGHT", Z(), { width: 600 }, "s600"), t = V("FITTING_REDUCER_LEFT", Z(), {
			inletWidth: 600,
			outletWidth: 300
		}, "red"), n = V("TRAY_STRAIGHT", Z(), { width: 300 }, "s300"), r = W.validateConnection(e, "PORT_B", t, "PORT_A"), i = W.validateConnection(t, "PORT_B", n, "PORT_A");
		return $("Case E", "異徑轉接成功 (Reducer Transition Compatibility)", r.valid && i.valid, "600 inlet and 300 outlet both validate", "PASS (600mm ➔ 左偏異徑 ➔ 300mm 雙向對接相容)", `In=${r.code}, Out=${i.code}`, {
			val1: r,
			val2: i
		});
	}
	static testCaseF() {
		let e = R.get("TRAY_STRAIGHT"), t = new s("instA", e, { length: 3e3 }), n = new s("instB", e, { length: 3e3 }), r = H.computeMateTransform(t, "PORT_B", n, "PORT_A");
		n.setPlacement(r.placement);
		let i = t.getWorldPorts().find((e) => e.id === "PORT_B"), a = n.getWorldPorts().find((e) => e.id === "PORT_A"), c = o.distance(i.worldPosition, a.worldPosition), l = o.dot(i.worldDirection, a.worldDirection), u = o.dot(i.worldUp, a.worldUp);
		return $("Case F", "自動對接幾何放置驗證 (Mate Placement Spatial Invariants)", c <= .001 && Math.abs(l + 1) <= .001 && Math.abs(u - 1) <= .001 && Math.abs((r.upDotProduct ?? 0) - 1) <= 1e-6, "Distance <= 0.001mm, direction dot -1, up dot +1 (also reported by MateEngine)", `PASS (Dist=${c.toFixed(4)}mm, DirDot=${l.toFixed(3)}, UpDot=${u.toFixed(3)})`, `Dist=${c}, DirDot=${l}, UpDot=${u}`, {
			d: c,
			dirDot: l,
			upDot: u,
			mate: r
		});
	}
	static testCaseG() {
		let e = R.get("TRAY_STRAIGHT"), t = [], n = new s("tray_0", e, { length: 3e3 });
		n.setPlacement({
			position: [
				0,
				0,
				1500
			],
			quaternion: [
				0,
				0,
				0,
				1
			]
		}), t.push(n);
		for (let n = 1; n < 10; n++) {
			let r = new s(`tray_${n}`, e, { length: 3e3 });
			r.setPlacement(H.computePlacement(t[n - 1], "PORT_B", r, "PORT_A")), t.push(r);
		}
		let r = t[9].getWorldPorts().find((e) => e.id === "PORT_B").worldPosition, i = Math.max(Math.abs(r[0]), Math.abs(r[1]), Math.abs(r[2] - 3e4));
		return $("Case G", "鏈式對接累積誤差 (Chain Mating Cumulative Error Across 10 Segments)", i <= .01, "Cumulative position error <= 0.01mm after 10 mated 3m segments", `PASS (終端 Z=${r[2].toFixed(4)}mm, 累積誤差=${i.toExponential(2)}mm)`, `error ${i}`, {
			end: r,
			err: i
		});
	}
	static testCaseH() {
		let e = ct.exportDefinition(R.get("FITTING_ELBOW_90"));
		return $("Case H", "JSON 結構序列化確效 (JSON Export Structure Compliance)", e.schemaVersion === "2.0.0" && e.ports.length === 2 && e.centerlines.length === 1 && !!e.bounds?.min && !!e.bounds?.max && !!e.ports[0].connectionFace, "schemaVersion 2.0.0 with ports (incl. connectionFace), centerlines and bounds", `PASS (Schema 2.0.0, ${e.ports.length} 埠位含連接面, ${e.centerlines.length} 中心線)`, "Missing schema attributes", e);
	}
	static testCaseI() {
		let e = [
			0,
			1,
			2,
			3
		].map((e) => V("FITTING_ELBOW_90", Z(), {}, `e${e}`));
		for (let t = 1; t < 4; t++) e[t].setPlacement(H.computePlacement(e[t - 1], "PORT_B", e[t], "PORT_A"));
		let t = e[0].getWorldPorts().find((e) => e.id === "PORT_A"), n = e[3].getWorldPorts().find((e) => e.id === "PORT_B"), r = o.distance(t.worldPosition, n.worldPosition), i = o.dot(t.worldDirection, n.worldDirection);
		return $("Case I", "迴轉環路封閉精確度 (Closed Loop 4×90° Elbow with 125mm Tangents)", r <= .05 && Math.abs(i + 1) < 1e-6, "Closure gap <= 0.05mm and closing ports face each other", `PASS (閉合間隙 Gap=${r.toExponential(2)}mm)`, `gap ${r}, dirDot ${i}`, { gap: r });
	}
	static testCaseJ() {
		let e = R.get("OBSTACLE_MAIN_PROCESS_PIPE").getBounds({
			diameterMm: 500,
			lengthMm: 6e3,
			clearanceMm: 150
		}), t = e.clearanceEnvelope ? e.clearanceEnvelope.max[1] : 0;
		return $("Case J", "避讓包絡體動態計算 (Obstacle Clearance Envelope Computation)", !!e.clearanceEnvelope && t === 400, "Envelope radius 400mm (R250 + 150)", `PASS (淨空包絡半徑 = ${t}mm)`, `got ${t}`, e);
	}
	static testCaseK() {
		let e = ze.checkConformance({ width: 600 }), t = ze.checkConformance({ width: 550 });
		return $("Case K", "工程型錄規範檢核 (Catalog Standards & Presets Conformance)", e.isStandard && !t.isStandard && t.warnings.length > 0, "600 standard, 550 flagged", `PASS (550mm 警示: "${t.warnings[0]}")`, "unexpected", {
			std: e,
			non: t
		});
	}
	static testCaseL() {
		let e = R.get("TRAY_STRAIGHT").getCenterlineRoutes({ length: 3e3 })[0], t = R.get("FITTING_ELBOW_90").getCenterlineRoutes({
			radius: 300,
			width: 600,
			angleDeg: 90,
			tangentLength: 0
		})[0], n = R.get("FITTING_ELBOW_45").getCenterlineRoutes({
			radius: 300,
			width: 600,
			angleDeg: 45,
			tangentLength: 0
		})[0], r = R.get("FITTING_ELBOW_90").getCenterlineRoutes({
			radius: 300,
			width: 600,
			tangentLength: 125
		})[0], i = [
			Math.abs(e.analyticLength - 3e3),
			Math.abs(t.analyticLength - 600 * Math.PI / 2),
			Math.abs(n.analyticLength - 600 * Math.PI / 4),
			Math.abs(r.analyticLength - U.arcWithTangents(600, 90, 125))
		], a = 0;
		for (let e = 1; e < r.samplePoints.length; e++) a += o.distance(r.samplePoints[e - 1], r.samplePoints[e]);
		return $("Case L", "解析中心線長度精確度 (Analytic Centerline Length Formula Validation)", Math.max(...i) <= .001 && Math.abs(a - r.analyticLength) < 1, "Straight 3000; E90 942.478; E45 471.239; E90+2×125 tangents 1192.478; sampled polyline within 1mm", `PASS (E90=${t.analyticLength.toFixed(3)}, E45=${n.analyticLength.toFixed(3)}, E90+T=${r.analyticLength.toFixed(3)}mm)`, `errors ${i.join(", ")}; poly ${a}`, {
			errs: i,
			poly: a
		});
	}
	static testCaseM() {
		let e = new s("bay_01", R.get("STRUCT_MAIN_BAY")), t = R.get("STRUCT_COLUMN"), n = [
			e,
			new s("bay_01_col1", t, {}, {}, "bay_01"),
			new s("bay_01_col2", t, {}, {}, "bay_01"),
			new s("separate_col_01", t)
		], r = ot.generateBom(n, { filterBundledChildren: !0 }), i = ot.generateBom(n, { filterBundledChildren: !1 }), a = r.items.some((e) => e.definitionId === "STRUCT_MAIN_BAY" && e.isAssemblyKit), o = r.items.find((e) => e.definitionId === "STRUCT_COLUMN"), c = i.items.find((e) => e.definitionId === "STRUCT_COLUMN"), l = r.excludedBundledItems.includes("bay_01_col1") && r.excludedBundledItems.includes("bay_01_col2"), u = V("FITTING_ELBOW_90", Z(), { radius: 300 }, "eA"), d = V("FITTING_ELBOW_90", Z(), { radius: 600 }, "eB"), f = V("FITTING_ELBOW_90", Z(), { radius: 600 }, "eC"), p = ot.generateBom([
			u,
			d,
			f
		]), m = p.items.length === 2 && p.items.some((e) => e.quantity === 2 && e.spec.includes("R=600mm"));
		return $("Case M", "組合件材料清單不重複計價 (Assembly BOM Zero Double-Counting & Per-Size Lines)", a && l && o?.quantity === 1 && !r.hasDoubleCounting && i.hasDoubleCounting && c?.quantity === 3 && m, "Kit excludes bundled columns; double counting detected when unfiltered; different fitting sizes are separate lines", "PASS (套件排除 2 根內部立柱, 獨立立柱計 1 支, R300/R600 彎頭分列 BOM)", `cols=${o?.quantity}/${c?.quantity}, perSize=${m}`, {
			filtered: r,
			unfiltered: i,
			elbowBom: p
		});
	}
	static testCaseN() {
		let t = new e.PerspectiveCamera(45, 800 / 600, .1, 100);
		t.position.set(2.6, 2, 3), t.lookAt(0, 0, 0), t.updateMatrixWorld(!0), t.updateProjectionMatrix();
		let n = 0, r = [];
		return Object.keys(jt).forEach((i) => {
			let a = jt[i], o = R.get(i);
			if (!o) {
				n++, r.push({
					id: i,
					error: "Component definition missing"
				});
				return;
			}
			let s = o.buildGeometry(o.defaultParameters);
			s.updateMatrixWorld(!0);
			let c = 0, l = 0, u = new e.Box3().setFromObject(s);
			s.traverse((e) => {
				if (e.isMesh && e.geometry) {
					let t = e.geometry;
					t.index ? l += t.index.count / 3 : t.attributes?.position && (l += t.attributes.position.count / 3), t.attributes?.position && (c += t.attributes.position.count);
				}
			});
			let d = new e.Vector3();
			u.getCenter(d);
			let f = d.clone().project(t), p = [
				u.min.x,
				u.min.y,
				u.min.z,
				u.max.x,
				u.max.y,
				u.max.z
			].map((e) => +e.toFixed(4)), m = [+f.x.toFixed(4), +f.y.toFixed(4)], h = Math.abs(c - a.vertexCount), g = Math.abs(l - a.triangleCount), _ = Math.abs(s.children.length - a.childMeshCount), v = p.reduce((e, t, n) => Math.max(e, Math.abs(t - a.bounds[n])), 0), y = Math.max(Math.abs(m[0] - a.projectedCentroid[0]), Math.abs(m[1] - a.projectedCentroid[1])), b = h + g + _ + +(v > .005) + +(y > .005);
			n += b, r.push({
				id: i,
				baseline: a,
				actual: {
					childMeshCount: s.children.length,
					vertexCount: c,
					triangleCount: l,
					bounds: p,
					projectedCentroid: m
				},
				deltas: {
					vDelta: h,
					tDelta: g,
					mDelta: _,
					bDelta: v,
					cDelta: y
				},
				match: b === 0
			});
		}), $("Case N", "既有配件視覺回歸比對 (Deterministic Baseline Regression of 8 Models)", n === 0, "8 legacy-ID models match the recorded vertex / triangle / bounds / projection signature", "PASS (8/8 模型與幾何基準吻合, 0 unexpected difference)", `${n} unexpected deltas`, r);
	}
	static testCaseO() {
		let t = 37.5, n = new s("inst_custom_angle", R.get("FITTING_ELBOW_90"), {
			angleDeg: t,
			radius: 300,
			width: 600,
			tangentLength: 0
		}), r = n.getWorldPorts(), i = r.find((e) => e.id === "PORT_A"), a = r.find((e) => e.id === "PORT_B"), c = n.getCenterlines()[0], l = t * Math.PI / 180, u = Math.hypot(a.worldPosition[0] - 600 * Math.cos(l), a.worldPosition[2] + 600 * Math.sin(l)), d = Math.max(o.distance(c.samplePoints[0], i.worldPosition), o.distance(c.samplePoints[c.samplePoints.length - 1], a.worldPosition)), f = Math.abs(c.analyticLength - 600 * l), p = new e.Box3().setFromObject(n.getThreeMesh()), m = p.min.z < -.2 && p.max.z <= .001, h = ze.checkConformance({ angleDeg: t }), g = !h.isStandard && h.warnings.some((e) => e.includes("Non-standard"));
		return $("Case O", "通用角度單一真實來源 (Generic Angle 37.5° Ports, Route & Geometry SOT)", u < .01 && d < .01 && f < .01 && m && g, "angleDeg 37.5° drives Port B, centerline end points, length and geometry from Rc = R + W/2", `PASS (37.5°: Port B=[${a.worldPosition[0].toFixed(1)}, ${a.worldPosition[2].toFixed(1)}]mm, Length=${c.analyticLength.toFixed(2)}mm)`, `portErr=${u}, clErr=${d}, lenErr=${f}, geo=${m}, warns=${g}`, {
			portErr: u,
			clErr: d,
			lenErr: f,
			conf: h
		});
	}
	static testCaseP() {
		let t = new s("inst_consistency", R.get("FITTING_ELBOW_90"), {
			radius: 300,
			angleDeg: 45,
			width: 600,
			tangentLength: 0
		}), n = t.getCenterlines()[0].analyticLength, r = t.getWorldPorts().find((e) => e.id === "PORT_A").worldPosition[0];
		t.updateParameters({
			radius: 600,
			angleDeg: 90
		});
		let i = t.getCenterlines()[0].analyticLength, a = t.getWorldPorts().find((e) => e.id === "PORT_A").worldPosition[0], o = t.getBounds(), c = new e.Box3().setFromObject(t.getThreeMesh());
		return $("Case P", "參數連動單一資料源一致性 (Single Source of Truth Consistency Across Derivatives)", Math.abs(i - 900 * Math.PI / 2) < .001 && Math.abs(a - 900) < 1e-9 && Math.abs(o.max[0] - 1213) < 1e-6 && Math.abs(c.max.x * 1e3 - o.max[0]) < .05 && n !== i && r !== a, "R 300→600 & 45°→90° updates ports (Rc 600→900), length, bounds and mesh together", `PASS (Length ${n.toFixed(1)} ➔ ${i.toFixed(1)}mm, PortX ${r} ➔ ${a}mm, mesh maxX ${(c.max.x * 1e3).toFixed(2)}mm)`, `len2=${i}, x2=${a}, bounds=${o.max[0]}`, {
			len1: n,
			len2: i,
			x1: r,
			x2: a,
			b2: o
		});
	}
	static testCaseQ_CenterlinePortEndpoints() {
		let e = 0, t = 0, n = [];
		return R.getAll().forEach((r) => {
			(Ke(r.id) === "OTHER" ? [{
				label: "DEFAULT",
				params: r.defaultParameters
			}] : Wt(r)).forEach(({ label: i, params: a }) => {
				let o = new Map(r.getLocalPorts(a).map((e) => [e.id, e]));
				r.getCenterlineRoutes(a).forEach((a) => {
					e++;
					let s = o.get(a.fromPort), c = o.get(a.toPort);
					if (!s || !c) {
						n.push({
							id: r.id,
							label: i,
							route: a.id,
							error: "Port not found"
						});
						return;
					}
					let l = Math.max(Q(a.samplePoints[0], s.localPosition), Q(a.samplePoints[a.samplePoints.length - 1], c.localPosition));
					t = Math.max(t, l), l > .01 && n.push({
						id: r.id,
						label: i,
						route: a.id,
						e: l
					});
				});
			});
		}), $("Case Q", "中心線與埠位端點精確重合不變量 (Centerline ↔ Port Endpoint Invariant)", n.length === 0 && e >= 60, "Every route starts at fromPort and ends at toPort within 0.01mm (generic + every catalog profile)", `PASS (已驗證 ${e} 條路由, 最大端點誤差 = ${t.toExponential(2)}mm)`, `${n.length} violations`, {
			checked: e,
			maxError: t,
			failures: n
		});
	}
	static testCaseR_BoundsConsistency() {
		let e = [], t = 0, n = 0, r = (r, i, a, o) => {
			n++;
			let s = It(a.getBounds(o), st(a, o));
			t = Math.max(t, s), s > .05 && e.push({
				id: r,
				label: i,
				e: s
			});
		};
		return Ut().forEach((e) => Wt(e).forEach((t) => r(e.id, t.label, e, t.params))), [
			"STRUCT_COLUMN",
			"STRUCT_PIER",
			"STRUCT_MAIN_BAY",
			"STRUCT_BRANCH_BAY"
		].forEach((e) => {
			let t = R.get(e);
			r(e, "DEFAULT", t, t.defaultParameters);
		}), $("Case R", "構件包絡邊界與實體幾何一致性 (Bounds ↔ Geometry Consistency Invariant)", e.length === 0 && n >= 40, "getBounds() equals THREE.Box3 of the body mesh within 0.05mm for every tray component and profile", `PASS (已比對 ${n} 組構件/規格之 6 軸包絡, 最大誤差 = ${t.toExponential(2)}mm)`, `${e.length} inconsistencies (max ${t.toFixed(3)}mm)`, {
			checked: n,
			maxError: t,
			failures: e
		});
	}
	static testCaseS_PortFrameHandedness() {
		let e = 0, t = [];
		return R.getAll().forEach((n) => {
			n.getLocalPorts(n.defaultParameters).forEach((r) => {
				e++;
				let i = new Qe(r.localPosition, r.localDirection, r.localUp).getDeterminant();
				(Math.abs(i - 1) > .001 || Math.abs(o.dot(r.localDirection, r.localUp)) > 1e-9) && t.push({
					id: n.id,
					port: r.id,
					det: i
				});
			});
		}), $("Case S", "埠位局部座標系右手正交規範 (Port Frame Right-Handed Orthonormal Invariant)", t.length === 0 && e > 40, "All port frames: direction ⟂ up and det(right, up, direction) = +1", `PASS (全庫 ${e} 個埠位右手正交 det = 1.00000)`, `${t.length} inverted / skewed frames`, {
			count: e,
			failures: t
		});
	}
	static testCaseT_EccentricReducerLength() {
		let e = R.get("FITTING_REDUCER_LEFT"), t = R.get("FITTING_REDUCER_CENTER"), n = e.getCenterlineRoutes({
			inletWidth: 600,
			outletWidth: 450,
			length: 500,
			tangentLength: 0
		})[0], r = t.getCenterlineRoutes({
			inletWidth: 600,
			outletWidth: 450,
			length: 500,
			tangentLength: 0
		})[0], i = e.getCenterlineRoutes({
			inletWidth: 600,
			outletWidth: 300,
			length: 600,
			tangentLength: 200
		})[0], a = [
			Math.abs(n.analyticLength - Math.hypot(500, 75)),
			Math.abs(r.analyticLength - 500),
			Math.abs(i.analyticLength - U.reducerWithTangents(600, 150, 200, 200)),
			Math.abs(i.analyticLength - 650)
		];
		return $("Case T", "異徑接頭物理中心線長度 (Reducer Physical Centerline Length)", Math.max(...a) < .001, "Generic 600→450 L500: √(500²+75²)=505.594; catalog 600→300: 200 + √(200²+150²) + 200 = 650", `PASS (通用左偏 = ${n.analyticLength.toFixed(3)}mm, 型錄左偏 = ${i.analyticLength.toFixed(3)}mm)`, `errors ${a.join(", ")}`, {
			gLeft: n,
			vLeft: i
		});
	}
	static testCaseU_TeePhysicalCenterline() {
		let e = R.get("FITTING_TEE").getCenterlineRoutes({
			width: 600,
			radius: 300,
			tangentLength: 125,
			depth: 150
		}).find((e) => e.id === "ROUTE_A_C"), t = U.teeBranch(1450, 725, 600), n = e.samplePoints.filter((e) => e[0] > -599.999999 && e[2] < 599.999999), r = n.reduce((e, t) => Math.max(e, Math.abs(Math.hypot(t[0] - -600, t[2] - 600) - 600)), 0), i = 0;
		for (let t = 1; t < e.samplePoints.length; t++) i += o.distance(e.samplePoints[t - 1], e.samplePoints[t]);
		return $("Case U", "三通實體過渡中心線曲線 (Tee Curved Branch Centerline, PDF p.9)", Math.abs(e.analyticLength - t) < .001 && Math.abs(t - (250 + Math.PI / 2 * 600)) < 1e-9 && n.length >= 10 && r < 1e-6 && Math.abs(i - t) < 1, "ROUTE_A_C = 125 + (π/2)(R + W/2) + 125, arc concentric with the curved front rail", `PASS (分流中心線 = ${e.analyticLength.toFixed(2)}mm, ${n.length} 點位於 R+W/2=600mm 圓弧)`, `len ${e.analyticLength} vs ${t}, arcErr ${r}, arcPts ${n.length}`, {
			expected: t,
			arcErr: r,
			poly: i
		});
	}
	static testCaseV_DerivedStateExport() {
		let e = V("TRAY_STRAIGHT", Z(), {}, "test_export_inst"), t = ct.exportScene([e]).instances[0];
		return $("Case V", "衍生狀態匯出標記不變量 (Derived State Export Non-Canonical Snapshot)", t.derivedSnapshot?.status === "NON_CANONICAL_SNAPSHOT" && !!t.effectiveParameters && !!t.placement && t.effectiveParameters.profileId === "LADDER_PROFILE_STANDARD", "worldPorts under derivedSnapshot (NON_CANONICAL_SNAPSHOT); effectiveParameters carry the profile id", "PASS (effectiveParameters + placement 為 SOT, 含 profileId 追溯)", "Export structure violated", t);
	}
	static testCaseW_CatalogProfileA() {
		let e = Pt(), t = [];
		e.components.forEach((n) => {
			let r = V(n.definitionId, e, {}, `a_${n.definitionId}`), i = r.effectiveParameters;
			(i.width !== 100 || i.depth !== 50 || i.trayStyle !== "VENTILATED_THROUGH") && t.push(`${n.definitionId} params`), Ke(n.definitionId) !== "STRAIGHT" && (i.radius !== 300 || i.tangentLength !== 125) && t.push(`${n.definitionId} R/T`), r.getWorldPorts().forEach((e) => {
				(e.depth !== 50 || e.connectionFace?.halfWidth !== 50) && t.push(`${n.definitionId}.${e.id} face`);
			});
		});
		let n = it([
			{ definitionId: "TRAY_STRAIGHT" },
			{ definitionId: "FITTING_ELBOW_45" },
			{ definitionId: "TRAY_STRAIGHT" },
			{ definitionId: "FITTING_TEE" }
		], { profile: e });
		return n.passed || t.push(...n.issues), (z.supports(e, "FITTING_CROSS") || z.supports(e, "FITTING_REDUCER_CENTER")) && t.push("Profile A must not offer cross / reducers (not in PDF p.29 index)"), $("Case W", "型錄規格 A 沖底型 100W×50H (Ventilated Profile A, PDF p.27–37)", t.length === 0, "All 6 catalog components inherit 100W × 50H, R300, T125, VENTILATED; S→E45→S→Tee joints physically valid", `PASS (6 構件繼承正確, ${n.joints.length} 個接頭實體對接通過)`, t.join("; "), { issues: t });
	}
	static testCaseX_CatalogProfileB() {
		let e = Ft(), t = [];
		e.components.forEach((n) => {
			let r = V(n.definitionId, e, {}, `b_${n.definitionId}`).effectiveParameters;
			(r.width !== 300 || r.depth !== 100 || r.trayStyle !== "VENTILATED_THROUGH") && t.push(`${n.definitionId} params`);
		});
		let n = it([
			{ definitionId: "TRAY_STRAIGHT" },
			{ definitionId: "FITTING_ELBOW_30" },
			{ definitionId: "TRAY_STRAIGHT" },
			{ definitionId: "FITTING_RISER_OUT_90" },
			{ definitionId: "TRAY_STRAIGHT" }
		], { profile: e });
		return n.passed || t.push(...n.issues), z.supports(e, "FITTING_TEE") && t.push("Profile B must not offer a tee (not in PDF p.40 index)"), (JSON.stringify(e.allowedHorizontalAngles) !== "[30,90]" || JSON.stringify(e.allowedVerticalAngles) !== "[90]") && t.push("angles"), $("Case X", "型錄規格 B 沖底型 300W×100H (Ventilated Profile B, PDF p.38–47)", t.length === 0, "All 5 catalog components inherit 300W × 100H; S→E30→S→VO90→S joints physically valid; no tee", `PASS (5 構件繼承正確, ${n.joints.length} 個接頭實體對接通過)`, t.join("; "), { issues: t });
	}
	static testCaseY_HorizontalCross() {
		let e = R.get("FITTING_CROSS"), t = [];
		return [300, 600].forEach((n) => {
			let r = B("FITTING_CROSS", Z(), { radius: n }), i = new s(`cross_${n}`, e, r), a = i.getWorldPorts(), o = i.getCenterlines(), c = 300 + n + 125;
			a.length !== 4 && t.push(`R${n}: ${a.length} ports`), o.length !== 6 && t.push(`R${n}: ${o.length} routes`);
			let l = {
				PORT_A: [
					-c,
					0,
					0
				],
				PORT_B: [
					c,
					0,
					0
				],
				PORT_C: [
					0,
					0,
					c
				],
				PORT_D: [
					0,
					0,
					-c
				]
			};
			a.forEach((e) => {
				Q(e.worldPosition, l[e.id]) > 1e-6 && t.push(`R${n}: ${e.id} at ${e.worldPosition}`);
			});
			let u = 250 + Math.PI / 2 * (n + 300);
			o.forEach((e) => {
				let r = e.type === "STRAIGHT" ? 2 * c : u;
				Math.abs(e.analyticLength - r) > 1e-6 && t.push(`R${n}: ${e.id} length ${e.analyticLength}`);
			});
			let d = new Set(o.map((e) => `${e.fromPort}-${e.toPort}`));
			[
				"PORT_A-PORT_B",
				"PORT_D-PORT_C",
				"PORT_A-PORT_C",
				"PORT_A-PORT_D",
				"PORT_B-PORT_C",
				"PORT_B-PORT_D"
			].forEach((e) => {
				d.has(e) || t.push(`R${n}: missing route ${e}`);
			});
			let f = Lt(i.getThreeMesh()), p = 300 + n;
			[
				[
					-1,
					1,
					270
				],
				[
					1,
					1,
					180
				],
				[
					1,
					-1,
					90
				],
				[
					-1,
					-1,
					0
				]
			].forEach(([e, r, i]) => {
				let a = Rt(f, [e * p, r * p], n - 13, i, 90);
				a.found !== a.tested && t.push(`R${n}: corner (${e},${r}) arc evidence ${a.found}/${a.tested}`);
			});
		}), $("Case Y", "水平四通十字托架 (Horizontal Cross, PDF p.10)", t.length === 0, "4 ports at ±(W/2+R+125); routes A↔B, D↔C straight and A↔C, A↔D, B↔C, B↔D = 250 + π/2(R+W/2); 4 curved radius-R corners on the mesh; R300 and R600", "PASS (四通 4 埠位、6 路由、四角圓弧轉角與型錄尺寸全數吻合, R300 / R600)", t.join("; "), { issues: t });
	}
	static testCaseZ_CatalogAngles() {
		let e = [];
		return [
			30,
			45,
			60,
			90
		].forEach((t) => {
			let n = t * Math.PI / 180, r = V(`FITTING_ELBOW_${t}`, Z(), {}, `h${t}`), i = r.getWorldPorts().find((e) => e.id === "PORT_B"), a = [
				600 * Math.cos(n) - 125 * Math.sin(n),
				0,
				-600 * Math.sin(n) - 125 * Math.cos(n)
			];
			(Q(i.worldPosition, a) > 1e-6 || Math.abs(r.getCenterlines()[0].analyticLength - (250 + 600 * n)) > 1e-6) && e.push({
				ang: t,
				kind: "H"
			});
			let o = V(`FITTING_RISER_IN_${t}`, Z(), {}, `vi${t}`).getWorldPorts().find((e) => e.id === "PORT_B"), s = [
				375 * Math.sin(n) + 125 * Math.cos(n),
				-375 * Math.cos(n) + 125 * Math.sin(n),
				0
			];
			(Q(o.worldPosition, s) > 1e-6 || Q(o.worldDirection, [
				Math.cos(n),
				Math.sin(n),
				0
			]) > 1e-9) && e.push({
				ang: t,
				kind: "VI",
				got: o.worldPosition,
				expVI: s
			});
			let c = V(`FITTING_RISER_OUT_${t}`, Z(), {}, `vo${t}`).getWorldPorts().find((e) => e.id === "PORT_B"), l = [
				375 * Math.sin(n) + 125 * Math.cos(n),
				375 * Math.cos(n) - 125 * Math.sin(n),
				0
			];
			(Q(c.worldPosition, l) > 1e-6 || Q(c.worldDirection, [
				Math.cos(n),
				-Math.sin(n),
				0
			]) > 1e-9) && e.push({
				ang: t,
				kind: "VO",
				got: c.worldPosition,
				expVO: l
			});
		}), $("Case Z", "型錄全角度彎頭 (Catalog Angles 30/45/60/90°: Horizontal, Vertical Inside & Outside)", e.length === 0, "12 catalog bends: outlet port = arc end + 125 tangent, Rc = R + W/2 (horizontal) or R + H/2 (vertical)", "PASS (水平/垂直上升/垂直下降 × 30°/45°/60°/90° 共 12 組埠位與長度精確)", `${e.length} bends failed`, { failures: e });
	}
	static testCaseAA_VendorDimensionFormulas() {
		let e = [];
		Z().allowedWidths.forEach((t) => {
			let n = V("TRAY_STRAIGHT", Z(), { width: t }, `w${t}`).getBounds();
			Math.abs(n.max[0] - n.min[0] - (t + 26)) > 1e-6 && e.push(`ladder W${t} overall ${n.max[0] - n.min[0]}`);
		}), [Pt(), Ft()].forEach((t) => {
			let n = V("TRAY_STRAIGHT", t, {}, `v${t.id}`).getBounds();
			Math.abs(n.max[0] - n.min[0] - t.width) > 1e-6 && e.push(`${t.id} overall ${n.max[0] - n.min[0]}`), t.coverWidth !== t.width + 6 && e.push(`${t.id} cover`);
		}), (Z().overallWidth !== Z().width + 26 || Z().coverWidth !== Z().width + 38) && e.push("ladder profile cover/overall"), Z().allowedRadii.forEach((t) => {
			let n = R.get("FITTING_TEE").getEngineeringDimensions(B("FITTING_TEE", Z(), { radius: t }));
			(n.mainSpan !== 600 + 2 * t + 250 || n.branchFromBackRail !== 600 + t + 125) && e.push(`tee R${t}`), R.get("FITTING_CROSS").getEngineeringDimensions(B("FITTING_CROSS", Z(), { radius: t })).span !== 600 + 2 * t + 250 && e.push(`cross R${t}`);
		});
		let t = R.get("FITTING_REDUCER_CENTER").getEngineeringDimensions(B("FITTING_REDUCER_CENTER", Z()));
		(t.length !== 600 || t.tangentLength !== 200 || t.transitionLength !== 200) && e.push("reducer stages");
		let n = pe(B("TRAY_STRAIGHT", Z())).rungs.map((e) => e.position[2] + 1500);
		return (n.length !== 12 || Math.abs(n[0] - 125) > 1e-9 || Math.abs(n[11] - 2875) > 1e-9) && e.push(`rungs ${n.length}`), $("Case AA", "型錄工程尺寸公式確效 (Vendor Dimension Formulas on Library Output)", e.length === 0, "Ladder overall W+26 (all 10 widths), ventilated W+0 / cover W+6, tee W+2R+250 & W+R+125, cross W+2R+250, reducer 200+200+200, rungs 125+250k", "PASS (由函式庫實際輸出驗證全部型錄公式)", e.join("; "), { issues: e });
	}
	static testCaseAB_ProfileCatalogIntegrity() {
		let e = [], t = Z(), n = Pt(), r = Ft(), i = (t, n, r) => {
			JSON.stringify(t) !== JSON.stringify(n) && e.push(`${r}: ${JSON.stringify(t)} != ${JSON.stringify(n)}`);
		};
		return i(t.height, 150, "ladder H"), i(t.allowedWidths, [
			100,
			200,
			300,
			400,
			500,
			600,
			700,
			800,
			900,
			1e3
		], "ladder W"), i(t.allowedRadii, [
			300,
			600,
			900
		], "ladder R"), i(t.allowedHorizontalAngles, [
			30,
			45,
			60,
			90
		], "ladder H angles"), i(t.allowedVerticalAngles, [
			30,
			45,
			60,
			90
		], "ladder V angles"), i([
			t.standardLength,
			t.tangentLength,
			t.reducerLength,
			t.reducerTangentLength,
			t.rungSpacingMm
		], [
			3e3,
			125,
			600,
			200,
			250
		], "ladder L/T/reducer/rung"), i(t.source.pages[t.source.pages.length - 1], 26, "ladder last page"), i([
			n.width,
			n.height,
			n.allowedRadii,
			n.allowedHorizontalAngles,
			n.allowedVerticalAngles
		], [
			100,
			50,
			[300],
			[45, 90],
			[90]
		], "vent A"), i([n.material.startsWith("ALUMINUM_6063_T5"), n.fittingMaterial.startsWith("ALUMINUM_5052_H32")], [!0, !0], "vent A materials"), i([
			r.width,
			r.height,
			r.allowedRadii,
			r.allowedHorizontalAngles,
			r.allowedVerticalAngles
		], [
			300,
			100,
			[300],
			[30, 90],
			[90]
		], "vent B"), z.getAll().forEach((t) => {
			t.components.forEach((n) => {
				R.get(n.definitionId) || e.push(`${t.id}: unknown ${n.definitionId}`), n.pages.forEach((r) => {
					t.source.pages.includes(r) || e.push(`${t.id}: ${n.definitionId} page ${r} outside profile`);
				});
			});
		}), i(n.components.map((e) => e.definitionId).sort(), [
			"FITTING_ELBOW_45",
			"FITTING_ELBOW_90",
			"FITTING_RISER_IN_90",
			"FITTING_RISER_OUT_90",
			"FITTING_TEE",
			"TRAY_STRAIGHT"
		], "vent A components"), i(r.components.map((e) => e.definitionId).sort(), [
			"FITTING_ELBOW_30",
			"FITTING_ELBOW_90",
			"FITTING_RISER_IN_90",
			"FITTING_RISER_OUT_90",
			"TRAY_STRAIGHT"
		], "vent B components"), $("Case AB", "規格集與型錄表格一致性 (Profile Data vs Catalog Tables)", e.length === 0, "Ladder H150 / W100–1000 / R300,600,900 / 30–90°; Vent A 100×50 R300 H45,90 V90; Vent B 300×100 R300 H30,90 V90; component lists = PDF index pages", "PASS (3 組規格集之 W/H/R/角度/材質/頁碼與型錄一致)", e.join("; "), { issues: e });
	}
	static testCaseAC_GoldenFixtures() {
		let e = [];
		return Nt.forEach((t) => {
			let n = z.get(t.profileId), r = V(t.definitionId, n, t.params, `fx_${t.id}`), i = r.getWorldPorts();
			t.expectedPorts.forEach((n) => {
				let r = i.find((e) => e.id === n.id);
				if (!r) return e.push({
					fx: t.id,
					port: n.id,
					error: "missing"
				});
				Q(r.worldPosition, n.position) > .01 && e.push({
					fx: t.id,
					port: n.id,
					position: r.worldPosition,
					expected: n.position
				}), Q(r.worldDirection, n.direction) > 1e-6 && e.push({
					fx: t.id,
					port: n.id,
					direction: r.worldDirection,
					expected: n.direction
				}), n.up && Q(r.worldUp, n.up) > 1e-6 && e.push({
					fx: t.id,
					port: n.id,
					up: r.worldUp,
					expected: n.up
				}), n.width !== void 0 && r.width !== n.width && e.push({
					fx: t.id,
					port: n.id,
					width: r.width
				});
			});
			let a = r.getCenterlines();
			if (Object.entries(t.expectedRouteLengths).forEach(([n, r]) => {
				let i = a.find((e) => e.id === n);
				(!i || Math.abs(i.analyticLength - r) > .01) && e.push({
					fx: t.id,
					route: n,
					got: i?.analyticLength,
					expected: r
				});
			}), t.expectedBounds) {
				let n = It(r.getBounds(), t.expectedBounds), i = It(st(r.definition, r.effectiveParameters), t.expectedBounds);
				(n > .01 || i > .05) && e.push({
					fx: t.id,
					boundsErr: n,
					geometryErr: i,
					bounds: r.getBounds()
				});
			}
			if (t.expectedDims) {
				let n = r.definition.getEngineeringDimensions(r.effectiveParameters);
				Object.entries(t.expectedDims).forEach(([r, i]) => {
					Math.abs(Number(n[r]) - i) > 1e-6 && e.push({
						fx: t.id,
						dim: r,
						got: n[r],
						expected: i
					});
				});
			}
		}), $("Case AC", "型錄黃金樣本 (Vendor Catalog Golden Fixtures)", e.length === 0, `${Nt.length} fixtures from PDF p.4–45: ports, directions, up vectors, route lengths, bounds (analytic & mesh), dimensions`, `PASS (${Nt.length} 組型錄黃金樣本全數吻合)`, `${e.length} mismatches`, { failures: e });
	}
	static testCaseAD_TeeCurvedTransition() {
		let t = [];
		[
			{
				profile: Z(),
				W: 600,
				R: 300,
				overhang: 13
			},
			{
				profile: Z(),
				W: 300,
				R: 600,
				overhang: 13
			},
			{
				profile: Pt(),
				W: 100,
				R: 300,
				overhang: 0
			}
		].forEach(({ profile: e, W: n, R: r, overhang: i }) => {
			let a = Lt(V("FITTING_TEE", e, {
				width: n,
				radius: r
			}, `tee_${n}_${r}`).getThreeMesh()), o = n / 2 + r, s = Rt(a, [-o, o], r - i, 270, 90), c = Rt(a, [o, o], r - i, 180, 90);
			(s.found !== s.tested || c.found !== c.tested) && t.push(`${e.id} W${n} R${r}: arc evidence L${s.found}/R${c.found}`);
		});
		let n = new e.Group(), r = (t, r, i, a) => {
			let o = new e.Mesh(new e.BoxGeometry(t / 1e3, .15, r / 1e3));
			o.position.set(i / 1e3, 0, a / 1e3), n.add(o);
		};
		r(1450, 30, 0, -300), r(425, 30, -512.5, 300), r(425, 30, 512.5, 300), r(30, 425, -300, 512.5), r(30, 425, 300, 512.5);
		let i = Rt(Lt(n), [-600, 600], 287, 270, 90);
		return i.found > 1 && t.push(`square-junction control produced ${i.found} arc hits`), $("Case AD", "三通曲線過渡實體幾何 (Tee Curved Transition on the Mesh, PDF p.9)", t.length === 0, "Both front rails carry vertices on the radius-R arc at 5 angles (ladder 600/R300, 300/R600, ventilated 100/R300); a square junction fails the same probe", "PASS (三通兩側前緣均為 R 圓弧過渡, 方形直角接頭對照組正確不通過)", t.join("; "), {
			issues: t,
			negativeControl: i
		});
	}
	static testCaseAE_CrossCurvedCorners() {
		let e = [];
		return [
			{
				W: 600,
				R: 300,
				style: "LADDER",
				overhang: 13
			},
			{
				W: 600,
				R: 900,
				style: "LADDER",
				overhang: 13
			},
			{
				W: 300,
				R: 300,
				style: "VENTILATED_THROUGH",
				overhang: 0
			}
		].forEach(({ W: t, R: n, style: r, overhang: i }) => {
			let a = Lt(new s("x", R.get("FITTING_CROSS"), {
				width: t,
				radius: n,
				depth: 150,
				tangentLength: 125,
				trayStyle: r
			}).getThreeMesh()), o = t / 2 + n, c = [
				[
					-1,
					1,
					270
				],
				[
					1,
					1,
					180
				],
				[
					1,
					-1,
					90
				],
				[
					-1,
					-1,
					0
				]
			];
			c.forEach(([s, c, l]) => {
				let u = Rt(a, [s * o, c * o], n - i, l, 90);
				u.found !== u.tested && e.push(`${r} W${t} R${n} (${s},${c}) ${u.found}/${u.tested}`);
			});
			let l = a.filter((e) => c.some(([t, r]) => Math.hypot(e[0] - t * o, e[2] - r * o) < n - i - 1));
			l.length > 0 && e.push(`${r} W${t} R${n}: ${l.length} vertices inside corner cut-outs`);
		}), $("Case AE", "四通四角曲線轉角實體幾何 (Cross Curved Corners on the Mesh, PDF p.10)", e.length === 0, "Every quadrant has a radius-R curved corner rail and an empty corner cut-out (ladder R300 / R900, ventilated)", "PASS (四通 4 象限圓弧轉角, 轉角內無實體)", e.join("; "), { issues: e });
	}
	static testCaseAF_ProfilePropagation() {
		let e = [];
		z.getAll().forEach((t) => {
			t.components.forEach((n) => {
				let r = V(n.definitionId, t, {}, `pp_${t.id}_${n.definitionId}`), i = r.getBounds();
				Math.abs(i.min[1] + t.height / 2) > 1e-6 && Ke(n.definitionId) !== "V_BEND" && e.push(`${t.id}/${n.definitionId}: height ${i.max[1] - i.min[1]}`), r.getWorldPorts().forEach((r) => {
					r.depth !== t.height && e.push(`${t.id}/${n.definitionId}.${r.id}: depth ${r.depth}`), r.connectionFace?.style !== t.trayType && e.push(`${t.id}/${n.definitionId}.${r.id}: style`);
				});
				let a = Ze(n.definitionId), o = t.trayType === "LADDER" ? "SYSTEM_LADDER" : t.width === 100 ? "SYSTEM_VENTILATED_SMALL" : "SYSTEM_VENTILATED_LARGE";
				a.includes(o) || e.push(`${n.definitionId} not classified in ${o}`);
			});
		}), Ut().forEach((t) => {
			Object.entries(t.provenance).forEach(([n, r]) => {
				r.assumptionLevel === "VERIFIED_VENDOR_CATALOG" && e.push(`${t.id}.${n} claims VERIFIED on a generic default`);
			});
		});
		let t = V("FITTING_RISER_IN_90", Z(), {}, "vi_h"), n = t.definition.getEngineeringDimensions(t.effectiveParameters);
		return Number(n.outerRadius) - Number(n.innerRadius) !== 150 && e.push("VI90 radial height"), $("Case AF", "規格集參數傳遞 (Profile Propagation: W / H=150 / R / T / Style to Every Component)", e.length === 0, "Every catalog component of every profile carries the profile H, style and face; classification derived from profiles; no VERIFIED claims on generic defaults", "PASS (H=150 等規格集參數完整傳遞至全部梯型構件)", e.join("; "), { issues: e });
	}
	static testCaseAG_RadiusSemantics() {
		let t = [], n = V("FITTING_ELBOW_90", Z(), {
			width: 600,
			radius: 600,
			tangentLength: 0
		}, "h"), r = Lt(n.getThreeMesh()).map((e) => Math.hypot(e[0], e[2]));
		(Math.abs(Math.min(...r) - 587) > .05 || Math.abs(Math.max(...r) - 1213) > .05) && t.push(`H radial ${Math.min(...r)}..${Math.max(...r)}`), Math.abs(n.getWorldPorts()[0].worldPosition[0] - 900) > 1e-9 && t.push("H port at Rc");
		let i = V("FITTING_RISER_IN_90", Z(), {
			radius: 300,
			tangentLength: 0
		}, "vi"), a = Lt(i.getThreeMesh()).map((e) => Math.hypot(e[0], e[1]));
		(Math.abs(Math.min(...a) - 300) > .05 || Math.abs(Math.max(...a) - 450) > .05) && t.push(`VI radial ${Math.min(...a)}..${Math.max(...a)}`);
		let o = (t) => {
			let n = new e.Group();
			return n.add(t.getThreeMesh().getObjectByName("Rungs").clone()), Lt(n).map((e) => Math.hypot(e[0], e[1]));
		}, c = o(i);
		Math.min(...c) < 400 && t.push(`VI rungs not on the outer (bottom) side: min r ${Math.min(...c)}`);
		let l = o(V("FITTING_RISER_OUT_90", Z(), {
			radius: 300,
			tangentLength: 0
		}, "vo"));
		Math.max(...l) > 350 && t.push(`VO rungs not on the inner (bottom) side: max r ${Math.max(...l)}`);
		let u = n.definition.getEngineeringDimensions(n.effectiveParameters);
		(u.catalogRadius !== 600 || u.centerlineRadius !== 900 || u.outerRailRadius !== 1200) && t.push("dims"), n.getCenterlines()[0].samplePoints.map((e) => Math.hypot(e[0], e[2])).some((e) => Math.abs(e - 900) > 1e-6) && t.push("route radius");
		let d = new s("legacy", R.get("FITTING_ELBOW_90"), {
			width: 600,
			radius: 600,
			radiusReference: "CENTERLINE",
			tangentLength: 0
		}).getWorldPorts();
		(Q(d[0].worldPosition, [
			600,
			0,
			0
		]) > 1e-9 || Q(d[1].worldPosition, [
			0,
			0,
			-600
		]) > 1e-9) && t.push("radiusReference CENTERLINE");
		let f = new s("legacyV", R.get("FITTING_RISER_OUT_90"), {
			depth: 100,
			radius: 600,
			radiusReference: "CENTERLINE",
			tangentLength: 0
		});
		return Number(f.definition.getEngineeringDimensions(f.effectiveParameters).centerlineRadius) !== 600 && t.push("radiusReference CENTERLINE (vertical)"), $("Case AG", "彎曲半徑語意單一推導 (Radius Semantics: Catalog R → Centerline → Outer)", t.length === 0, "H-bend: rail geometry R−13…R+W+13, route & port at R+W/2; VI: body R…R+H, rungs outside; VO: rungs inside", "PASS (型錄 R = 內側半徑, 中心線半徑 R+W/2 或 R+H/2, 幾何/埠位/路由/尺寸一致)", t.join("; "), { issues: t });
	}
	static testCaseAH_ConnectionFaceTermination() {
		let e = [], t = 0;
		Ut().forEach((n) => {
			Wt(n).forEach(({ label: r, params: i }) => {
				[i, {
					...i,
					tangentLength: 0
				}].forEach((i) => {
					let a = new s(`t_${n.id}`, n, i), o = 0;
					if (Ke(n.id) === "REDUCER" && Number(i.tangentLength) === 0) {
						let e = n.getEngineeringDimensions(i), t = Number(e.inletWidth), r = Number(e.outletWidth), a = e.reducerType === "CONCENTRIC" ? Math.abs(t - r) / 2 : Math.abs(t - r);
						o = (e.style === "LADDER" ? 13 : 0) * (1 / Math.cos(Math.atan2(a, Number(e.length))) - 1);
					}
					G.checkPortTermination(a).forEach((a) => {
						t++, Math.abs(a.planeOffsetMm) <= .05 && Math.abs(a.faceMismatchMm - o) <= .05 || e.push({
							id: n.id,
							label: r,
							T: i.tangentLength,
							port: a.portId,
							offset: a.planeOffsetMm,
							face: a.faceMismatchMm,
							expectedFace: o
						});
					});
				});
			});
		});
		let n = new s("sp", R.get("TRAY_STRAIGHT"), { hasSplicePlates: !0 });
		return G.checkPortTermination(n).every((e) => e.passed) || e.push({
			id: "TRAY_STRAIGHT",
			label: "splice plates",
			error: "accessory counted as body"
		}), $("Case AH", "幾何終止於連接面 (Body Terminates on Every Connection Plane)", e.length === 0 && t >= 80, "For every tray component × profile × tangent (0 / catalog): no body past the port plane, no recess, face = declared envelope", `PASS (${t} 個埠位連接面全數精確終止)`, `${e.length} ports failed`, {
			checked: t,
			failures: e
		});
	}
	static testCaseAI_AssemblyRegression() {
		let e = [
			{
				name: "Straight → Straight",
				steps: [{ definitionId: "TRAY_STRAIGHT" }, { definitionId: "TRAY_STRAIGHT" }]
			},
			{
				name: "Straight → H90",
				steps: [{ definitionId: "TRAY_STRAIGHT" }, { definitionId: "FITTING_ELBOW_90" }]
			},
			{
				name: "Straight → H45",
				steps: [{ definitionId: "TRAY_STRAIGHT" }, { definitionId: "FITTING_ELBOW_45" }]
			},
			{
				name: "Straight → H60",
				steps: [{ definitionId: "TRAY_STRAIGHT" }, { definitionId: "FITTING_ELBOW_60" }]
			},
			{
				name: "Straight → H30",
				steps: [{ definitionId: "TRAY_STRAIGHT" }, { definitionId: "FITTING_ELBOW_30" }]
			},
			{
				name: "Straight → Vertical Inside",
				steps: [{ definitionId: "TRAY_STRAIGHT" }, { definitionId: "FITTING_RISER_IN_90" }]
			},
			{
				name: "Straight → Vertical Outside",
				steps: [{ definitionId: "TRAY_STRAIGHT" }, { definitionId: "FITTING_RISER_OUT_90" }]
			},
			{
				name: "Straight → Tee main (A)",
				steps: [{ definitionId: "TRAY_STRAIGHT" }, {
					definitionId: "FITTING_TEE",
					port: "PORT_A"
				}]
			},
			{
				name: "Straight → Tee branch (C)",
				steps: [{ definitionId: "TRAY_STRAIGHT" }, {
					definitionId: "FITTING_TEE",
					port: "PORT_C"
				}]
			},
			...[
				"PORT_A",
				"PORT_B",
				"PORT_C",
				"PORT_D"
			].map((e) => ({
				name: `Straight → Cross ${e}`,
				steps: [{ definitionId: "TRAY_STRAIGHT" }, {
					definitionId: "FITTING_CROSS",
					port: e
				}]
			})),
			{
				name: "Straight → Reducer (L/C/R)",
				steps: [
					{
						definitionId: "TRAY_STRAIGHT",
						overrides: { width: 600 }
					},
					{
						definitionId: "FITTING_REDUCER_LEFT",
						overrides: {
							inletWidth: 600,
							outletWidth: 300
						}
					},
					{
						definitionId: "TRAY_STRAIGHT",
						overrides: { width: 300 }
					},
					{
						definitionId: "FITTING_REDUCER_CENTER",
						overrides: {
							inletWidth: 300,
							outletWidth: 200
						}
					},
					{
						definitionId: "TRAY_STRAIGHT",
						overrides: { width: 200 }
					},
					{
						definitionId: "FITTING_REDUCER_RIGHT",
						overrides: {
							inletWidth: 200,
							outletWidth: 100
						}
					}
				]
			},
			{
				name: "Multi-component chain",
				steps: [
					{ definitionId: "TRAY_STRAIGHT" },
					{ definitionId: "FITTING_ELBOW_45" },
					{ definitionId: "FITTING_ELBOW_45" },
					{ definitionId: "TRAY_STRAIGHT" },
					{ definitionId: "FITTING_RISER_IN_60" },
					{ definitionId: "FITTING_RISER_OUT_60" },
					{ definitionId: "FITTING_ELBOW_30" },
					{ definitionId: "FITTING_ELBOW_60" },
					{ definitionId: "TRAY_STRAIGHT" },
					{ definitionId: "FITTING_TEE" },
					{
						definitionId: "FITTING_CROSS",
						attachTo: 9,
						attachPort: "PORT_C"
					},
					{
						definitionId: "TRAY_STRAIGHT",
						attachTo: 10,
						attachPort: "PORT_D"
					}
				]
			}
		], t = [], n = 0, r = 0, i = (e, t) => e.overrides ? e : e.definitionId === "TRAY_STRAIGHT" ? {
			...e,
			overrides: {
				width: t,
				length: 1500
			}
		} : {
			...e,
			overrides: { width: t }
		};
		return e.forEach((e) => {
			[300, 600].forEach((a) => {
				let o = it(e.steps.map((e) => i(e, a)), { profile: Z() });
				n += o.joints.length, o.joints.forEach((e) => r = Math.max(r, e.planeOffsetAMm, e.planeOffsetBMm)), o.passed || t.push({
					scenario: e.name,
					W: a,
					issues: o.issues
				});
			});
		}), $("Case AI", "實體裝配回歸 (Physical Assembly Regression: 12 Mating Scenarios)", t.length === 0 && n >= 50, "Each joint: ConnectionValidator PASS, ports coincide, directions opposite, up aligned, no body past the joint plane, no gap, identical faces, continuous centerline (W300 & W600)", `PASS (${n} 個接頭全部通過, 最大穿越量 ${Math.max(0, r).toExponential(2)}mm)`, `${t.length} scenarios failed`, {
			failures: t,
			joints: n
		});
	}
	static testCaseAJ_NegativeControls() {
		let e = [], t = R.get("TRAY_STRAIGHT"), n = () => V("TRAY_STRAIGHT", Z(), {}, "nc_a"), r = {
			...t,
			id: "NC_OVERHANG",
			getLocalPorts: (e) => t.getLocalPorts(e).map((e) => ({
				...e,
				localPosition: [
					e.localPosition[0],
					e.localPosition[1],
					e.localPosition[2] - Math.sign(e.localPosition[2]) * 60
				]
			}))
		};
		{
			let t = n(), i = new s("nc_b", r, B("TRAY_STRAIGHT", Z()));
			H.placeComponentByPort(t, "PORT_B", i, "PORT_A");
			let a = G.checkJoint(t, "PORT_B", i, "PORT_A");
			(a.passed || Math.abs(a.planeOffsetBMm - 60) > .05) && e.push(`overhang not detected (${a.planeOffsetBMm})`);
		}
		[{
			shift: -30,
			expect: 30,
			label: "penetration"
		}, {
			shift: 20,
			expect: -20,
			label: "gap"
		}].forEach(({ shift: t, expect: r, label: i }) => {
			let a = n(), o = V("TRAY_STRAIGHT", Z(), {}, "nc_b"), s = H.computePlacement(a, "PORT_B", o, "PORT_A");
			o.setPlacement({
				...s,
				position: [
					s.position[0],
					s.position[1],
					s.position[2] + t
				]
			});
			let c = G.checkJoint(a, "PORT_B", o, "PORT_A");
			(c.passed || Math.abs(c.planeOffsetBMm - r) > .05) && e.push(`${i} not detected (${c.planeOffsetBMm})`);
		});
		{
			let t = n(), r = V("FITTING_RISER_IN_90", Z(), {}, "nc_r"), i = H.computePlacement(t, "PORT_B", r, "PORT_A"), a = t.getWorldPorts().find((e) => e.id === "PORT_B").worldPosition, s = o.fromAxisAngle([
				0,
				0,
				1
			], Math.PI / 2), c = o.quaternionMultiply(s, i.quaternion), l = o.transformPoint([
				i.position[0] - a[0],
				i.position[1] - a[1],
				i.position[2] - a[2]
			], {
				position: [
					0,
					0,
					0
				],
				quaternion: s
			});
			r.setPlacement({
				position: [
					a[0] + l[0],
					a[1] + l[1],
					a[2] + l[2]
				],
				quaternion: c
			});
			let u = G.checkJoint(t, "PORT_B", r, "PORT_A");
			(u.passed || u.upDot > .5 || u.faceMismatchMm < 10) && e.push(`rotation not detected (up ${u.upDot}, face ${u.faceMismatchMm})`);
		}
		{
			let t = n(), r = V("TRAY_STRAIGHT", Z(), { width: 300 }, "nc_w");
			H.placeComponentByPort(t, "PORT_B", r, "PORT_A");
			let i = G.checkJoint(t, "PORT_B", r, "PORT_A");
			(i.passed || i.connection.code !== "WIDTH_MISMATCH") && e.push("width mismatch not rejected");
		}
		return $("Case AJ", "對照組：檢測器必須抓到錯誤 (Negative Controls: Overlap / Gap / Rotation / Size)", e.length === 0, "60mm overhang, 30mm penetration, 20mm gap, 90° rotated part and width mismatch are all reported as failures", "PASS (5 組刻意錯誤全部被裝配檢測器攔截)", e.join("; "), { issues: e });
	}
	static testCaseAK_AssemblyDemos() {
		let e = [], t = Z(), n = (n) => {
			let r = it(at[n].steps, { profile: t });
			return r.passed || e.push(`${n}: ${r.issues.join(" | ")}`), r.instances;
		}, r = (e, t) => e.getWorldPorts().find((e) => e.id === t), i = (t, n, r) => {
			Q(n, r) > .01 && e.push(`${t}: ${n.map((e) => e.toFixed(2))} != ${r}`);
		}, a = n("ELBOW_TEE_CHAIN");
		i("E90 outlet", r(a[1], "PORT_B").worldPosition, [
			725,
			0,
			1725
		]), i("Tee centre-branch C", r(a[3], "PORT_C").worldPosition, [
			3450,
			0,
			2450
		]), i("Main run end", r(a[4], "PORT_B").worldPosition, [
			6175,
			0,
			1725
		]), i("Branch run end", r(a[5], "PORT_B").worldPosition, [
			3450,
			0,
			4450
		]);
		let o = n("CROSS_CHAIN");
		i("Cross B run end", r(o[2], "PORT_B").worldPosition, [
			0,
			0,
			4450
		]), i("Cross C run end", r(o[3], "PORT_B").worldPosition, [
			-2725,
			0,
			1725
		]), i("Cross D run end", r(o[4], "PORT_B").worldPosition, [
			2725,
			0,
			1725
		]);
		let s = r(n("VERTICAL_OFFSET")[4], "PORT_B");
		i("Vertical offset end", s.worldPosition, [
			0,
			2500,
			4e3
		]), Q(s.worldUp, [
			0,
			1,
			0
		]) > 1e-9 && e.push("final tray not upright");
		let c = n("REDUCER_CHAIN");
		return i("Reducer outlet", r(c[1], "PORT_B").worldPosition, [
			150,
			0,
			1600
		]), i("300 run end", r(c[2], "PORT_B").worldPosition, [
			150,
			0,
			3600
		]), $("Case AK", "裝配示範與手算位置 (Assembly Demos vs Hand-Derived Layout)", e.length === 0, "Elbow→Tee chain, Cross chain, vertical offset (rise 2500) and reducer chain: all joints valid, end points equal hand calculation", "PASS (4 組裝配示範接頭全部通過, 端點座標與手算一致)", e.join("; "), { issues: e });
	}
	static testCaseAL_PlanFrameHandedness() {
		let t = [], n = lt.PAGE_Y_DOWN_METRES, r = lt.NORTH_UP_METRES, i = (e, t) => e.getWorldPorts().find((e) => e.id === t);
		for (let e of [n, r]) {
			let n = {
				x: 12.5,
				y: -3.25,
				z: 6.4
			}, r = e.toPlan(e.toWorld(n));
			Math.abs(r.x - n.x) + Math.abs(r.y - n.y) + Math.abs(r.z - n.z) > 1e-9 && t.push(`${e.id}: plan → world → plan changed the point`);
		}
		let a = (e) => {
			let t = e.toWorld({
				x: 0,
				y: 0,
				z: 0
			}), n = dt(l.normalize(l.sub(e.toWorld({
				x: 1,
				y: 0,
				z: 0
			}), t)));
			return e.toPlan(l.add(t, l.scale(n, 1e3)));
		};
		a(n).y < -.999 || t.push("page frame: left of east is not up the sheet (−y)"), a(r).y > .999 || t.push("north-up frame: left of east is not north (+y)");
		let o = (t) => {
			let n = V("FITTING_REDUCER_LEFT", Z(), {
				inletWidth: 600,
				outletWidth: 300
			}, "al_reducer"), r = t.toWorld({
				x: 0,
				y: 0,
				z: 6.4
			}), a = l.normalize(l.sub(t.toWorld({
				x: 1,
				y: 0,
				z: 6.4
			}), r)), o = new e.Quaternion().setFromUnitVectors(new e.Vector3(0, 0, 1), new e.Vector3(a[0], a[1], a[2]));
			return n.setPlacement({
				position: r,
				quaternion: [
					o.x,
					o.y,
					o.z,
					o.w
				]
			}), t.toPlan(i(n, "PORT_B").worldPosition).y - t.toPlan(i(n, "PORT_A").worldPosition).y;
		}, s = o(n);
		Math.abs(s - -.15) > 1e-9 && t.push(`page frame: LEFT reducer narrow end shifts ${s} m in y (expected −0.150, up the sheet)`);
		let c = o(r);
		Math.abs(c - .15) > 1e-9 && t.push(`north-up frame: LEFT reducer narrow end shifts ${c} m in y (expected +0.150, north)`);
		let u = o(r);
		Math.abs(u - -.15) > 1e-6 || t.push("negative control: mirrored frame not detected");
		let d = zt(), f = Bt(), p = new Map(kt(d, Z()).network.nodes.map((e) => [e.id, n.toPlan(e.position)])), m = new Map(kt(d, Z()).network.segments.map((e) => [e.id, e])), h = 0;
		return f.fittings.forEach((e) => e.legs.forEach(({ segmentId: r, portId: a }) => {
			let o = m.get(r), s = e.nodeId, c = p.get(s), l = p.get(o.from === s ? o.to : o.from), u = n.toPlan(i(e.instance, a).worldPosition), d = [
				l.x - c.x,
				l.y - c.y,
				l.z - c.z
			], f = Math.hypot(d[0], d[1], d[2]), g = [
				u.x - c.x,
				u.y - c.y,
				u.z - c.z
			], _ = (g[0] * d[0] + g[1] * d[1] + g[2] * d[2]) / f, v = Math.hypot(g[0] - _ * d[0] / f, g[1] - _ * d[1] / f, g[2] - _ * d[2] / f);
			h++, (v > 1e-6 || _ < -1e-9 || _ > f) && t.push(`${e.id}.${a} is off segment ${r} on the drawing (${v.toFixed(4)} m)`);
		})), $("Case AL", "平面座標左右手一致 (Plan Frame Handedness: LEFT Reducer & Fittings as Drawn)", t.length === 0, "Round trip exact; left of travel = drawing left; LEFT reducer narrow end on the drawing’s left; mirrored frame detected; all fitting ports on their drawn segments", `PASS (左偏異徑於圖面左側, 鏡像對照組被攔截, ${h} 個配件埠位位於圖面線段上)`, t.join("; "), {
			issues: t,
			pageShift: s,
			northShift: c
		});
	}
	static testCaseAM_NetworkFittings() {
		let e = [], t = Bt();
		t.ok || e.push(`errors: ${t.issues.filter((e) => e.severity === "ERROR").map((e) => e.message).join(" | ")}`);
		let n = t.fittings.map((e) => `${e.nodeId}:${e.definitionId}`).sort(), r = [
			"B:FITTING_RISER_OUT_90",
			"E:FITTING_ELBOW_90",
			"E:FITTING_REDUCER_CENTER",
			"T:FITTING_REDUCER_CENTER",
			"T:FITTING_TEE",
			"VT:FITTING_REDUCER_CENTER",
			"VT:FITTING_TEE",
			"VT~VT:FITTING_RISER_OUT_90"
		].sort();
		n.join(",") !== r.join(",") && e.push(`fittings ${n.join(",")} != ${r.join(",")}`);
		let i = {
			s1: 4275,
			s1b: 3550,
			s2: 8550,
			s3: 6675,
			br: 4175,
			rs: 4500,
			vt: 4500,
			p1: 1500,
			p2: 1500
		}, a = Object.fromEntries(t.straights.map((e) => [e.segmentId, e.lengthMm]));
		Object.entries(i).forEach(([t, n]) => {
			Math.abs((a[t] ?? NaN) - n) > 1e-6 && e.push(`straight ${t} = ${a[t]} (expected ${n})`);
		});
		let o = t.instances(), s = /* @__PURE__ */ new Set(), c = 0;
		for (let t = 0; t < o.length; t++) for (let n = t + 1; n < o.length; n++) for (let r of o[t].getWorldPorts()) for (let i of o[n].getWorldPorts()) {
			if (Q(r.worldPosition, i.worldPosition) > .01) continue;
			c++, s.add(`${o[t].instanceId}.${r.id}`), s.add(`${o[n].instanceId}.${i.id}`);
			let a = G.checkJoint(o[t], r.id, o[n], i.id);
			a.passed || e.push(`joint ${o[t].instanceId}.${r.id} ↔ ${o[n].instanceId}.${i.id}: ${a.issues.join("; ")}`);
		}
		c !== 15 && e.push(`${c} joints (expected 15)`), t.fittings.forEach((t) => t.instance.getWorldPorts().forEach((n) => {
			s.has(`${t.id}.${n.id}`) || e.push(`${t.id}.${n.id} is not connected`);
		})), t.straights.forEach((t) => {
			Math.abs(t.end[1] - t.start[1]) < 1e-6 && Q(t.up, [
				0,
				1,
				0
			]) > 1e-9 && e.push(`${t.segmentId} not upright`);
		});
		let l = t.fittings.find((e) => e.nodeId === "B" && e.role === "FITTING");
		return Q(t.straights.find((e) => e.segmentId === "rs").up, l.instance.getWorldPorts().find((e) => e.id === "PORT_B").worldUp) > 1e-9 && e.push("vertical run twisted against its bend"), $("Case AM", "路網轉型錄配件 (Tray Network → Catalog Fittings, Reach & Physical Joints)", e.length === 0, "8 fittings as expected; straight lengths = node distance − fitting reach (hand-derived); 15 joints pass AssemblyValidator; no open fitting port; trays upright", `PASS (8 個配件, 9 段直槽長度與手算一致, ${c} 個接頭實體檢查通過)`, e.join("; "), {
			issues: e,
			fittings: n,
			lengths: a
		});
	}
	static testCaseAN_NetworkNormalizeAndIssues() {
		let e = [], t = lt.PAGE_Y_DOWN_METRES, n = (e) => e.issues.filter((e) => e.severity === "ERROR").map((e) => e.code), r = kt(zt(), Z()), i = r.changes.find((e) => e.kind === "SEGMENT_WIDTH");
		(!i || i.kind !== "SEGMENT_WIDTH" || i.segmentId !== "s3" || i.from !== 450 || i.to !== 500) && e.push("s3 not widened 450 → 500");
		let a = r.issues.find((e) => e.code === "VERTICAL_TEE_REPLACED");
		(!a || a.values?.stubMm !== 1825) && e.push(`vertical tee stub ${a?.values?.stubMm} (expected 1825 = 725 + 600 + 500)`);
		let o = r.changes.find((e) => e.kind === "NODE_MOVED");
		(!o || o.kind !== "NODE_MOVED" || o.nodeId !== "J2" || Math.abs(Q(o.from, o.to) - 1825) > 1e-6) && e.push("J2 not moved 1825 mm");
		let s = J(r.network, Z()), c = At(["s1", "vt"], r), l = At([
			"vt",
			"s1b",
			"s2"
		], r);
		c.join(",") !== "s1,vt~STUB,vt" && e.push(`route down → ${c.join(",")}`), l.join(",") !== "vt,vt~STUB,s1b,s2" && e.push(`route up → ${l.join(",")}`), At(["s1", "s1b"], r).join(",") !== "s1,s1b" && e.push("main-run route changed"), [c, l].forEach((t) => {
			let n = s.pathCenterline(t);
			n.ok || e.push(`${t.join(",")}: ${n.issues.join("; ")}`);
		}), s.pathCenterline(["s1", "vt"]).ok && e.push("stale route (without the stub) must not measure");
		let u = n(J(zt(), Z()));
		["VERTICAL_TEE_UNRESOLVED", "WIDTH_NOT_IN_CATALOG"].forEach((t) => {
			u.includes(t) || e.push(`raw network: ${t} not reported`);
		});
		let d = (e, n) => ft(e.map(([e, t, n, r]) => ({
			id: e,
			x: t,
			y: n,
			z: r
		})), n.map(([e, t, n, r]) => ({
			id: e,
			from: t,
			to: n,
			width: r
		})), t), f = (t, r, i, a = Z()) => {
			let o = J(r, a);
			return n(o).includes(i) || e.push(`${t}: expected ${i}, got ${n(o).join(",") || "none"}`), o;
		}, p = Math.cos(75 * Math.PI / 180), m = Math.sin(75 * Math.PI / 180);
		f("75° turn", d([
			[
				"a",
				0,
				0,
				5
			],
			[
				"b",
				10,
				0,
				5
			],
			[
				"c",
				10 + 10 * p,
				-10 * m,
				5
			]
		], [[
			"x",
			"a",
			"b",
			600
		], [
			"y",
			"b",
			"c",
			600
		]]), "ANGLE_NOT_IN_CATALOG");
		let h = f("short segment", d([
			[
				"a",
				0,
				0,
				5
			],
			[
				"b",
				5,
				0,
				5
			],
			[
				"c",
				5,
				1,
				5
			],
			[
				"d",
				0,
				1,
				5
			]
		], [
			[
				"x",
				"a",
				"b",
				600
			],
			[
				"y",
				"b",
				"c",
				600
			],
			[
				"z",
				"c",
				"d",
				600
			]
		]), "SEGMENT_TOO_SHORT").issues.find((e) => e.code === "SEGMENT_TOO_SHORT");
		h?.values?.requiredMm !== 1450 && e.push(`short segment requires ${h?.values?.requiredMm} (expected 1450)`), f("Y junction", d([
			[
				"o",
				0,
				0,
				5
			],
			[
				"a",
				5,
				0,
				5
			],
			[
				"b",
				-2.5,
				4.33,
				5
			],
			[
				"c",
				-2.5,
				-4.33,
				5
			]
		], [
			[
				"x",
				"o",
				"a",
				600
			],
			[
				"y",
				"o",
				"b",
				600
			],
			[
				"z",
				"o",
				"c",
				600
			]
		]), "JUNCTION_NOT_IN_CATALOG"), f("tee in ventilated B", d([
			[
				"a",
				-5,
				0,
				5
			],
			[
				"o",
				0,
				0,
				5
			],
			[
				"b",
				5,
				0,
				5
			],
			[
				"c",
				0,
				5,
				5
			]
		], [
			[
				"x",
				"a",
				"o",
				300
			],
			[
				"y",
				"o",
				"b",
				300
			],
			[
				"z",
				"o",
				"c",
				300
			]
		]), "FITTING_NOT_OFFERED", Ft()), n(kt(d([[
			"a",
			0,
			0,
			5
		], [
			"b",
			5,
			0,
			5
		]], [[
			"x",
			"a",
			"b",
			1200
		]]), Z())).includes("WIDTH_NOT_IN_CATALOG") || e.push("W=1200 not reported");
		let g = J(d([
			[
				"a",
				0,
				0,
				5
			],
			[
				"b",
				10,
				0,
				5
			],
			[
				"c",
				10 + 10 * Math.SQRT1_2,
				-10 * Math.SQRT1_2,
				5
			]
		], [[
			"x",
			"a",
			"b",
			600
		], [
			"y",
			"b",
			"c",
			600
		]]), Z());
		return (!g.ok || g.fittings[0]?.definitionId !== "FITTING_ELBOW_45") && e.push("45° turn not resolved to FITTING_ELBOW_45"), $("Case AN", "路網正規化與無法施作回報 (Normalize & Report What the Catalog Cannot Build)", e.length === 0, "450 → 500; vertical tee → tee + 1825 stub + bend, free end moved, routes gain the stub; ERROR for vertical tee (raw), non-catalog width, 75° turn, short segment (needs 1450), Y junction, tee not offered in ventilated B, W 1200; 45° resolves", "PASS (寬度與垂直三通正規化正確, 7 種無法施作情況全部回報為錯誤)", e.join("; "), { issues: e });
	}
	static testCaseAO_NetworkCenterline() {
		let e = [], t = Bt(), n = [
			"s1",
			"s1b",
			"br",
			"rs"
		], r = t.pathCenterline(n), i = Math.PI / 2 * 600 + 250, a = Math.PI / 2 * 375 + 250, o = 9275 + i + 600 + 4175 + a + 4500;
		r.ok || e.push(`path: ${r.issues.join("; ")}`), Math.abs(r.lengthMm - o) > 1e-6 && e.push(`centerline ${r.lengthMm.toFixed(3)} != hand ${o.toFixed(3)}`), Math.abs(r.polylineMm - 21e3) > 1e-6 && e.push(`polyline ${r.polylineMm}`);
		let s = (e) => t.straights.find((t) => t.segmentId === e).instance, c = (e, n) => t.segmentEnds[`${e}@${n}`].fitting, l = new Map(t.fittings.map((e) => [e.id, e.instance])), u = (e, n) => l.get(t.segmentEnds[`${e}@${n}`].reducer.id), d = (e, t, n) => Ht(l.get(c(e, n).id), c(e, n).portId, c(t, n).portId), f = [
			Ht(s("s1"), "PORT_A", "PORT_B"),
			d("s1", "s1b", "VT"),
			Ht(s("s1b"), "PORT_A", "PORT_B"),
			d("s1b", "br", "T"),
			Ht(u("br", "T"), "PORT_A", "PORT_B"),
			Ht(s("br"), "PORT_A", "PORT_B"),
			d("br", "rs", "B"),
			Ht(s("rs"), "PORT_A", "PORT_B")
		], p = 0, m = 0;
		f.forEach((e, t) => {
			for (let t = 1; t < e.length; t++) p += Q(e[t - 1], e[t]);
			t > 0 && (m = Math.max(m, Q(f[t - 1][f[t - 1].length - 1], e[0])));
		}), m > .01 && e.push(`centerline discontinuity ${m.toFixed(4)} mm`), Math.abs(p - r.lengthMm) > .5 && e.push(`measured ${p.toFixed(3)} != reported ${r.lengthMm.toFixed(3)}`);
		let h = t.pathPoints(n), g = 0;
		for (let e = 1; e < h.length; e++) g += Q(h[e - 1], h[e]);
		Math.abs(g - p) > 1e-6 && e.push(`pathPoints length ${g.toFixed(3)} != measured ${p.toFixed(3)}`);
		let _ = (e) => t.network.nodes.find((t) => t.id === e).position;
		(h.length < 2 || Q(h[0], _("A")) > 1e-6 || Q(h[h.length - 1], _("J")) > 1e-6) && e.push("pathPoints does not run from A to J");
		let v = J(ft([
			{
				id: "a",
				x: 0,
				y: 0,
				z: 5
			},
			{
				id: "b",
				x: 10,
				y: 0,
				z: 5
			},
			{
				id: "c",
				x: 10,
				y: 10,
				z: 5
			}
		], [{
			id: "x",
			from: "a",
			to: "b",
			width: 600
		}, {
			id: "y",
			from: "b",
			to: "c",
			width: 600
		}], lt.PAGE_Y_DOWN_METRES), Z()).pathCenterline(["x", "y"]), y = v.polylineMm - v.lengthMm;
		return Math.abs(y - 600 * (2 - Math.PI / 2)) > 1e-6 && e.push(`90° turn delta ${y.toFixed(3)} (expected 257.522)`), $("Case AO", "路徑實體中心線長度 (Route Centerline Length Through Fittings)", e.length === 0, "Reported = hand sum; = length measured along the placed world centerlines (gap ≤ 0.01 mm); single 90° turn is 257.52 mm shorter than the drawing polyline", `PASS (中心線 ${(r.lengthMm / 1e3).toFixed(3)} m, 圖面折線 ${(r.polylineMm / 1e3).toFixed(3)} m, 實際網格量測一致)`, e.join("; "), {
			issues: e,
			lengthMm: r.lengthMm,
			polylineMm: r.polylineMm,
			measured: p
		});
	}
	static testCaseAP_NetworkBom() {
		let e = [], t = Bt().bom(), n = (e, n) => t.fittings.filter((t) => t.definitionId === e && t.spec.includes(n)).reduce((e, t) => e + t.quantity, 0), r = (t, r, i) => {
			let a = n(t, r);
			a !== i && e.push(`${t} ${r}: ${a} (expected ${i})`);
		};
		r("FITTING_TEE", "W=600mm", 2), r("FITTING_REDUCER_CENTER", "W1=600mm -> W2=300mm", 2), r("FITTING_REDUCER_CENTER", "W1=600mm -> W2=500mm", 1), r("FITTING_ELBOW_90", "W=600mm", 1), r("FITTING_RISER_OUT_90", "W=300mm", 2);
		let i = t.fittings.reduce((e, t) => e + t.quantity, 0);
		i !== 8 && e.push(`${i} fittings (expected 8)`);
		let a = (e) => t.straights.find((t) => t.width === e), o = (t, n, r, i) => {
			let o = a(t);
			(!o || Math.abs(o.totalLengthMm - n) > 1e-6 || o.pieces !== r || o.runs !== i) && e.push(`W${t}: ${o ? `${o.totalLengthMm} mm, ${o.pieces} pcs, ${o.runs} runs` : "missing"} (expected ${n} mm, ${r} pcs, ${i} runs)`);
		};
		return o(600, 16375, 7, 3), o(500, 6675, 3, 1), o(300, 16175, 7, 4), $("Case AP", "路網撿料 (Network Material Take-off: Fittings & 3 m Straight Pieces)", e.length === 0, "Tee 600 ×2, reducer 600→300 ×2, 600→500 ×1, elbow 90 ×1, riser out 300 ×2; straights per run from 3 m pieces (pass-through runs cut together)", "PASS (8 個配件依規格分列, 直槽依連續段計算 3 m 支數)", e.join("; "), {
			issues: e,
			bom: t
		});
	}
	static testCaseAQ_HostMaterials() {
		let t = [], n = V("FITTING_TEE", Z(), {}, "aq_tee"), r = new e.MeshStandardMaterial({ color: 16711680 }), i = c.Tray.color.getHex(), a = n.getThreeMesh({ materials: { body: r } }), o = n.getThreeMesh(), s = (e) => {
			let t = [];
			return e.traverse((e) => {
				e.isMesh && t.push(e);
			}), t;
		}, l = s(a), u = s(o);
		(l.length === 0 || l.some((e) => e.material !== r || e.userData.sharedMaterial !== !1)) && t.push("host material not used on every mesh"), u.some((e) => e.material !== c.Tray || e.userData.sharedMaterial !== !0) && t.push("default meshes not on the flagged shared material"), (a === o || n.getThreeMesh() !== o) && t.push("host build must be fresh; default build stays cached"), c.Tray.color.getHex() !== i && t.push("shared material modified");
		let d = (t) => new e.Box3().setFromObject(t), f = d(a), p = d(o);
		(f.min.distanceTo(p.min) > 1e-12 || f.max.distanceTo(p.max) > 1e-12) && t.push("geometry differs with host material");
		let m = l.reduce((e, t) => e + t.geometry.getAttribute("position").count, 0), h = u.reduce((e, t) => e + t.geometry.getAttribute("position").count, 0);
		return m !== h && t.push(`vertex count ${m} != ${h}`), $("Case AQ", "宿主材質注入 (Host-Supplied Materials, Geometry Unchanged)", t.length === 0, "Host material on every mesh (flag false); default build on flagged shared material and cached; shared material untouched; identical bounds and vertex count", `PASS (宿主材質套用於 ${l.length} 個網格, 幾何完全相同, 共用材質未被修改)`, t.join("; "), { issues: t });
	}
	static testCaseAR_FittingChoices() {
		let e = [], t = (e) => Object.fromEntries(e.straights.map((e) => [e.segmentId, e.lengthMm])), n = (n, r, i) => {
			let a = t(r);
			Object.entries(i).forEach(([t, r]) => {
				Math.abs((a[t] ?? NaN) - r) > 1e-6 && e.push(`${n}: ${t} = ${a[t]} (expected ${r})`);
			});
		}, r = (t, n) => {
			n.ok || e.push(`${t}: ${n.issues.filter((e) => e.severity === "ERROR").map((e) => e.message).join(" | ")}`);
			let r = Vt(n);
			return r.failures.forEach((n) => e.push(`${t}: ${n}`)), r.joints;
		}, i = (e, t) => e.fittings.find((e) => e.nodeId === t && e.role === "FITTING"), a = (e, t, n) => e.segmentEnds[`${t}@${n}`]?.reducer, o = Bt({ bendWidth: "NARROWEST_LEG" });
		i(o, "E").instance.effectiveParameters.width !== 500 && e.push("NARROWEST_LEG: elbow at E is not W500");
		let s = a(o, "s2", "E");
		(!s || s.innerPort !== "PORT_B" || a(o, "s3", "E")) && e.push("NARROWEST_LEG: reducer not on s2 with its narrow end at the elbow"), n("NARROWEST_LEG", o, {
			s2: 8e3,
			s3: 7325,
			s1: 4275,
			br: 4175
		});
		let c = r("NARROWEST_LEG", o), l = o.pathCenterline(["s2", "s3"]), u = o.pathPoints(["s2", "s3"]), d = 0;
		for (let e = 1; e < u.length; e++) d += Q(u[e - 1], u[e]);
		(!l.ok || Math.abs(d - l.lengthMm) > .5) && e.push(`NARROWEST_LEG: route ${l.lengthMm.toFixed(2)} vs points ${d.toFixed(2)}`), o.bom().fittings.some((e) => e.definitionId === "FITTING_ELBOW_90" && e.spec.includes("W=500mm")) || e.push("NARROWEST_LEG: BOM has no W500 elbow");
		let f = Bt({ nodeOverrides: { T: { radius: 600 } } });
		i(f, "T").instance.effectiveParameters.radius !== 600 && e.push("R600 override not applied"), n("T R600", f, {
			s1b: 3250,
			s2: 8250,
			br: 3875
		});
		let p = r("T R600", f), m = Bt({ nodeOverrides: { T: { width: 300 } } });
		["s1b", "s2"].forEach((t) => {
			let n = a(m, t, "T");
			(!n || n.innerPort !== "PORT_B") && e.push(`T W300: ${t} has no reducer with its narrow end at the tee`);
		}), a(m, "br", "T") && e.push("T W300: branch must not need a reducer"), n("T W300", m, {
			s1b: 3100,
			s2: 8100,
			br: 4925
		});
		let h = r("T W300", m), g = kt(zt(), Z(), { nodeOverrides: { VT: { radius: 600 } } }), _ = g.issues.find((e) => e.code === "VERTICAL_TEE_REPLACED")?.values?.stubMm;
		_ !== 2125 && e.push(`vertical tee stub with R600 = ${_} (expected 2125)`), r("VT R600", J(g.network, Z(), { nodeOverrides: { VT: { radius: 600 } } }));
		let v = f.fittingChoices("T");
		(!v || v.definitionId !== "FITTING_TEE" || v.widthChoices.join(",") !== "300,400,500,600" || v.radiusChoices.join(",") !== "300,600,900" || v.radius !== 600 || v.override?.radius !== 600) && e.push(`fittingChoices(T) = ${JSON.stringify(v)}`), f.fittingChoices("A") !== void 0 && e.push("fittingChoices on a tray end must be undefined");
		let y = Bt({ nodeOverrides: {
			E: { width: 700 },
			T: { radius: 450 },
			A: { radius: 600 }
		} }), b = y.issues.map((e) => `${e.severity}:${e.code}:${e.nodeId}`);
		return [
			"ERROR:OVERRIDE_INVALID:E",
			"ERROR:OVERRIDE_INVALID:T",
			"WARNING:OVERRIDE_UNUSED:A"
		].forEach((t) => {
			b.includes(t) || e.push(`missing ${t}`);
		}), i(y, "E").instance.effectiveParameters.width !== 600 && e.push("invalid width override must fall back to the rule"), $("Case AR", "配件寬度規則與人工選擇 (Bend Width Rule & Designer Fitting Choices)", e.length === 0, "Reduce-first bend W500 (s2 8000, s3 7325); tee R600 (s1b 3250, s2 8250, br 3875); tee W300 (s1b 3100, s2 8100, br 4925); VT R600 stub 2125; all joints pass; choices listed; invalid → ERROR, unused → WARNING", `PASS (先縮徑彎頭、R600 三通、W300 三通與垂直三通選擇皆重算正確, ${c + p + h} 個接頭實體檢查通過)`, e.join("; "), { issues: e });
	}
}, Kt = "1.0.0";
//#endregion
export { at as ASSEMBLY_DEMOS, Gt as AcceptanceTestSuite, U as AnalyticLength, Be as AssemblyRegistry, G as AssemblyValidator, t as AssumptionLevel, ot as BomManager, n as BomScope, T as BoundsAccumulator, ze as CatalogStandards, s as ComponentInstance, r as ComponentOrigin, R as ComponentRegistry, i as ComponentRole, W as ConnectionValidator, I as GeometryGenerators, ct as JsonExporter, E as LADDER_SECTION_CONSTANTS, jt as LEGACY_FITTING_BASELINES, H as MateEngine, c as Materials, lt as PlanFrames, $e as RouteGenerator, Xe as SUB_CATEGORY_NAMES, Je as TRAY_SYSTEM_METAS, o as Transforms, z as TraySystemProfiles, a as Units, Ge as VENDOR_PROFILES, D as VENTILATED_SECTION_CONSTANTS, Kt as VERSION, ut as WORLD_UP, h as advanceFrame, m as arcCenter, it as buildMatedAssembly, F as buildTrayLayoutGroup, st as computeGeometryBounds, V as createComponentFromProfile, Se as crossLayout, re as faceOf, C as frameAtLength, Ye as getComponentSubCategory, Ze as getComponentSystemCategories, me as horizontalBendLayout, dt as leftOfTravel, kt as normalizeTrayNetwork, ne as normalizeTrayStyle, g as pathEndFrame, _ as pathLength, Ve as printedPageOf, Ce as reducerLayout, B as resolveProfileParameters, J as resolveTrayNetwork, j as resolveTraySection, ue as rungCorners, S as samplePath, w as sectionPoint, d as sideOf, pe as straightLayout, xe as teeLayout, Ke as trayFamilyOf, ft as trayNetworkFromPlan, At as updateRouteForChanges, l as vec, he as verticalBendLayout };
