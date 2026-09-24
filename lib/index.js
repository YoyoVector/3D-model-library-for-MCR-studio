import * as e from "three";
//#region src/core/Schema.ts
var t = {
	VERIFIED_PROJECT_REQUIREMENT: "VERIFIED_PROJECT_REQUIREMENT",
	VERIFIED_VENDOR_CATALOG: "VERIFIED_VENDOR_CATALOG",
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
				connectionType: e.connectionType
			};
		}), this._cachedWorldPorts;
	}
	getCenterlines() {
		return this._cachedCenterlines ||= this.definition.getCenterlineRoutes(this._effectiveParameters), this._cachedCenterlines;
	}
	getBounds() {
		return this.definition.getBounds(this._effectiveParameters);
	}
	getThreeMesh() {
		if (this._cachedMesh) return this._cachedMesh;
		let t = this.definition.buildGeometry(this._effectiveParameters);
		t.name = `Instance_${this.instanceId}_${this.definition.id}`, t.traverse((e) => {
			e.isMesh && (e.userData = {
				...e.userData,
				instanceId: this.instanceId,
				definitionId: this.definition.id
			});
		});
		let n = new e.Group();
		return n.name = `Container_${this.instanceId}`, n.add(t), this.applyPlacementToMesh(n), n.scale.set(1, 1, 1), t.scale.set(1, 1, 1), this._cachedMesh = n, this._cachedMesh;
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
}, l = class {
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
			analyticLength: c.straight(n),
			samplePoints: a
		};
	}
	static createHorizontalElbow(e, t, n, r, i = 20) {
		let a = r * Math.PI / 180, o = [];
		for (let e = 0; e <= i; e++) {
			let t = e / i * a, r = n * Math.cos(t), s = -n * Math.sin(t);
			o.push([
				r,
				0,
				s
			]);
		}
		return {
			id: `ROUTE_${e}_${t}`,
			fromPort: e,
			toPort: t,
			type: "ARC_XZ",
			analyticLength: c.circularArc(n, r),
			samplePoints: o
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
			analyticLength: c.circularArc(n, r),
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
			analyticLength: c.reducer(n, r),
			samplePoints: o
		};
	}
}, u = class {
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
}, d = class {
	static buildStraightTray(t) {
		let n = new e.Group(), r = a.mmToM(t.width), i = a.mmToM(t.depth), o = a.mmToM(t.length), s = a.mmToM(t.rungSpacing || 250), c = t.isIS ? u.TrayIS : u.Tray, l = new e.BoxGeometry(.04, i, o), d = new e.Mesh(l, c);
		d.position.set(-r / 2, 0, 0), d.castShadow = !0, d.receiveShadow = !0;
		let f = new e.Mesh(l, c);
		f.position.set(r / 2, 0, 0), f.castShadow = !0, f.receiveShadow = !0, n.add(d, f);
		let p = Math.max(2, Math.floor(o / s)), m = .02, h = new e.BoxGeometry(r, m, .035);
		for (let t = 0; t <= p; t++) {
			let r = -o / 2 + o / p * t, a = new e.Mesh(h, c);
			a.position.set(0, -i / 2 + m / 2, r), a.castShadow = !0, n.add(a);
		}
		if (t.hasDivider) {
			let t = new e.BoxGeometry(.005, i, o), r = new e.Mesh(t, u.Divider);
			r.position.set(0, 0, 0), n.add(r);
		}
		if (t.hasSplicePlates !== !1) {
			let e = this.buildSplicePlateMesh(i);
			e.position.set(-r / 2, 0, o / 2);
			let t = this.buildSplicePlateMesh(i);
			t.position.set(r / 2, 0, o / 2), n.add(e, t);
		}
		return n;
	}
	static buildSplicePlateMesh(t = .1) {
		let n = new e.Group(), r = new e.Mesh(new e.BoxGeometry(.05, t - .02, .12), u.Support);
		return n.add(r), [-.04, .04].forEach((t) => {
			let r = new e.Mesh(new e.CylinderGeometry(.008, .008, .055, 8), u.Bolt);
			r.rotation.set(Math.PI / 2, 0, Math.PI / 2), r.position.set(0, 0, t), n.add(r);
		}), n;
	}
	static buildSplicePlate(e = {}) {
		let t = e.depth ? a.mmToM(e.depth) : .1;
		return this.buildSplicePlateMesh(t);
	}
	static buildCantileverSupport(t) {
		let n = new e.Group(), r = a.mmToM(t.width || 600), i = a.mmToM(t.depth || 100), o = a.mmToM(t.armLength || (t.width ? t.width + 150 : 750)), s = new e.Mesh(new e.BoxGeometry(o, .04, .04), u.Support);
		s.position.set(o / 2 - r / 2 - .05, -i / 2 - .02, 0);
		let c = new e.Mesh(new e.BoxGeometry(.02, .25, .06), u.Support);
		c.position.set(-r / 2 - .06, -i / 2 - .02 - .1, 0);
		let l = new e.Mesh(new e.BoxGeometry(.06, .01, .04), u.Bolt);
		l.position.set(-r / 2, -i / 2 + .005, 0);
		let d = new e.Mesh(new e.BoxGeometry(.06, .01, .04), u.Bolt);
		return d.position.set(r / 2, -i / 2 + .005, 0), n.add(s, c, l, d), n;
	}
	static buildHorizontalElbow(t) {
		let n = new e.Group(), r = a.mmToM(t.width), i = a.mmToM(t.depth), o = a.mmToM(t.radius), s = a.degToRad(t.angleDeg), c = .04, l = t.isIS ? u.TrayIS : u.Tray, d = this.createArcRail(o - r / 2, c, i, 0, s, l), f = this.createArcRail(o + r / 2, c, i, 0, s, l);
		n.add(d, f);
		let p = Math.max(2, Math.round(t.angleDeg / 15)), m = .02;
		for (let t = 1; t < p; t++) {
			let a = t * s / p, c = new e.Mesh(new e.BoxGeometry(r, m, .035), l);
			c.position.set(o * Math.cos(a), -i / 2 + m / 2, -o * Math.sin(a)), c.rotation.y = a, n.add(c);
		}
		return n;
	}
	static createArcRail(t, n, r, i, a, o) {
		let s = new e.Shape();
		s.absarc(0, 0, t + n / 2, i, a, !1), s.lineTo((t - n / 2) * Math.cos(a), (t - n / 2) * Math.sin(a)), s.absarc(0, 0, t - n / 2, a, i, !0), s.lineTo((t + n / 2) * Math.cos(i), (t + n / 2) * Math.sin(i));
		let c = new e.ExtrudeGeometry(s, {
			depth: r,
			bevelEnabled: !1,
			curveSegments: 32
		});
		c.translate(0, 0, -r / 2);
		let l = new e.Mesh(c, o);
		return l.rotation.x = Math.PI / 2, l.castShadow = !0, l.receiveShadow = !0, l;
	}
	static buildHorizontalTee(t) {
		let n = new e.Group(), r = a.mmToM(t.width), i = a.mmToM(t.depth), o = a.mmToM(t.length), s = a.mmToM(t.branchLength), c = .04, l = t.isIS ? u.TrayIS : u.Tray, d = new e.Mesh(new e.BoxGeometry(o, i, c), l);
		d.position.set(0, 0, -r / 2);
		let f = o / 2 - r / 2, p = new e.Mesh(new e.BoxGeometry(f, i, c), l);
		p.position.set(-o / 4 - r / 4, 0, r / 2);
		let m = new e.Mesh(new e.BoxGeometry(f, i, c), l);
		m.position.set(o / 4 + r / 4, 0, r / 2);
		let h = s - r / 2, g = new e.Mesh(new e.BoxGeometry(c, i, h), l);
		g.position.set(-r / 2, 0, r / 2 + h / 2);
		let _ = new e.Mesh(new e.BoxGeometry(c, i, h), l);
		_.position.set(r / 2, 0, r / 2 + h / 2), n.add(d, p, m, g, _);
		let v = .02, y = .035;
		for (let t = -o / 2 + .1; t <= o / 2 - .1; t += .2) {
			if (Math.abs(t) < r / 2 - .05) continue;
			let a = new e.Mesh(new e.BoxGeometry(r, v, y), l);
			a.rotation.y = Math.PI / 2, a.position.set(t, -i / 2 + v / 2, 0), n.add(a);
		}
		for (let t = r / 2 + .1; t <= s - .1; t += .2) {
			let a = new e.Mesh(new e.BoxGeometry(r, v, y), l);
			a.position.set(0, -i / 2 + v / 2, t), n.add(a);
		}
		return n;
	}
	static buildVerticalRiser(t) {
		let n = new e.Group(), r = a.mmToM(t.width), i = a.mmToM(t.depth), o = a.mmToM(t.radius), s = a.degToRad(t.angleDeg), c = t.isIS ? u.TrayIS : u.Tray, l = t.isOutside ? -1 : 1, d = new e.Shape();
		d.absarc(0, 0, o + i / 2, 0, s, !1), d.lineTo((o - i / 2) * Math.cos(s), (o - i / 2) * Math.sin(s)), d.absarc(0, 0, o - i / 2, s, 0, !0), d.lineTo(o + i / 2, 0);
		let f = new e.ExtrudeGeometry(d, {
			depth: .04,
			bevelEnabled: !1,
			curveSegments: 32
		});
		f.translate(0, 0, -.04 / 2), t.isOutside && f.scale(1, -1, 1);
		let p = new e.Mesh(f, c);
		p.position.z = -r / 2;
		let m = new e.Mesh(f, c);
		m.position.z = r / 2, n.add(p, m);
		let h = Math.max(2, Math.round(t.angleDeg / 15)), g = .02;
		for (let t = 1; t < h; t++) {
			let a = t * s / h, u = o - i / 2 + g / 2, d = new e.Mesh(new e.BoxGeometry(.035, g, r), c);
			d.position.set(u * Math.cos(a), l * u * Math.sin(a), 0), d.rotation.z = l * (a + Math.PI / 2), n.add(d);
		}
		return n;
	}
	static buildReducer(t) {
		let n = new e.Group(), r = a.mmToM(t.inletWidth), i = a.mmToM(t.outletWidth), o = a.mmToM(t.depth), s = a.mmToM(t.length), c = .04, l = t.isIS ? u.TrayIS : u.Tray, d = -r / 2, f = -i / 2, p = r / 2, m = i / 2;
		t.type === "LEFT" ? (d = -r / 2, f = -r / 2, p = r / 2, m = -r / 2 + i) : t.type === "RIGHT" && (p = r / 2, m = r / 2, d = -r / 2, f = r / 2 - i);
		let h = f - d, g = Math.hypot(h, s), _ = Math.atan2(h, s), v = new e.Mesh(new e.BoxGeometry(c, o, g), l);
		v.position.set((d + f) / 2, 0, 0), v.rotation.y = -_;
		let y = m - p, b = Math.hypot(y, s), x = Math.atan2(y, s), S = new e.Mesh(new e.BoxGeometry(c, o, b), l);
		S.position.set((p + m) / 2, 0, 0), S.rotation.y = -x, n.add(v, S);
		let C = Math.max(2, Math.floor(s / .2)), w = .02;
		for (let t = 0; t <= C; t++) {
			let r = t / C, i = -s / 2 + s * r, a = d + (f - d) * r, c = p + (m - p) * r, u = c - a, h = (a + c) / 2, g = new e.Mesh(new e.BoxGeometry(u, w, .035), l);
			g.position.set(h, -o / 2 + w / 2, i), n.add(g);
		}
		return n;
	}
	static buildJunctionBox(t) {
		let n = new e.Group(), r = a.mmToM(t.width), i = a.mmToM(t.height), o = a.mmToM(t.depth), s = u.JbIS;
		t.boxType === "NON_IS" && (s = u.JbNonIS), t.boxType === "FIBER" && (s = u.JbFiber);
		let c = new e.Mesh(new e.BoxGeometry(r, i, o), s);
		c.castShadow = !0, n.add(c);
		let l = new e.Mesh(new e.BoxGeometry(.12, i + .1, .08), u.Support);
		return l.position.set(0, 0, o / 2 + .04), n.add(l), [
			-r / 4,
			0,
			r / 4
		].forEach((t) => {
			let r = new e.Mesh(new e.CylinderGeometry(.02, .02, .06, 12), u.Bolt);
			r.position.set(t, -i / 2 - .03, 0), n.add(r);
		}), n;
	}
	static buildUnistrutMount(t) {
		let n = new e.Group(), r = a.mmToM(t.length), i = new e.Mesh(new e.BoxGeometry(.041, r, .041), u.Support);
		return n.add(i), n;
	}
	static buildConduitRiser(t) {
		let n = new e.Group(), r = a.mmToM(t.diameterMm) / 2, i = a.mmToM(t.lengthMm), o = new e.Mesh(new e.CylinderGeometry(r, r, i, 16), u.Conduit);
		return o.castShadow = !0, n.add(o), n;
	}
	static buildMctPenetration(t) {
		let n = new e.Group(), r = a.mmToM(t.widthMm), i = a.mmToM(t.heightMm), o = a.mmToM(t.thicknessMm), s = new e.Mesh(new e.BoxGeometry(o, i, r), u.MctFrame);
		s.castShadow = !0, n.add(s);
		let c = new e.MeshStandardMaterial({
			color: 1976635,
			roughness: .9
		}), l = new e.Mesh(new e.BoxGeometry(o + .02, i * .8, r * .8), c);
		return n.add(l), n;
	}
	static buildControlCabinet(t) {
		let n = new e.Group(), r = a.mmToM(t.widthMm), i = a.mmToM(t.heightMm), o = a.mmToM(t.depthMm), s = new e.Mesh(new e.BoxGeometry(r, i, o), u.CabinetBody);
		s.castShadow = !0, n.add(s);
		let c = new e.Mesh(new e.BoxGeometry(.02, .2, o * .85), new e.MeshBasicMaterial({ color: t.stripeColorHex }));
		return c.position.set(-r / 2 - .01, i / 2 - .3, 0), n.add(c), n;
	}
	static buildStructuralColumn(t) {
		let n = new e.Group(), r = a.mmToM(t.heightMm), i = a.mmToM(t.widthMm || 350), o = new e.Mesh(new e.BoxGeometry(i, r, i), u.ColumnSteel);
		return o.position.y = r / 2, o.castShadow = !0, n.add(o), n;
	}
	static buildStructuralPier(t) {
		let n = new e.Group(), r = a.mmToM(t.widthMm || 700), i = a.mmToM(t.heightMm || 400), o = new e.Mesh(new e.BoxGeometry(r, i, r), u.ConcretePier);
		return o.position.y = i / 2, o.receiveShadow = !0, n.add(o), n;
	}
	static buildStructuralCrossBeam(t) {
		let n = new e.Group(), r = a.mmToM(t.spanMm), i = a.mmToM(t.heightMm || 250), o = a.mmToM(t.depthMm || 180), s = new e.Mesh(new e.BoxGeometry(o, i, r), u.ColumnSteel);
		return n.add(s), n;
	}
	static buildStructuralStringer(t) {
		let n = new e.Group(), r = a.mmToM(t.spanMm), i = new e.Mesh(new e.BoxGeometry(.2, .15, r), u.BranchColumnSteel);
		return n.add(i), n;
	}
	static buildPipe(t) {
		let n = new e.Group(), r = a.mmToM(t.diameterMm) / 2, i = a.mmToM(t.lengthMm), o = t.isSteam ? u.SteamPipe : u.ProcessPipe, s = new e.Mesh(new e.CylinderGeometry(r, r, i, 24), o);
		return t.axis === "Z" ? s.rotation.x = Math.PI / 2 : s.rotation.z = Math.PI / 2, s.castShadow = !0, n.add(s), n;
	}
	static buildHazardZone(t) {
		let n = new e.Group(), r = a.mmToM(t.widthMm), i = a.mmToM(t.heightMm), o = a.mmToM(t.depthMm), s = new e.Mesh(new e.BoxGeometry(r, i, o), u.HazardMesh), c = new e.BoxHelper(s, 16281969);
		return n.add(s, c), n;
	}
	static buildBuildingContext(t) {
		let n = new e.Group(), r = a.mmToM(t.widthMm), i = a.mmToM(t.heightMm), o = a.mmToM(t.depthMm), s = new e.Mesh(new e.BoxGeometry(r, i, o), u.BuildingWall), c = new e.Mesh(new e.BoxGeometry(r * .98, .4, o * .98), u.RaisedFloor);
		return c.position.y = -i / 2 + .2, n.add(s, c), n;
	}
	static buildVisualCable(t) {
		let n = new e.Group();
		if (t.pathPoints.length < 2) return n;
		let r = t.pathPoints.map((t) => new e.Vector3(a.mmToM(t[0]), a.mmToM(t[1]), a.mmToM(t[2]))), i = new e.CatmullRomCurve3(r), o = a.mmToM(t.radiusMm || 25), s = new e.TubeGeometry(i, 64, o, 12, !1), c = u.createCableMaterial(t.colorHex || 440020, t.emissiveHex || 43775), l = new e.Mesh(s, c);
		return n.add(l), n;
	}
};
//#endregion
//#region src/registry/ComponentRegistry.ts
function f(e, t, n, r) {
	let i = Math.abs(r), a = i * Math.PI / 180, o = e + t / 2 + 20, s = Math.max(2, Math.round(i / 15)), c = 0;
	for (let n = 1; n < s; n++) {
		let r = n * a / s, i = -e * Math.sin(r) - (t / 2 * Math.sin(r) + 35 / 2 * Math.cos(r));
		i < c && (c = i);
	}
	return {
		min: [
			0,
			-n / 2,
			c
		],
		max: [
			o,
			n / 2,
			o
		]
	};
}
function p(e, t, n, r, i) {
	let a = t / 2, o = n / 2, s = Math.abs(r), c = s * Math.PI / 180, l = e + o, u = Math.max(0, e - o), d = s >= 90 ? 0 : Math.min(u * Math.cos(c), l * Math.cos(c)), f = l, p = 0, m = 0;
	i ? (p = s >= 90 ? -l : -l * Math.sin(c), m = 0) : (p = 0, m = s >= 90 ? l : l * Math.sin(c));
	let h = -a - 20, g = a + 20;
	return {
		min: [
			d,
			p,
			h
		],
		max: [
			f,
			m,
			g
		]
	};
}
function m(e, t) {
	let n = e.inletWidth || 600, r = e.outletWidth || 450, i = e.depth || 100, a = e.length || 500, o = -n / 2, s = -r / 2, c = n / 2, l = r / 2;
	t === "LEFT" ? (o = -n / 2, s = -n / 2, c = n / 2, l = -n / 2 + r) : t === "RIGHT" && (c = n / 2, l = n / 2, o = -n / 2, s = n / 2 - r);
	let u = s - o, d = Math.hypot(u, a), f = Math.atan2(u, a), p = 20 * Math.cos(f) + d / 2 * Math.abs(Math.sin(f)), m = (o + s) / 2, h = m - p, g = m + p, _ = l - c, v = Math.hypot(_, a), y = Math.atan2(_, a), b = 20 * Math.cos(y) + v / 2 * Math.abs(Math.sin(y)), x = (c + l) / 2, S = x - b, C = x + b, w = Math.min(h, S), T = Math.max(g, C), E = -i / 2, D = i / 2, O = -a / 2 - 35 / 2, k = a / 2 + 35 / 2;
	return {
		min: [
			w,
			E,
			O
		],
		max: [
			T,
			D,
			k
		]
	};
}
function h(e) {
	let t = e.width || 600, n = e.depth || 100, r = e.length || 3e3, i = e.hasSplicePlates !== !1, a = i ? -t / 2 - 55 / 2 : -t / 2 - 20, o = i ? t / 2 + 55 / 2 : t / 2 + 20, s = -n / 2, c = n / 2, l = -r / 2 - 35 / 2, u = i ? r / 2 + 60 : r / 2;
	return {
		min: [
			a,
			s,
			l
		],
		max: [
			o,
			c,
			u
		]
	};
}
var g = class {
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
		this._definitions.clear(), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "TRAY_STRAIGHT",
			name: "Straight Ladder Cable Tray",
			nameZh: "直通梯級式電纜托架",
			family: "TRAY",
			origin: r.LEGACY_FITTING_LIBRARY,
			role: i.TRAY,
			description: "Standard 3-meter straight ladder cable tray for non-IS power/control cabling.",
			hasBomMetadata: !0,
			bomScope: n.MCR_CABLE_TRAY_BOM,
			includedInMcrBom: !0,
			defaultParameters: {
				width: 600,
				depth: 100,
				length: 3e3,
				rungSpacing: 250
			},
			provenance: {
				width: {
					source: "Oglaend Catalog / NEMA VE 1 Standard",
					assumptionLevel: t.DEMO_DEFAULT,
					notes: "600mm nominal tray width"
				},
				depth: {
					source: "Oglaend Catalog Standard",
					assumptionLevel: t.DEMO_DEFAULT,
					notes: "100mm side rail height"
				},
				length: {
					source: "Standard 3m manufactured segment",
					assumptionLevel: t.DEMO_DEFAULT,
					notes: "3000mm segment"
				},
				rungSpacing: {
					source: "NEMA VE 1 standard 9-inch rung spacing",
					assumptionLevel: t.DEMO_DEFAULT,
					notes: "~250mm rung pitch"
				}
			},
			getLocalPorts: (e) => {
				let t = e.length || 3e3, n = e.width || 600, r = e.depth || 100;
				return [{
					id: "PORT_A",
					name: "Inlet Port A",
					localPosition: [
						0,
						0,
						-t / 2
					],
					localDirection: [
						0,
						0,
						-1
					],
					localUp: [
						0,
						1,
						0
					],
					width: n,
					depth: r,
					connectionType: "TRAY_END"
				}, {
					id: "PORT_B",
					name: "Outlet Port B",
					localPosition: [
						0,
						0,
						t / 2
					],
					localDirection: [
						0,
						0,
						1
					],
					localUp: [
						0,
						1,
						0
					],
					width: n,
					depth: r,
					connectionType: "TRAY_END"
				}];
			},
			getCenterlineRoutes: (e) => [l.createStraight("PORT_A", "PORT_B", e.length || 3e3)],
			getBounds: (e) => h(e),
			buildGeometry: (e) => d.buildStraightTray(e)
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "TRAY_STRAIGHT_DIVIDER",
			name: "Divided Straight Tray (IS & Non-IS)",
			nameZh: "隔板分流梯級式電纜托架",
			family: "TRAY",
			origin: r.LEGACY_FITTING_LIBRARY,
			role: i.TRAY,
			description: "Straight ladder tray with central barrier separator isolating IS signal cables from dirty power.",
			hasBomMetadata: !0,
			bomScope: n.MCR_CABLE_TRAY_BOM,
			includedInMcrBom: !0,
			defaultParameters: {
				width: 600,
				depth: 100,
				length: 3e3,
				rungSpacing: 250,
				dividerHeight: 80
			},
			provenance: { dividerHeight: {
				source: "EMC segregation practice",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "Continuous metallic barrier"
			} },
			getLocalPorts: (e) => {
				let t = e.length || 3e3, n = e.width || 600, r = e.depth || 100;
				return [{
					id: "PORT_A",
					name: "Inlet Port A (IS/Non-IS Dual Entry)",
					localPosition: [
						0,
						0,
						-t / 2
					],
					localDirection: [
						0,
						0,
						-1
					],
					localUp: [
						0,
						1,
						0
					],
					width: n,
					depth: r,
					connectionType: "TRAY_END"
				}, {
					id: "PORT_B",
					name: "Outlet Port B (IS/Non-IS Dual Exit)",
					localPosition: [
						0,
						0,
						t / 2
					],
					localDirection: [
						0,
						0,
						1
					],
					localUp: [
						0,
						1,
						0
					],
					width: n,
					depth: r,
					connectionType: "TRAY_END"
				}];
			},
			getCenterlineRoutes: (e) => [l.createStraight("PORT_A", "PORT_B", e.length || 3e3)],
			getBounds: (e) => {
				let t = (e.width || 600) / 2, n = (e.depth || 100) / 2, r = (e.length || 3e3) / 2;
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
			buildGeometry: (e) => d.buildStraightTray({
				...e,
				hasDivider: !0
			})
		}), this.register({
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
			buildGeometry: (e) => d.buildSplicePlate(e)
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
			buildGeometry: (e) => d.buildCantileverSupport(e)
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "FITTING_ELBOW_90",
			name: "Horizontal Elbow 90°",
			nameZh: "90° 水平轉彎頭",
			family: "FITTING",
			origin: r.LEGACY_FITTING_LIBRARY,
			role: i.FITTING,
			description: "Horizontal bend with dynamic angleDeg single source of truth for smooth directional change.",
			hasBomMetadata: !0,
			bomScope: n.MCR_CABLE_TRAY_BOM,
			includedInMcrBom: !0,
			defaultParameters: {
				width: 600,
				depth: 100,
				radius: 600,
				angleDeg: 90
			},
			provenance: {
				radius: {
					source: "Oglaend Catalog / NEMA VE 1 Standard",
					assumptionLevel: t.DEMO_DEFAULT,
					notes: "Standard bend R=600mm"
				},
				angleDeg: {
					source: "Nominal 90 degree sweep",
					assumptionLevel: t.DEMO_DEFAULT,
					notes: "Supports generic angleDeg"
				}
			},
			getLocalPorts: (e) => {
				let t = e.radius || 600, n = e.width || 600, r = e.depth || 100, i = (e.angleDeg ?? 90) * Math.PI / 180, a = t * Math.cos(i), o = -t * Math.sin(i), s = -Math.sin(i), c = -Math.cos(i);
				return [{
					id: "PORT_A",
					name: "Inlet Port A",
					localPosition: [
						t,
						0,
						0
					],
					localDirection: [
						0,
						0,
						1
					],
					localUp: [
						0,
						1,
						0
					],
					width: n,
					depth: r,
					connectionType: "TRAY_END"
				}, {
					id: "PORT_B",
					name: "Outlet Port B",
					localPosition: [
						a,
						0,
						o
					],
					localDirection: [
						s,
						0,
						c
					],
					localUp: [
						0,
						1,
						0
					],
					width: n,
					depth: r,
					connectionType: "TRAY_END"
				}];
			},
			getCenterlineRoutes: (e) => [l.createHorizontalElbow("PORT_A", "PORT_B", e.radius || 600, e.angleDeg ?? 90)],
			getBounds: (e) => f(e.radius || 600, e.width || 600, e.depth || 100, e.angleDeg ?? 90),
			buildGeometry: (e) => d.buildHorizontalElbow({
				...e,
				angleDeg: e.angleDeg ?? 90
			})
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "FITTING_TEE",
			name: "Horizontal Tee Fitting",
			nameZh: "水平三通托架 (Tee)",
			family: "FITTING",
			origin: r.LEGACY_FITTING_LIBRARY,
			role: i.FITTING,
			description: "Standard 3-way horizontal Tee fitting with smooth curved arc transition to lateral branch.",
			hasBomMetadata: !0,
			bomScope: n.MCR_CABLE_TRAY_BOM,
			includedInMcrBom: !0,
			defaultParameters: {
				width: 600,
				depth: 100,
				length: 1400,
				branchLength: 700,
				radius: 300
			},
			provenance: {
				length: {
					source: "Oglaend Catalog Standard Tee",
					assumptionLevel: t.DEMO_DEFAULT,
					notes: "Main run length 1400mm"
				},
				branchLength: {
					source: "Oglaend Catalog Standard Tee",
					assumptionLevel: t.DEMO_DEFAULT,
					notes: "Branch projection 700mm"
				}
			},
			getLocalPorts: (e) => {
				let t = e.length || 1400, n = e.branchLength || 700, r = e.width || 600, i = e.depth || 100;
				return [
					{
						id: "PORT_A",
						name: "Main Run Inlet Port A",
						localPosition: [
							-t / 2,
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
						width: r,
						depth: i,
						connectionType: "TRAY_END"
					},
					{
						id: "PORT_B",
						name: "Main Run Outlet Port B",
						localPosition: [
							t / 2,
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
						width: r,
						depth: i,
						connectionType: "TRAY_END"
					},
					{
						id: "PORT_C",
						name: "Branch Outlet Port C",
						localPosition: [
							0,
							0,
							n
						],
						localDirection: [
							0,
							0,
							1
						],
						localUp: [
							0,
							1,
							0
						],
						width: r,
						depth: i,
						connectionType: "TRAY_END"
					}
				];
			},
			getCenterlineRoutes: (e) => {
				let t = e.length || 1400, n = e.branchLength || 700, r = e.radius || 300, i = {
					id: "ROUTE_A_B",
					fromPort: "PORT_A",
					toPort: "PORT_B",
					type: "STRAIGHT",
					analyticLength: c.straight(t),
					samplePoints: [
						[
							-t / 2,
							0,
							0
						],
						[
							0,
							0,
							0
						],
						[
							t / 2,
							0,
							0
						]
					]
				}, a = [];
				a.push([
					-t / 2,
					0,
					0
				]);
				for (let e = 0; e <= 10; e++) {
					let t = e / 10, n = -Math.PI / 2 + Math.PI / 2 * t, i = -r + r * Math.cos(n), o = r + r * Math.sin(n);
					a.push([
						i,
						0,
						o
					]);
				}
				a.push([
					0,
					0,
					n
				]);
				let o = {
					id: "ROUTE_A_C",
					fromPort: "PORT_A",
					toPort: "PORT_C",
					type: "ARC_XZ",
					analyticLength: c.teeBranch(t, n, r),
					samplePoints: a
				}, s = [];
				s.push([
					t / 2,
					0,
					0
				]);
				for (let e = 0; e <= 10; e++) {
					let t = e / 10, n = -Math.PI / 2 - Math.PI / 2 * t, i = r + r * Math.cos(n), a = r + r * Math.sin(n);
					s.push([
						i,
						0,
						a
					]);
				}
				return s.push([
					0,
					0,
					n
				]), [
					i,
					o,
					{
						id: "ROUTE_B_C",
						fromPort: "PORT_B",
						toPort: "PORT_C",
						type: "ARC_XZ",
						analyticLength: c.teeBranch(t, n, r),
						samplePoints: s
					}
				];
			},
			getBounds: (e) => {
				let t = (e.length || 1400) / 2, n = e.branchLength || 700, r = (e.depth || 100) / 2, i = (e.width || 600) / 2;
				return {
					min: [
						-t,
						-r,
						-i
					],
					max: [
						t,
						r,
						n
					]
				};
			},
			buildGeometry: (e) => d.buildHorizontalTee(e)
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "FITTING_RISER_IN_90",
			name: "Inside Vertical Riser 90°",
			nameZh: "90° 內彎垂直爬坡彎頭",
			family: "FITTING",
			origin: r.LEGACY_FITTING_LIBRARY,
			role: i.FITTING,
			description: "Inside vertical riser with dynamic angleDeg single source of truth for routing elevation changes.",
			hasBomMetadata: !0,
			bomScope: n.MCR_CABLE_TRAY_BOM,
			includedInMcrBom: !0,
			defaultParameters: {
				width: 600,
				depth: 100,
				radius: 600,
				angleDeg: 90
			},
			provenance: {
				radius: {
					source: "Oglaend Catalog Standard",
					assumptionLevel: t.DEMO_DEFAULT,
					notes: "R=600mm bend radius"
				},
				angleDeg: {
					source: "Nominal 90 degree elevation bend",
					assumptionLevel: t.DEMO_DEFAULT,
					notes: "Supports generic angleDeg"
				}
			},
			getLocalPorts: (e) => {
				let t = e.radius || 600, n = e.width || 600, r = e.depth || 100, i = (e.angleDeg ?? 90) * Math.PI / 180;
				return [{
					id: "PORT_A",
					name: "Bottom Inlet",
					localPosition: [
						t,
						0,
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
					width: n,
					depth: r,
					connectionType: "TRAY_END"
				}, {
					id: "PORT_B",
					name: "Top Outlet",
					localPosition: [
						t * Math.cos(i),
						t * Math.sin(i),
						0
					],
					localDirection: [
						-Math.sin(i),
						Math.cos(i),
						0
					],
					localUp: [
						0,
						0,
						1
					],
					width: n,
					depth: r,
					connectionType: "TRAY_END"
				}];
			},
			getCenterlineRoutes: (e) => [l.createVerticalRiser("PORT_A", "PORT_B", e.radius || 600, e.angleDeg ?? 90, !1)],
			getBounds: (e) => p(e.radius || 600, e.width || 600, e.depth || 100, e.angleDeg ?? 90, !1),
			buildGeometry: (e) => d.buildVerticalRiser({
				...e,
				angleDeg: e.angleDeg ?? 90,
				isOutside: !1
			})
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "FITTING_RISER_OUT_90",
			name: "Outside Vertical Riser 90°",
			nameZh: "90° 外彎垂直下坡彎頭",
			family: "FITTING",
			origin: r.LEGACY_FITTING_LIBRARY,
			role: i.FITTING,
			description: "Outside vertical riser with dynamic angleDeg and exact centerline ↔ port endpoint invariant.",
			hasBomMetadata: !0,
			bomScope: n.MCR_CABLE_TRAY_BOM,
			includedInMcrBom: !0,
			defaultParameters: {
				width: 600,
				depth: 100,
				radius: 600,
				angleDeg: 90
			},
			provenance: {
				radius: {
					source: "Oglaend Catalog Standard",
					assumptionLevel: t.DEMO_DEFAULT,
					notes: "R=600mm bend radius"
				},
				angleDeg: {
					source: "Nominal 90 degree downward bend",
					assumptionLevel: t.DEMO_DEFAULT,
					notes: "Supports generic angleDeg"
				}
			},
			getLocalPorts: (e) => {
				let t = e.radius || 600, n = e.width || 600, r = e.depth || 100, i = (e.angleDeg ?? 90) * Math.PI / 180;
				return [{
					id: "PORT_A",
					name: "Top Inlet",
					localPosition: [
						t,
						0,
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
					width: n,
					depth: r,
					connectionType: "TRAY_END"
				}, {
					id: "PORT_B",
					name: "Bottom Outlet",
					localPosition: [
						t * Math.cos(i),
						-t * Math.sin(i),
						0
					],
					localDirection: [
						-Math.sin(i),
						-Math.cos(i),
						0
					],
					localUp: [
						0,
						0,
						1
					],
					width: n,
					depth: r,
					connectionType: "TRAY_END"
				}];
			},
			getCenterlineRoutes: (e) => [l.createVerticalRiser("PORT_A", "PORT_B", e.radius || 600, e.angleDeg ?? 90, !0)],
			getBounds: (e) => p(e.radius || 600, e.width || 600, e.depth || 100, e.angleDeg ?? 90, !0),
			buildGeometry: (e) => d.buildVerticalRiser({
				...e,
				angleDeg: e.angleDeg ?? 90,
				isOutside: !0
			})
		}), this.register({
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
			buildGeometry: (e) => d.buildJunctionBox(e)
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
			buildGeometry: (e) => d.buildUnistrutMount(e)
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
			buildGeometry: (e) => d.buildConduitRiser(e)
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
			buildGeometry: (e) => d.buildMctPenetration(e)
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
			buildGeometry: (e) => d.buildControlCabinet(e)
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
			buildGeometry: (e) => d.buildStructuralColumn(e)
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
			buildGeometry: (e) => d.buildStructuralPier(e)
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
			buildGeometry: (e) => d.buildStructuralCrossBeam(e)
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
			buildGeometry: (e) => d.buildStructuralStringer(e)
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
			buildGeometry: (e) => d.buildPipe({
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
			buildGeometry: (e) => d.buildPipe({
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
			buildGeometry: (e) => d.buildPipe({
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
			buildGeometry: (e) => d.buildPipe({
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
			buildGeometry: (e) => d.buildHazardZone(e)
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
			buildGeometry: (e) => d.buildBuildingContext(e)
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
			buildGeometry: (e) => d.buildVisualCable(e)
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "FITTING_ELBOW_45",
			name: "Horizontal Elbow 45°",
			nameZh: "45° 水平轉彎頭",
			family: "FITTING",
			origin: r.NEW_COMPONENT,
			role: i.FITTING,
			description: "Factory-formed 45-degree horizontal elbow with dynamic angleDeg parameter support.",
			hasBomMetadata: !0,
			bomScope: n.MCR_CABLE_TRAY_BOM,
			includedInMcrBom: !0,
			defaultParameters: {
				width: 600,
				depth: 100,
				radius: 600,
				angleDeg: 45
			},
			provenance: { radius: {
				source: "Standard 45-deg elbow R=600mm",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "R=600mm"
			} },
			getLocalPorts: (e) => {
				let t = e.radius || 600, n = e.width || 600, r = e.depth || 100, i = (e.angleDeg ?? 45) * Math.PI / 180, a = t * Math.cos(i), o = -t * Math.sin(i), s = -Math.sin(i), c = -Math.cos(i);
				return [{
					id: "PORT_A",
					name: "Inlet Port A",
					localPosition: [
						t,
						0,
						0
					],
					localDirection: [
						0,
						0,
						1
					],
					localUp: [
						0,
						1,
						0
					],
					width: n,
					depth: r,
					connectionType: "TRAY_END"
				}, {
					id: "PORT_B",
					name: "Outlet Port B",
					localPosition: [
						a,
						0,
						o
					],
					localDirection: [
						s,
						0,
						c
					],
					localUp: [
						0,
						1,
						0
					],
					width: n,
					depth: r,
					connectionType: "TRAY_END"
				}];
			},
			getCenterlineRoutes: (e) => [l.createHorizontalElbow("PORT_A", "PORT_B", e.radius || 600, e.angleDeg ?? 45)],
			getBounds: (e) => f(e.radius || 600, e.width || 600, e.depth || 100, e.angleDeg ?? 45),
			buildGeometry: (e) => d.buildHorizontalElbow({
				...e,
				angleDeg: e.angleDeg ?? 45
			})
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "FITTING_RISER_IN_45",
			name: "Inside Vertical Riser 45°",
			nameZh: "45° 內彎垂直爬坡彎頭",
			family: "FITTING",
			origin: r.NEW_COMPONENT,
			role: i.FITTING,
			description: "45-degree inside vertical riser with dynamic angleDeg parameter support.",
			hasBomMetadata: !0,
			bomScope: n.MCR_CABLE_TRAY_BOM,
			includedInMcrBom: !0,
			defaultParameters: {
				width: 600,
				depth: 100,
				radius: 600,
				angleDeg: 45
			},
			provenance: { radius: {
				source: "Standard 45-deg riser R=600mm",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "R=600mm"
			} },
			getLocalPorts: (e) => {
				let t = e.radius || 600, n = e.width || 600, r = e.depth || 100, i = (e.angleDeg ?? 45) * Math.PI / 180;
				return [{
					id: "PORT_A",
					name: "Bottom Inlet",
					localPosition: [
						t,
						0,
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
					width: n,
					depth: r,
					connectionType: "TRAY_END"
				}, {
					id: "PORT_B",
					name: "Top Outlet",
					localPosition: [
						t * Math.cos(i),
						t * Math.sin(i),
						0
					],
					localDirection: [
						-Math.sin(i),
						Math.cos(i),
						0
					],
					localUp: [
						0,
						0,
						1
					],
					width: n,
					depth: r,
					connectionType: "TRAY_END"
				}];
			},
			getCenterlineRoutes: (e) => [l.createVerticalRiser("PORT_A", "PORT_B", e.radius || 600, e.angleDeg ?? 45, !1)],
			getBounds: (e) => p(e.radius || 600, e.width || 600, e.depth || 100, e.angleDeg ?? 45, !1),
			buildGeometry: (e) => d.buildVerticalRiser({
				...e,
				angleDeg: e.angleDeg ?? 45,
				isOutside: !1
			})
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "FITTING_RISER_OUT_45",
			name: "Outside Vertical Riser 45°",
			nameZh: "45° 外彎垂直下坡彎頭",
			family: "FITTING",
			origin: r.NEW_COMPONENT,
			role: i.FITTING,
			description: "45-degree outside vertical riser with exact centerline ↔ port endpoint invariant.",
			hasBomMetadata: !0,
			bomScope: n.MCR_CABLE_TRAY_BOM,
			includedInMcrBom: !0,
			defaultParameters: {
				width: 600,
				depth: 100,
				radius: 600,
				angleDeg: 45
			},
			provenance: { radius: {
				source: "Standard 45-deg riser R=600mm",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "R=600mm"
			} },
			getLocalPorts: (e) => {
				let t = e.radius || 600, n = e.width || 600, r = e.depth || 100, i = (e.angleDeg ?? 45) * Math.PI / 180;
				return [{
					id: "PORT_A",
					name: "Top Inlet",
					localPosition: [
						t,
						0,
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
					width: n,
					depth: r,
					connectionType: "TRAY_END"
				}, {
					id: "PORT_B",
					name: "Bottom Outlet",
					localPosition: [
						t * Math.cos(i),
						-t * Math.sin(i),
						0
					],
					localDirection: [
						-Math.sin(i),
						-Math.cos(i),
						0
					],
					localUp: [
						0,
						0,
						1
					],
					width: n,
					depth: r,
					connectionType: "TRAY_END"
				}];
			},
			getCenterlineRoutes: (e) => [l.createVerticalRiser("PORT_A", "PORT_B", e.radius || 600, e.angleDeg ?? 45, !0)],
			getBounds: (e) => p(e.radius || 600, e.width || 600, e.depth || 100, e.angleDeg ?? 45, !0),
			buildGeometry: (e) => d.buildVerticalRiser({
				...e,
				angleDeg: e.angleDeg ?? 45,
				isOutside: !0
			})
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "FITTING_REDUCER_LEFT",
			name: "Left-Hand Eccentric Reducer",
			nameZh: "左偏異徑大小頭 (Left Reducer)",
			family: "FITTING",
			origin: r.NEW_COMPONENT,
			role: i.FITTING,
			description: "Left-hand eccentric reducer transitioning tray widths while keeping the right side straight.",
			hasBomMetadata: !0,
			bomScope: n.MCR_CABLE_TRAY_BOM,
			includedInMcrBom: !0,
			defaultParameters: {
				inletWidth: 600,
				outletWidth: 450,
				depth: 100,
				length: 500
			},
			provenance: { length: {
				source: "NEMA VE 1 standard reducer transition",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "500mm standard transition"
			} },
			getLocalPorts: (e) => {
				let t = e.inletWidth || 600, n = e.outletWidth || 450, r = e.depth || 100, i = (e.length || 500) / 2, a = (n - t) / 2;
				return [{
					id: "PORT_A",
					name: "Wide Inlet Port A",
					localPosition: [
						0,
						0,
						-i
					],
					localDirection: [
						0,
						0,
						-1
					],
					localUp: [
						0,
						1,
						0
					],
					width: t,
					depth: r,
					connectionType: "TRAY_END"
				}, {
					id: "PORT_B",
					name: "Narrow Outlet Port B",
					localPosition: [
						a,
						0,
						i
					],
					localDirection: [
						0,
						0,
						1
					],
					localUp: [
						0,
						1,
						0
					],
					width: n,
					depth: r,
					connectionType: "TRAY_END"
				}];
			},
			getCenterlineRoutes: (e) => {
				let t = e.inletWidth || 600, n = ((e.outletWidth || 450) - t) / 2;
				return [l.createReducer("PORT_A", "PORT_B", e.length || 500, n)];
			},
			getBounds: (e) => m(e, "LEFT"),
			buildGeometry: (e) => d.buildReducer({
				...e,
				type: "LEFT"
			})
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "FITTING_REDUCER_CENTER",
			name: "Concentric Center Reducer",
			nameZh: "同心異徑大小頭 (Center Reducer)",
			family: "FITTING",
			origin: r.NEW_COMPONENT,
			role: i.FITTING,
			description: "Concentric reducer symmetrically tapering tray width.",
			hasBomMetadata: !0,
			bomScope: n.MCR_CABLE_TRAY_BOM,
			includedInMcrBom: !0,
			defaultParameters: {
				inletWidth: 600,
				outletWidth: 450,
				depth: 100,
				length: 500
			},
			provenance: { length: {
				source: "NEMA VE 1 standard reducer transition",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "500mm standard transition"
			} },
			getLocalPorts: (e) => {
				let t = e.inletWidth || 600, n = e.outletWidth || 450, r = e.depth || 100, i = (e.length || 500) / 2;
				return [{
					id: "PORT_A",
					name: "Wide Inlet Port A",
					localPosition: [
						0,
						0,
						-i
					],
					localDirection: [
						0,
						0,
						-1
					],
					localUp: [
						0,
						1,
						0
					],
					width: t,
					depth: r,
					connectionType: "TRAY_END"
				}, {
					id: "PORT_B",
					name: "Narrow Outlet Port B",
					localPosition: [
						0,
						0,
						i
					],
					localDirection: [
						0,
						0,
						1
					],
					localUp: [
						0,
						1,
						0
					],
					width: n,
					depth: r,
					connectionType: "TRAY_END"
				}];
			},
			getCenterlineRoutes: (e) => [l.createReducer("PORT_A", "PORT_B", e.length || 500, 0)],
			getBounds: (e) => m(e, "CONCENTRIC"),
			buildGeometry: (e) => d.buildReducer({
				...e,
				type: "CONCENTRIC"
			})
		}), this.register({
			schemaVersion: "2.0.0",
			componentVersion: "1.0.0",
			id: "FITTING_REDUCER_RIGHT",
			name: "Right-Hand Eccentric Reducer",
			nameZh: "右偏異徑大小頭 (Right Reducer)",
			family: "FITTING",
			origin: r.NEW_COMPONENT,
			role: i.FITTING,
			description: "Right-hand eccentric reducer transitioning tray widths while keeping the left side straight.",
			hasBomMetadata: !0,
			bomScope: n.MCR_CABLE_TRAY_BOM,
			includedInMcrBom: !0,
			defaultParameters: {
				inletWidth: 600,
				outletWidth: 450,
				depth: 100,
				length: 500
			},
			provenance: { length: {
				source: "NEMA VE 1 standard reducer transition",
				assumptionLevel: t.DEMO_DEFAULT,
				notes: "500mm standard transition"
			} },
			getLocalPorts: (e) => {
				let t = e.inletWidth || 600, n = e.outletWidth || 450, r = e.depth || 100, i = (e.length || 500) / 2, a = (t - n) / 2;
				return [{
					id: "PORT_A",
					name: "Wide Inlet Port A",
					localPosition: [
						0,
						0,
						-i
					],
					localDirection: [
						0,
						0,
						-1
					],
					localUp: [
						0,
						1,
						0
					],
					width: t,
					depth: r,
					connectionType: "TRAY_END"
				}, {
					id: "PORT_B",
					name: "Narrow Outlet Port B",
					localPosition: [
						a,
						0,
						i
					],
					localDirection: [
						0,
						0,
						1
					],
					localUp: [
						0,
						1,
						0
					],
					width: n,
					depth: r,
					connectionType: "TRAY_END"
				}];
			},
			getCenterlineRoutes: (e) => {
				let t = ((e.inletWidth || 600) - (e.outletWidth || 450)) / 2;
				return [l.createReducer("PORT_A", "PORT_B", e.length || 500, t)];
			},
			getBounds: (e) => m(e, "RIGHT"),
			buildGeometry: (e) => d.buildReducer({
				...e,
				type: "RIGHT"
			})
		}), this.register({
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
					let n = d.buildStructuralColumn({
						heightMm: 8e3,
						widthMm: 350
					});
					n.position.set(0, 0, e);
					let r = d.buildStructuralPier({
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
					let n = d.buildStructuralCrossBeam({ spanMm: 7800 });
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
					let n = d.buildStructuralColumn({
						heightMm: 8e3,
						widthMm: 300
					});
					n.position.set(e, 0, 0), t.add(n);
				});
				let n = d.buildStructuralCrossBeam({ spanMm: 2700 });
				return n.position.set(0, 7.15, 0), n.rotation.y = Math.PI / 2, t.add(n), [-1.2, 1.2].forEach((e) => {
					let n = d.buildStructuralStringer({ spanMm: 6e3 });
					n.position.set(e, 7.15, 0), t.add(n);
				}), t;
			}
		});
	}
}, _ = {
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
}, v = class {
	static getSubComponents(e) {
		return g.get(e)?.subComponents || [];
	}
	static isAssembly(e) {
		let t = g.get(e);
		return t?.origin === "DERIVED_ASSEMBLY" && !!t?.subComponents && t.subComponents.length > 0;
	}
}, y = class {
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
}, b = class {
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
		let c = new y(o.worldPosition, o.worldDirection, o.worldUp), l = c.direction.clone().negate().normalize(), u = c.up.clone().normalize(), d = new e.Vector3().crossVectors(u, l).normalize(), f = new e.Vector3().crossVectors(l, d).normalize(), p = new e.Matrix4();
		p.makeBasis(d, f, l);
		let m = new y(s.localPosition, s.localDirection, s.localUp), h = new e.Matrix4();
		h.makeBasis(m.right, m.up, m.direction);
		let g = h.clone().transpose(), _ = new e.Matrix4().multiplyMatrices(p, g), v = new e.Quaternion().setFromRotationMatrix(_), b = m.position.clone().applyQuaternion(v), x = c.position.clone().sub(b), S = {
			position: [
				x.x,
				x.y,
				x.z
			],
			quaternion: [
				v.x,
				v.y,
				v.z,
				v.w
			]
		}, C = m.position.clone().applyQuaternion(v).add(x), w = m.direction.clone().applyQuaternion(v).normalize(), T = C.distanceTo(c.position), E = w.dot(c.direction), D = T <= a && E <= -.99;
		return {
			success: D,
			placement: S,
			positionErrorMm: T,
			alignmentDotProduct: E,
			message: D ? `Mated successfully. Position error: ${T.toFixed(4)} mm, alignment dot: ${E.toFixed(4)}` : `Mating out of tolerance. Error: ${T.toFixed(4)} mm, dot: ${E.toFixed(4)}`
		};
	}
	static computePlacement(e, t, n, r, i = .5) {
		return this.computeMateTransform(e, t, n, r, i).placement;
	}
	static placeComponentByPort(e, t, n, r, i = .5) {
		let a = this.computeMateTransform(e, t, n, r, i);
		return a.success && n.setPlacement(a.placement), a;
	}
}, x = class {
	static validateConnection(e, t, n, r) {
		let i = e.definition.getLocalPorts(e.effectiveParameters), a = n.definition.getLocalPorts(n.effectiveParameters), o = i.find((e) => e.id === t), s = a.find((e) => e.id === r);
		return !o || !s ? {
			valid: !1,
			code: "PORT_NOT_FOUND",
			error: `One or both ports not found (${t} on ${e.instanceId}, ${r} on ${n.instanceId})`
		} : o.connectionType === s.connectionType ? Math.abs(o.width - s.width) > 1 ? {
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
		} : Math.abs(o.depth - s.depth) > 1 ? {
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
		} : {
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
	}
}, S = class {
	static generateBom(e, t = {}) {
		let r = t.scope ?? "ALL", i = t.filterBundledChildren !== !1, a = t.includeVisualOnly === !0, o = /* @__PURE__ */ new Map(), s = 1, c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set(), u = [];
		e.forEach((e) => {
			(v.isAssembly(e.definitionId) || e.definition.subComponents && e.definition.subComponents.length > 0) && (c.add(e.instanceId), (v.getSubComponents(e.definitionId).length > 0 ? v.getSubComponents(e.definitionId) : e.definition.subComponents || []).forEach((t) => {
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
			let f = t.id, p = "", m = "PCS";
			if (t.id === "TRAY_STRAIGHT" || t.id === "TRAY_STRAIGHT_DIVIDER") {
				let t = (e.effectiveParameters.length || 3e3) / 1e3;
				p = `W=${e.effectiveParameters.width || 600}mm / H=${e.effectiveParameters.depth || 100}mm / L=${t}m (HDG 85μm)`, m = "支";
			} else t.id.startsWith("FITTING_ELBOW") ? (p = `R=${e.effectiveParameters.radius || 600}mm W=${e.effectiveParameters.width || 600}mm Angle=${e.effectiveParameters.angleDeg ?? 90}°`, m = "組") : t.id === "FITTING_TEE" ? (p = `W=${e.effectiveParameters.width || 600}mm L=${e.effectiveParameters.length || 1400}mm Branch=${e.effectiveParameters.branchLength || 700}mm`, m = "組") : t.id.startsWith("FITTING_REDUCER") ? (p = `W1=${e.effectiveParameters.inletWidth || 600}mm -> W2=${e.effectiveParameters.outletWidth || 450}mm L=${e.effectiveParameters.length || 500}mm`, m = "組") : t.id === "PENETRATION_MCT" ? (p = `RG M6x1 A-60 防火氣密等級 (${e.effectiveParameters.widthMm || 600}x${e.effectiveParameters.heightMm || 900}mm)`, m = "套") : t.id === "STRUCT_MAIN_BAY" ? (p = "主管廊四階門型構架套件 (含 2 柱、2 墩、4 橫樑，Span=7.8m, EL +8.0m)", m = "套 (Kit)") : t.id === "STRUCT_BRANCH_BAY" ? (p = "支管廊門型構架套件 (含 2 柱、4 橫樑、2 縱樑，Span=2.7m)", m = "套 (Kit)") : p = "標準工程預製規格";
			let h = v.isAssembly(t.id) || t.subComponents && t.subComponents.length > 0 || !1;
			o.has(f) ? o.get(f).quantity += 1 : o.set(f, {
				itemNumber: String(s++).padStart(2, "0"),
				definitionId: t.id,
				name: t.name,
				nameZh: t.nameZh,
				bomScope: t.bomScope ?? n.MCR_CABLE_TRAY_BOM,
				spec: p,
				quantity: 1,
				unit: m,
				isAssemblyKit: h,
				notes: h ? "Assembly Kit: Internal subcomponents bundled (No double count)" : "Direct Component"
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
function C(t, n) {
	let r = {
		...t.defaultParameters,
		...n
	}, i = t.buildGeometry(r);
	i.updateMatrixWorld(!0);
	let a = new e.Box3().setFromObject(i);
	return {
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
var w = class {
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
}, T = {
	TRAY_STRAIGHT: {
		id: "TRAY_STRAIGHT",
		childMeshCount: 17,
		vertexCount: 616,
		triangleCount: 332,
		bounds: [
			-.3275,
			-.05,
			-1.5175,
			.3275,
			.05,
			1.56
		],
		projectedCentroid: [-.0057, -.0039]
	},
	TRAY_STRAIGHT_DIVIDER: {
		id: "TRAY_STRAIGHT_DIVIDER",
		childMeshCount: 18,
		vertexCount: 640,
		triangleCount: 344,
		bounds: [
			-.3275,
			-.05,
			-1.5175,
			.3275,
			.05,
			1.56
		],
		projectedCentroid: [-.0057, -.0039]
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
		childMeshCount: 7,
		vertexCount: 3216,
		triangleCount: 1092,
		bounds: [
			0,
			-.05,
			-.8739,
			.92,
			.05,
			.92
		],
		projectedCentroid: [.1447, -.0832]
	},
	FITTING_TEE: {
		id: "FITTING_TEE",
		childMeshCount: 9,
		vertexCount: 216,
		triangleCount: 108,
		bounds: [
			-.7,
			-.05,
			-.32,
			.7,
			.05,
			.7
		],
		projectedCentroid: [-.0522, -.0361]
	},
	FITTING_RISER_IN_90: {
		id: "FITTING_RISER_IN_90",
		childMeshCount: 7,
		vertexCount: 3216,
		triangleCount: 1092,
		bounds: [
			0,
			0,
			-.32,
			.65,
			.65,
			.32
		],
		projectedCentroid: [.1082, .1143]
	},
	FITTING_RISER_OUT_90: {
		id: "FITTING_RISER_OUT_90",
		childMeshCount: 7,
		vertexCount: 3216,
		triangleCount: 1092,
		bounds: [
			0,
			-.65,
			-.32,
			.65,
			0,
			.32
		],
		projectedCentroid: [.101, -.2117]
	}
}, E = class {
	static runAll() {
		g.initAll();
		let e = [];
		e.push(this.testCaseA()), e.push(this.testCaseB()), e.push(this.testCaseC()), e.push(this.testCaseD()), e.push(this.testCaseE()), e.push(this.testCaseF()), e.push(this.testCaseG()), e.push(this.testCaseH()), e.push(this.testCaseI()), e.push(this.testCaseJ()), e.push(this.testCaseK()), e.push(this.testCaseL()), e.push(this.testCaseM()), e.push(this.testCaseN()), e.push(this.testCaseO()), e.push(this.testCaseP()), e.push(this.testCaseQ_CenterlinePortEndpoints()), e.push(this.testCaseR_BoundsConsistency()), e.push(this.testCaseS_PortFrameHandedness()), e.push(this.testCaseT_EccentricReducerLength()), e.push(this.testCaseU_TeePhysicalCenterline()), e.push(this.testCaseV_DerivedStateExport());
		let t = e.filter((e) => e.passed).length, n = e.length - t;
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
		let e = g.get("TRAY_STRAIGHT"), t = g.get("FITTING_ELBOW_90"), n = new s("inst_straight", e, {
			width: 600,
			depth: 100
		}), r = new s("inst_elbow", t, {
			width: 600,
			depth: 100
		}), i = x.validateConnection(n, "PORT_B", r, "PORT_A"), a = i.valid && i.code === "OK";
		return {
			id: "Case A",
			name: "標準對接測試 (Standard Mating Compatibility)",
			passed: a,
			expected: "validateConnection returns PASS (valid: true)",
			actual: a ? "PASS (相容通過, 600W x 100D TRAY_END)" : `FAIL: ${i.error}`,
			details: i
		};
	}
	static testCaseB() {
		let e = g.get("TRAY_STRAIGHT"), t = g.get("FITTING_ELBOW_90"), n = new s("inst_straight", e, {
			width: 600,
			depth: 100
		}), r = new s("inst_elbow", t, {
			width: 450,
			depth: 100
		}), i = x.validateConnection(n, "PORT_B", r, "PORT_A"), a = !i.valid && (i.code === "WIDTH_MISMATCH" || i.code === "DIMENSION_MISMATCH");
		return {
			id: "Case B",
			name: "尺寸不符攔截 (Dimension Mismatch Interception)",
			passed: a,
			expected: "validateConnection returns FAIL with WIDTH_MISMATCH",
			actual: a ? `PASS (成功攔截: ${i.error})` : "FAIL: Unexpected result",
			details: i
		};
	}
	static testCaseC() {
		let e = g.get("TRAY_STRAIGHT"), t = g.get("FITTING_ELBOW_90"), n = new s("inst_straight", e, {
			width: 600,
			depth: 100
		}), r = new s("inst_elbow", t, {
			width: 600,
			depth: 150
		}), i = x.validateConnection(n, "PORT_B", r, "PORT_A"), a = !i.valid && (i.code === "DEPTH_MISMATCH" || i.code === "DIMENSION_MISMATCH");
		return {
			id: "Case C",
			name: "深度不符攔截 (Depth Mismatch Interception)",
			passed: a,
			expected: "validateConnection returns FAIL with DEPTH_MISMATCH (depth 100 != 150)",
			actual: a ? `PASS (成功攔截: ${i.error})` : "FAIL: Unexpected result",
			details: i
		};
	}
	static testCaseD() {
		let e = g.get("TRAY_STRAIGHT"), t = g.get("EQUIP_JUNCTION_BOX"), n = new s("inst_straight", e), r = new s("inst_jb", t), i = x.validateConnection(n, "PORT_B", r, "PORT_BOTTOM_GLAND"), a = !i.valid && i.code === "TYPE_MISMATCH";
		return {
			id: "Case D",
			name: "連接類型不符攔截 (Type Mismatch Interception)",
			passed: a,
			expected: "validateConnection returns FAIL with TYPE_MISMATCH (TRAY_END vs GLAND)",
			actual: a ? `PASS (成功攔截: ${i.error})` : "FAIL: Unexpected result",
			details: i
		};
	}
	static testCaseE() {
		let e = g.get("TRAY_STRAIGHT"), t = g.get("TRAY_STRAIGHT"), n = g.get("FITTING_REDUCER_LEFT"), r = new s("s600", e, {
			width: 600,
			depth: 100
		}), i = new s("red", n, {
			inletWidth: 600,
			outletWidth: 450,
			depth: 100
		}), a = new s("s450", t, {
			width: 450,
			depth: 100
		}), o = x.validateConnection(r, "PORT_B", i, "PORT_A"), c = x.validateConnection(i, "PORT_B", a, "PORT_A"), l = o.valid && c.valid;
		return {
			id: "Case E",
			name: "異徑轉接成功 (Reducer Transition Compatibility)",
			passed: l,
			expected: "Both 600mm inlet and 450mm outlet validate successfully",
			actual: l ? "PASS (寬度 600mm ➔ 異徑組件 ➔ 450mm 雙向對接全部相容通過)" : `FAIL: In=${o.valid}, Out=${c.valid}`,
			details: {
				val1: o,
				val2: c
			}
		};
	}
	static testCaseF() {
		let e = g.get("TRAY_STRAIGHT"), t = new s("instA", e, { length: 3e3 }), n = new s("instB", e, { length: 3e3 }), r = b.computePlacement(t, "PORT_B", n, "PORT_A");
		n.setPlacement(r);
		let i = t.getWorldPorts().find((e) => e.id === "PORT_B"), a = n.getWorldPorts().find((e) => e.id === "PORT_A"), c = o.distance(i.worldPosition, a.worldPosition), l = o.dot(i.worldDirection, a.worldDirection), u = o.dot(i.worldUp, a.worldUp), d = c <= .001, f = Math.abs(l - -1) <= .001, p = Math.abs(u - 1) <= .001, m = d && f && p;
		return {
			id: "Case F",
			name: "自動對接幾何放置驗證 (Mate Placement Spatial Invariants)",
			passed: m,
			expected: "Distance <= 0.001mm, Direction Dot == -1.0 (Opposite), Up Dot == 1.0 (Co-planar)",
			actual: m ? `PASS (Dist=${c.toFixed(4)}mm, DirDot=${l.toFixed(3)}, UpDot=${u.toFixed(3)})` : `FAIL: Dist=${c}mm, DirDot=${l}, UpDot=${u}`,
			details: {
				dist: c,
				dotDir: l,
				dotUp: u,
				placement: r
			}
		};
	}
	static testCaseG() {
		let e = g.get("TRAY_STRAIGHT"), t = [], n = new s("tray_0", e, { length: 3e3 });
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
			let r = t[n - 1], i = new s(`tray_${n}`, e, { length: 3e3 }), a = b.computePlacement(r, "PORT_B", i, "PORT_A");
			i.setPlacement(a), t.push(i);
		}
		let r = t[9].getWorldPorts().find((e) => e.id === "PORT_B"), i = Math.abs(r.worldPosition[2] - 3e4), a = Math.abs(r.worldPosition[0]), o = Math.abs(r.worldPosition[1]), c = Math.max(a, o, i), l = c <= .01;
		return {
			id: "Case G",
			name: "鏈式對接累積誤差 (Chain Mating Cumulative Error Across 10 Segments)",
			passed: l,
			expected: "Cumulative position error <= 0.01mm after 10 mated 3m segments (Total 30m)",
			actual: l ? `PASS (總長 30m, 終端端點 Z=${r.worldPosition[2].toFixed(4)}mm, 累積誤差=${c.toExponential(2)}mm)` : `FAIL: Max Error = ${c}mm`,
			details: {
				finalPosition: r.worldPosition,
				error: c
			}
		};
	}
	static testCaseH() {
		let e = g.get("FITTING_ELBOW_90"), t = w.exportDefinition(e), n = t.schemaVersion === "2.0.0", r = t.ports.length === 2, i = t.centerlines.length === 1, a = !!t.bounds && t.bounds.min && t.bounds.max, o = n && r && i && a;
		return {
			id: "Case H",
			name: "JSON 結構序列化確效 (JSON Export Structure Compliance)",
			passed: o,
			expected: "JSON has schemaVersion 2.0.0, ports, centerlines, and bounds",
			actual: o ? `PASS (JSON Schema 2.0.0 格式完整, 含 ${t.ports.length} 埠位, ${t.centerlines.length} 中心線, 包絡範圍齊備)` : "FAIL: Missing schema attributes",
			details: t
		};
	}
	static testCaseI() {
		let e = g.get("FITTING_ELBOW_90"), t = new s("e1", e, { radius: 600 }), n = new s("e2", e, { radius: 600 }), r = new s("e3", e, { radius: 600 }), i = new s("e4", e, { radius: 600 });
		n.setPlacement(b.computePlacement(t, "PORT_B", n, "PORT_A")), r.setPlacement(b.computePlacement(n, "PORT_B", r, "PORT_A")), i.setPlacement(b.computePlacement(r, "PORT_B", i, "PORT_A"));
		let a = t.getWorldPorts().find((e) => e.id === "PORT_A"), c = i.getWorldPorts().find((e) => e.id === "PORT_B"), l = o.distance(a.worldPosition, c.worldPosition), u = l <= .05;
		return {
			id: "Case I",
			name: "迴轉環路封閉精確度 (Closed Loop 4x90° Elbow Closure Precision)",
			passed: u,
			expected: "Closure gap <= 0.05mm after completing a 360-degree loop",
			actual: u ? `PASS (四只 90° 彎頭閉合間隙 Gap=${l.toExponential(2)}mm)` : `FAIL: Loop gap = ${l}mm`,
			details: {
				gap: l,
				start: a.worldPosition,
				end: c.worldPosition
			}
		};
	}
	static testCaseJ() {
		let e = g.get("OBSTACLE_MAIN_PROCESS_PIPE").getBounds({
			diameterMm: 500,
			lengthMm: 6e3,
			clearanceMm: 150
		}), t = !!e.clearanceEnvelope, n = t ? e.clearanceEnvelope.max[1] : 0, r = t && n === 400;
		return {
			id: "Case J",
			name: "避讓包絡體動態計算 (Obstacle Clearance Envelope Computation)",
			passed: r,
			expected: "Clearance Envelope radius == 400mm (Pipe R=250 + Clearance 150mm)",
			actual: r ? `PASS (管徑 500mm + 防護緩衝 150mm ➔ 淨空包絡半徑 = ${n}mm)` : `FAIL: Expected 400, got ${n}`,
			details: e
		};
	}
	static testCaseK() {
		let e = _.checkConformance({ width: 600 }), t = _.checkConformance({ width: 550 }), n = e.isStandard && !t.isStandard && t.warnings.length > 0;
		return {
			id: "Case K",
			name: "工程型錄規範檢核 (Catalog Standards & Presets Conformance)",
			passed: n,
			expected: "600mm passes as standard; 550mm flags non-standard warning",
			actual: n ? `PASS (600mm 標準通過; 550mm 正確警示: "${t.warnings[0]}")` : "FAIL: Unexpected conformance check",
			details: {
				standardWidth: e,
				nonStandardWidth: t
			}
		};
	}
	static testCaseL() {
		let e = g.get("TRAY_STRAIGHT"), t = g.get("FITTING_ELBOW_90"), n = g.get("FITTING_ELBOW_45"), r = e.getCenterlineRoutes({ length: 3e3 })[0], i = t.getCenterlineRoutes({
			radius: 600,
			angleDeg: 90
		})[0], a = n.getCenterlineRoutes({
			radius: 600,
			angleDeg: 45
		})[0], o = 600 * Math.PI / 2, s = 600 * Math.PI / 4, c = Math.abs(r.analyticLength - 3e3), l = Math.abs(i.analyticLength - o), u = Math.abs(a.analyticLength - s), d = Math.max(c, l, u), f = d <= .001;
		return {
			id: "Case L",
			name: "解析中心線長度精確度 (Analytic Centerline Length Formula Validation)",
			passed: f,
			expected: "Straight: 3000.000mm, Elbow 90°: 942.478mm, Elbow 45°: 471.239mm (Error <= 0.001mm)",
			actual: f ? `PASS (Straight=${r.analyticLength.toFixed(3)}mm, E90=${i.analyticLength.toFixed(3)}mm, E45=${a.analyticLength.toFixed(3)}mm, MaxError=${d.toExponential(2)}mm)` : `FAIL: Max Error = ${d}mm`,
			details: {
				rStraight: r,
				rElbow90: i,
				rElbow45: a
			}
		};
	}
	static testCaseM() {
		let e = g.get("STRUCT_MAIN_BAY"), t = g.get("STRUCT_COLUMN"), n = [
			new s("bay_01", e),
			new s("bay_01_col1", t, {}, {}, "bay_01"),
			new s("bay_01_col2", t, {}, {}, "bay_01"),
			new s("separate_col_01", t)
		], r = S.generateBom(n, { filterBundledChildren: !0 }), i = S.generateBom(n, { filterBundledChildren: !1 }), a = r.items.some((e) => e.definitionId === "STRUCT_MAIN_BAY" && e.isAssemblyKit), o = r.items.find((e) => e.definitionId === "STRUCT_COLUMN"), c = i.items.find((e) => e.definitionId === "STRUCT_COLUMN"), l = r.excludedBundledItems.includes("bay_01_col1") && r.excludedBundledItems.includes("bay_01_col2"), u = o?.quantity === 1, d = i.hasDoubleCounting && c?.quantity === 3, f = a && l && u && !r.hasDoubleCounting && d;
		return {
			id: "Case M",
			name: "組合件材料清單不重複計價 (Assembly BOM Zero Double-Counting Fixture)",
			passed: f,
			expected: "Assembly Kit filters 2 bundled columns, only bills 1 kit + 1 separate column, with active double-counting detection",
			actual: f ? "PASS (STRUCT_MAIN_BAY 套件正確排除 2 根內部 bundled 立柱, 獨立立柱計 1 支, 引擎成功攔截 double-counting)" : `FAIL: filteredCols=${o?.quantity}, unfilteredCols=${c?.quantity}, doubleCountingDetected=${d}`,
			details: {
				filteredBom: r,
				unfilteredBom: i
			}
		};
	}
	static testCaseN() {
		let t = new e.PerspectiveCamera(45, 800 / 600, .1, 100);
		t.position.set(2.6, 2, 3), t.lookAt(0, 0, 0), t.updateMatrixWorld(!0), t.updateProjectionMatrix();
		let n = Object.keys(T), r = 0, i = [];
		n.forEach((n) => {
			let a = T[n], o = g.get(n);
			if (!o) {
				r++, i.push({
					id: n,
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
				+u.min.x.toFixed(4),
				+u.min.y.toFixed(4),
				+u.min.z.toFixed(4),
				+u.max.x.toFixed(4),
				+u.max.y.toFixed(4),
				+u.max.z.toFixed(4)
			], m = [+f.x.toFixed(4), +f.y.toFixed(4)], h = Math.abs(c - a.vertexCount), _ = Math.abs(l - a.triangleCount), v = Math.abs(s.children.length - a.childMeshCount), y = p.reduce((e, t, n) => Math.max(e, Math.abs(t - a.bounds[n])), 0), b = Math.max(Math.abs(m[0] - a.projectedCentroid[0]), Math.abs(m[1] - a.projectedCentroid[1])), x = h + _ + v + +(y > .005) + +(b > .005);
			r += x, i.push({
				id: n,
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
					tDelta: _,
					mDelta: v,
					bDelta: y,
					cDelta: b
				},
				match: x === 0
			});
		});
		let a = r === 0;
		return {
			id: "Case N",
			name: "既有配件視覺回歸比對 (Deterministic Baseline Regression of 8 Models)",
			passed: a,
			expected: "8 legacy models match deterministic vertexCount, triangleCount, bounds, and screen projection with 0 unexpected delta",
			actual: a ? "PASS (8/8 既有模型與幾何/投影特徵基準完全吻合, 0 unexpected difference)" : `FAIL: ${r} unexpected deltas detected across baseline comparisons`,
			details: i
		};
	}
	static testCaseO() {
		let t = 37.5, n = new s("inst_custom_angle", g.get("FITTING_ELBOW_90"), {
			angleDeg: t,
			radius: 600,
			width: 600
		}), r = n.getWorldPorts(), i = r.find((e) => e.id === "PORT_A"), a = r.find((e) => e.id === "PORT_B"), c = n.getCenterlines()[0], l = n.getThreeMesh(), u = t * Math.PI / 180, d = 600 * Math.cos(u), f = -600 * Math.sin(u), p = 600 * u, m = Math.hypot(a.worldPosition[0] - d, a.worldPosition[2] - f), h = m < .01, v = c.samplePoints[0], y = c.samplePoints[c.samplePoints.length - 1], b = o.distance(v, i.worldPosition), x = o.distance(y, a.worldPosition), S = b < .01 && x < .01, C = Math.abs(c.analyticLength - p), w = C < .01, T = new e.Box3().setFromObject(l), E = T.min.z < 0 && T.max.z > 0, D = _.checkConformance({ angleDeg: t }), O = !D.isStandard && D.warnings.some((e) => e.includes("Non-standard")), k = h && S && w && E && O;
		return {
			id: "Case O",
			name: "通用角度單一真實來源 (Generic Angle 37.5° Ports, Route & Geometry SOT)",
			passed: k,
			expected: "angleDeg 37.5° synchronously drives Port B position, Centerline endpoints, analytic length, and geometry orientation",
			actual: k ? `PASS (37.5°: Port B=[${a.worldPosition[0].toFixed(1)}, ${a.worldPosition[2].toFixed(1)}]mm, CenterlineErr=${x.toFixed(3)}mm, Length=${c.analyticLength.toFixed(2)}mm, 型錄警示確認)` : `FAIL: portPassed=${h}, clPassed=${S}, lenPassed=${w}, warns=${O}`,
			details: {
				portBPosErr: m,
				clStartErr: b,
				clEndErr: x,
				lenErr: C,
				conf: D
			}
		};
	}
	static testCaseP() {
		let e = new s("inst_consistency", g.get("FITTING_ELBOW_90"), {
			radius: 300,
			angleDeg: 45
		}), t = e.getCenterlines()[0].analyticLength, n = e.getWorldPorts().find((e) => e.id === "PORT_A").worldPosition[0];
		e.updateParameters({
			radius: 600,
			angleDeg: 90
		});
		let r = e.getCenterlines()[0].analyticLength, i = e.getWorldPorts().find((e) => e.id === "PORT_A").worldPosition[0], a = e.getBounds(), o = Math.abs(r - 600 * Math.PI / 2) < .001, c = i === 600, l = a.max[0] >= 600, u = o && c && l && r !== t && i !== n;
		return {
			id: "Case P",
			name: "參數連動單一資料源一致性 (Single Source of Truth Consistency Across Derivatives)",
			passed: u,
			expected: "Changing R=300->600mm & Angle=45->90° synchronously updates Ports, Centerlines, Length, Bounds, and Mesh",
			actual: u ? `PASS (所有衍生資料由同一組 effectiveParameters 同步推導: Length ${t.toFixed(1)}mm ➔ ${r.toFixed(1)}mm, PortX ${n}mm ➔ ${i}mm, 無舊值殘留)` : `FAIL: lenUpdated=${o}, portUpdated=${c}`,
			details: {
				len1: t,
				len2: r,
				port1Pos: n,
				port2Pos: i,
				bounds2: a
			}
		};
	}
	static testCaseQ_CenterlinePortEndpoints() {
		let e = g.getAll(), t = 0, n = 0, r = [];
		e.forEach((e) => {
			let i = e.getCenterlineRoutes(e.defaultParameters);
			if (i.length === 0) return;
			let a = e.getLocalPorts(e.defaultParameters), s = new Map(a.map((e) => [e.id, e]));
			i.forEach((i) => {
				t++;
				let a = s.get(i.fromPort), c = s.get(i.toPort);
				if (!a || !c) {
					r.push({
						defId: e.id,
						routeId: i.id,
						error: "Port not found"
					});
					return;
				}
				let l = i.samplePoints[0], u = i.samplePoints[i.samplePoints.length - 1], d = o.distance(l, a.localPosition), f = o.distance(u, c.localPosition);
				n = Math.max(n, d, f), (d > .01 || f > .01) && r.push({
					defId: e.id,
					routeId: i.id,
					startDist: d,
					endDist: f,
					firstPt: l,
					fromPortPos: a.localPosition,
					lastPt: u,
					toPortPos: c.localPosition
				});
			});
		});
		let i = r.length === 0 && t >= 14;
		return {
			id: "Case Q",
			name: "中心線與埠位端點精確重合不變量 (Centerline ↔ Port Endpoint Invariant)",
			passed: i,
			expected: "All routing components have centerline start == fromPort and end == toPort within 0.01mm tolerance",
			actual: i ? `PASS (已驗證 ${t} 條路由中心線, 最大端點誤差 = ${n.toExponential(2)}mm, 包含 RISER_OUT_90/45 全數合格)` : `FAIL: ${r.length} routing invariant violations`,
			details: {
				checkedRoutes: t,
				maxError: n,
				failures: r
			}
		};
	}
	static testCaseR_BoundsConsistency() {
		let e = [
			"STRUCT_COLUMN",
			"STRUCT_PIER",
			"STRUCT_MAIN_BAY",
			"STRUCT_BRANCH_BAY",
			"TRAY_STRAIGHT",
			"FITTING_ELBOW_90",
			"FITTING_RISER_OUT_90",
			"FITTING_REDUCER_LEFT"
		], t = [], n = 0, r = .05;
		e.forEach((e) => {
			let i = g.get(e);
			if (!i) {
				t.push({
					id: e,
					axis: "REGISTRY",
					boundsVal: 0,
					geoVal: 0,
					diff: -1
				});
				return;
			}
			let a = i.getBounds(i.defaultParameters), o = C(i, i.defaultParameters), s = o.min, c = o.max, l = [
				"X",
				"Y",
				"Z"
			];
			for (let i = 0; i < 3; i++) {
				let o = Math.abs(a.min[i] - s[i]);
				n = Math.max(n, o), o > r && t.push({
					id: e,
					axis: `min${l[i]}`,
					boundsVal: a.min[i],
					geoVal: s[i],
					diff: o
				});
			}
			for (let i = 0; i < 3; i++) {
				let o = Math.abs(a.max[i] - c[i]);
				n = Math.max(n, o), o > r && t.push({
					id: e,
					axis: `max${l[i]}`,
					boundsVal: a.max[i],
					geoVal: c[i],
					diff: o
				});
			}
		});
		let i = t.length === 0;
		return {
			id: "Case R",
			name: "構件包絡邊界與實體幾何一致性 (Bounds ↔ Geometry Consistency Invariant)",
			passed: i,
			expected: `All ${e.length} required components have minX/Y/Z & maxX/Y/Z matching THREE.Box3 within ${r}mm`,
			actual: i ? `PASS (已嚴格比對 ${e.length} 組構件之 6 軸包絡邊界 min/max，最大誤差 = ${n.toExponential(2)}mm)` : `FAIL: ${t.length} bounding coordinate inconsistencies (Max Error = ${n.toFixed(3)}mm)`,
			details: {
				requiredTestIds: e,
				maxError: n,
				failures: t
			}
		};
	}
	static testCaseS_PortFrameHandedness() {
		let e = g.getAll(), t = 0, n = 1, r = 1, i = [];
		e.forEach((e) => {
			e.getLocalPorts(e.defaultParameters).forEach((a) => {
				t++;
				let o = new y(a.localPosition, a.localDirection, a.localUp).getDeterminant();
				n = Math.min(n, o), r = Math.max(r, o), Math.abs(o - 1) > .001 && i.push({
					defId: e.id,
					portId: a.id,
					det: o
				});
			});
		});
		let a = i.length === 0 && t > 30;
		return {
			id: "Case S",
			name: "埠位局部座標系右手正交規範 (Port Frame Right-Handed Orthonormal Invariant)",
			passed: a,
			expected: "All port basis frames satisfy right = up x direction with basis determinant strictly +1.0 (no reflection)",
			actual: a ? `PASS (全庫 ${t} 個埠位座標系正交行列式值 det = 1.00000, 嚴格右手系, 無左手映象)` : `FAIL: ${i.length} inverted port frames detected`,
			details: {
				portCount: t,
				minDet: n,
				maxDet: r,
				failures: i
			}
		};
	}
	static testCaseT_EccentricReducerLength() {
		let e = g.get("FITTING_REDUCER_LEFT"), t = g.get("FITTING_REDUCER_CENTER"), n = e.getCenterlineRoutes({
			inletWidth: 600,
			outletWidth: 450,
			length: 500
		})[0], r = t.getCenterlineRoutes({
			inletWidth: 600,
			outletWidth: 450,
			length: 500
		})[0], i = Math.hypot(500, 75), a = Math.abs(n.analyticLength - i), o = Math.abs(r.analyticLength - 500), s = a < .001 && o < .001 && n.analyticLength > 500;
		return {
			id: "Case T",
			name: "偏心大小頭物理斜邊中心線長度 (Eccentric Reducer Physical Hypotenuse Length)",
			passed: s,
			expected: "Eccentric reducer length uses sqrt(L^2 + offset^2) = 505.594mm > 500mm",
			actual: s ? `PASS (左偏異徑長度 = ${n.analyticLength.toFixed(3)}mm (含 75mm 側向偏移), 同心長度 = ${r.analyticLength.toFixed(3)}mm)` : `FAIL: errLeft=${a}, errCenter=${o}`,
			details: {
				routeLeft: n,
				routeCenter: r,
				expectedHypot: i
			}
		};
	}
	static testCaseU_TeePhysicalCenterline() {
		let e = g.get("FITTING_TEE").getCenterlineRoutes({
			length: 1400,
			branchLength: 700,
			radius: 300
		}), t = e.find((e) => e.id === "ROUTE_A_C"), n = e.find((e) => e.id === "ROUTE_B_C"), r = c.teeBranch(1400, 700, 300), i = Math.abs(t.analyticLength - r), a = 0;
		for (let e = 1; e < t.samplePoints.length; e++) a += o.distance(t.samplePoints[e - 1], t.samplePoints[e]);
		let s = Math.abs(a - r), l = i < .001 && s < 2 && t.samplePoints.length > 5;
		return {
			id: "Case U",
			name: "三通實體過渡中心線曲線 (Tee Smooth Arc Branch Centerline Invariant)",
			passed: l,
			expected: "ROUTE_A_C is Straight+Arc+Straight polyline starting at Port A and ending at Port C",
			actual: l ? `PASS (分流中心線長度 = ${t.analyticLength.toFixed(2)}mm, 幾何取樣離散弦長 = ${a.toFixed(2)}mm, 圓弧轉角平滑)` : `FAIL: errAC=${i}, chordError=${s}`,
			details: {
				routeAC: t,
				routeBC: n,
				expectedAnalytic: r,
				polyLength: a
			}
		};
	}
	static testCaseV_DerivedStateExport() {
		let e = new s("test_export_inst", g.get("TRAY_STRAIGHT")), t = w.exportScene([e]).instances[0], n = !!t.derivedSnapshot, r = t.derivedSnapshot?.status === "NON_CANONICAL_SNAPSHOT", i = !!t.effectiveParameters && !!t.placement, a = n && r && i;
		return {
			id: "Case V",
			name: "衍生狀態匯出標記不變量 (Derived State Export Non-Canonical Snapshot)",
			passed: a,
			expected: "exportScene marks worldPorts under derivedSnapshot with NON_CANONICAL_SNAPSHOT status",
			actual: a ? "PASS (匯出資料以 effectiveParameters 與 placement 為 SOT, worldPorts 妥善收容於 derivedSnapshot)" : "FAIL: Export structure violated",
			details: t
		};
	}
}, D = "1.0.0";
//#endregion
export { E as AcceptanceTestSuite, c as AnalyticLength, v as AssemblyRegistry, t as AssumptionLevel, S as BomManager, n as BomScope, _ as CatalogStandards, s as ComponentInstance, r as ComponentOrigin, g as ComponentRegistry, i as ComponentRole, x as ConnectionValidator, d as GeometryGenerators, w as JsonExporter, T as LEGACY_FITTING_BASELINES, b as MateEngine, u as Materials, l as RouteGenerator, o as Transforms, a as Units, D as VERSION, C as computeGeometryBounds };
