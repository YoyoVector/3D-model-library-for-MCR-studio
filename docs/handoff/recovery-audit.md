# Recovery Audit — Gemini Partial Work (Phase 0)

**Audit date:** 2026-09-24
**Auditor:** Claude (engineering recovery session)
**Vendor source:** `CABLE TRAY CATALOGS_Code 1.pdf` (47 PDF pages; page numbers below are **PDF page indices**, printed catalog page numbers in brackets where useful)

## 1. Repository state at hand-off

| Item | Value |
| :--- | :--- |
| Current HEAD (origin/main) | `498592b31474e10301bf70edf31e44205a9260dd` — *feat: implement ErrorBoundary and expand components* |
| Remote branches | `main` only |
| Uncommitted changes | **None.** Fresh clone of `origin/main` is clean; no stash. The local Gemini working folder (`Gemini with Antigravity for conversation`) is empty, so no uncommitted Gemini work exists on this machine to recover. |
| Baseline checks | `npm run lint` PASS, `npm run test` 28/28 PASS (see §4 for why PASS was misleading) |

## 2. What Gemini completed (KEEP)

- Core architecture `ComponentDefinition → ComponentInstance → effectiveParameters → Ports → Centerlines → Bounds → Geometry → Mate → BOM → Export` — sound, kept unchanged.
- Quaternion placement, `PortFrame` right-handed basis, `MateEngine` rigid alignment math — correct, kept.
- `TraySystemProfile` + `createComponentFromProfile()` concept, `VENTILATED_PROFILE_A/B`, `LADDER_PROFILE_STANDARD` — right direction, kept and corrected.
- `FITTING_CROSS`, `FITTING_ELBOW_60`, `FITTING_ELBOW_30` registrations — component IDs kept.
- Package build (ESM/CJS/d.ts), contract test, pack smoke test, CI workflow — kept.
- BOM zero double-counting, JSON export schema 2.0.0 — kept.

## 3. Partial / wrong / misleading items (CORRECT or COMPLETE)

| # | Area | Finding (verified against code and PDF) | Class |
| :-: | :--- | :--- | :--- |
| 1 | Tee (PDF p.9) | `buildHorizontalTee()` builds only straight `BoxGeometry` rails with a square junction. Catalog shows radius-R curved front rails. Centerline route used an arc centred at `(-r, r)` that does not match either the geometry or the catalog. | WRONG |
| 2 | Cross (PDF p.10) | `buildHorizontalCross()` is 8 straight rail boxes (square centre). Turning routes use an arc of radius `r` about `(±r, ±r)` — not the catalog corner. | WRONG |
| 3 | H = 150 | Ladder catalog H = 150 on every ladder page, but every tray/fitting default is `depth: 100`; `FITTING_CROSS` provenance claims *VERIFIED H=150* while `defaultParameters.depth = 100`. | WRONG |
| 4 | Radius semantics | Catalog R is the **inner** radius (p.5 dimension chain `W | R | 125`; cover `R−19`). Library used `radius` as **centerline** radius everywhere, with no derivation. Docs claimed "verified inner radius" but code never applied it. | WRONG |
| 5 | Tangents | Catalog elbows/risers/tee/cross all have 125 mm tangents. `tangentLength: 125` existed in some defaults and in the profile, but **no port, route, bound or geometry read it**. Docs listed the tangent as done. | DOCS-ONLY |
| 6 | Vertical risers | Port `localUp = [0,0,1]` is the *width* axis. Mating a riser to a straight tray lays the riser on its side (probe: vertical extent 640 mm = W+40 instead of R+H). Bottom/cover side also inverted vs catalog p.11. | WRONG |
| 7 | Mate overlap | Straight tray geometry extends **60 mm past PORT_B** (splice plates) and **17.5 mm past PORT_A** (end rung); reducers 17.5 mm past both ports. Straight→Straight mate therefore interpenetrates up to 77.5 mm. | WRONG |
| 8 | Reducer handedness | Vendor p.18 LEFT reducer keeps the **left** rail straight (viewed from W1 toward W2). Library `FITTING_REDUCER_LEFT` keeps the traveller's **right** rail straight (mirrored). Catalog 200+200+200 = 600 mm three-stage shape not implemented (linear full-length taper). | WRONG |
| 9 | False confidence | `FITTING_ELBOW_60/30` and `FITTING_CROSS` provenance tagged `VERIFIED_VENDOR_CATALOG` with wrong H, wrong page numbers ("Page 7, 42–43" for 60°), and unused tangents. | MISLEADING |
| 10 | Tests | Case AA compares constants with themselves (`600+26 === 626`) — never touches library code. Case Y checks port/route counts and `mesh.children > 0` only. Case W checks `tangentLength === 125` in params although nothing consumes it. None detect the square Tee/Cross, H=100, tangent absence, riser orientation or mate overlap. | MISLEADING TEST |
| 11 | Profiles | Ladder `source.pages` stops at 21 (ladder section is p.1–26). Ventilated `allowedAngles` mixes horizontal and vertical bends. Fitting material for ventilated A is 5052-H32 (p.31–35) while straight is 6063-T5 (p.30). | PARTIAL |
| 12 | System classification | `SYSTEM_VENTILATED_LARGE` lists 60°/45° elbows, Tee, Cross, reducers — PDF p.40 index lists only Straight, H90, H30, VI90, VO90. Small profile lists a reducer that is not in p.29. | WRONG |
| 13 | UI | Hard-coded "Case A ~ AB 全數 PASS" / "28項" banners regardless of the real result; runner prints "ALL 22 … PASSED". Mate panel dereferences `connectionCheck.reasons` (field does not exist) → crash on any mismatch (likely why an ErrorBoundary was added). `upDotProduct` never computed. Reducer preset uses non-existent params (`widthRight`). No clear active profile / validation status. | UI-ONLY / BUG |
| 14 | Themes | 5 themes (Studio Light, Dark, CAD, Warm, Cyber); no Presentation Steel. | PARTIAL |

## 4. Why the green test run was not evidence

All 28 cases passed on a Tee/Cross built from straight boxes, on H = 100 defaults, and on fittings with no tangents. The suite verified *existence* (ports, route count, mesh children) and *self-consistency of whatever geometry existed*, not agreement with the vendor drawing or physical assembly.

## 5. Outcome (2026-09-24)

All 14 findings in §3 were corrected; details in `docs/catalog-validation/vendor-major-component-validation.md`.
The acceptance suite grew from 28 to 37 cases. The defect classes the new cases target were measured on the
pre-recovery code (§3: straight-box Tee / Cross, 60 mm / 17.5 mm overhang, sideways riser). Case AD runs its curvature
probe on a square-junction control, and Case AJ recreates overhang, penetration, gap, rotated-part and size errors.
Both confirm the checks report these defects. (The new suite uses APIs that do not exist in the old code, so it was not
run against the old revision itself.)
Project decisions on the former open questions (R = 300, no covers, rail web approximation accepted, annotations ignored, vendor name masked) are in `docs/catalog-validation/catalog-open-questions.md` §3.

## 6. Planned correction (executed in this session)

1. **Single engineering formula layer** (`src/geometry/TrayLayouts.ts` + `SweepPath.ts`): every tray/fitting is described once (ports, centerline routes, analytic bounds, rail paths, rungs, floor) from `W, H, R(catalog inner), angle, tangent, style`. Ports, routes, bounds and meshes all read the same layout object.
2. **Vendor geometry**: curved Tee (p.9) and Cross (p.10); elbows with 125 mm tangents and `Rc = R + W/2`; vertical bends with `Rc = R + H/2` and correct bottom/cover side; three-stage reducers with vendor handedness.
3. **Connection-face semantics**: each tray port declares its physical face envelope; geometry must terminate exactly on the port plane; accessories (splice plates) are optional and excluded from body/bounds.
4. **Assembly validation**: joint separation (half-space) + face-envelope match + centerline continuity; negative controls prove the checks catch overlap and mis-orientation.
5. **Profiles**: corrected ladder/ventilated profiles with catalog-true W/H/R/angles/materials and per-family availability; generic mode clearly separated.
6. **Golden fixtures** from the PDF with hand-derived expected values.
7. **UI**: clear component / profile / effective parameters / validation / source hierarchy; Presentation Steel theme; dynamic test counts; mate crash fixed.

## 7. Second audit — re-verification of §1–§6 (2026-09-24, later session)

The hand-off prompt was issued again against HEAD `498592b`. The recovery above already existed on
`fix/vendor-geometry-recovery` (`0f20c38`, `962b246`, PR #1 open, CI green), so this session
audited that branch instead of starting from `main`.

| Item | Value |
| :--- | :--- |
| `origin/main` | `498592b31474e10301bf70edf31e44205a9260dd` (unchanged) |
| Branch audited | `fix/vendor-geometry-recovery` @ `962b246041e0f9808922d290636af8852ccdfeb7` |
| Uncommitted changes at start | None (fresh clone) |

**Method.** The PDF pages are scanned images with no text layer. The embedded page images were
decoded and read directly. They were compared with `TrayLayouts.ts`, the profiles and the golden
fixtures. The viewer was rendered in headless Chrome at 1600 × 1000 for every family and the
four assembly demos.

**Confirmed against the drawings (kept as is):**
- Tee p.9 / p.33: chain `125 │ R │ W │ R │ 125` main, `125 │ R │ W` branch; curved front rails.
  Library: span W + 2R + 250, branch W + R + 125 from the back rail.
- Cross p.10: the same chain on both axes; four curved corners.
- Straight p.4: first rung 125 from the end, 250 pitch, rung 50 × 25, rail 150H / 30 flange / 4.0t.
  Ventilated A p.30 (100 × 50, lip 10, 6063-T5) and B p.41 (300 × 100, lip 15, 5052-H32).
- Horizontal 90° p.5: `125 │ R │ W`, cover `R − 19`. The inner-rail R semantics are correct.
- Vertical inside p.11 (cover `R − 2`, R on the cover side) and outside p.15 (cover `H + R − 10`,
  R at the tray bottom).
- Left reducer p.20: 200 + taper + 200 = 600L. Viewed from W1 toward W2, the left rail stays straight.
- Series contents p.29 (A: straight, H90, H45, tee, VI90, VO90) and p.40 (B: straight, H90, H30,
  VI90, VO90). Printed page offsets 2 / 28 / 39.
- Rendered geometry: the Tee and Cross show the curved transitions. The assembly demos render
  without visible gaps or overlaps. All 37 acceptance cases pass.

**Corrected in this session:**

| # | Finding | Class |
| :-: | :--- | :--- |
| 1 | Profiles carried a misspelled vendor name, and open question 1 claimed the PDF prints no vendor name (it does, on every page). Per project rule the vendor is now masked as `SECXXX`. | WRONG → corrected |
| 2 | Viewer framing ignored the info card: small parts (reducer, vertical bends) were drawn under the card or larger than the viewport. | UI BUG → corrected |
| 3 | `package-lock.json` lacked the other platforms' optional native bindings. `npm ci` (npm 11 / Node 24) refused it, and the Windows dev server could not start (missing rolldown binding). CI passed only because it runs npm 10. | BUILD → corrected (no version changes) |

**Not changed.** None of the 37 tests had to change. No engineering formula was found that
contradicts the drawings.
