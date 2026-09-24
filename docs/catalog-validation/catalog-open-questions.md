# Vendor Catalog — Resolved Interpretations & Open Questions

**Document:** `CABLE TRAY CATALOGS_Code 1.pdf` (鋁製電纜線槽)
**Updated:** 2026-09-24 (supersedes the 2026-09-23 version)
**Page numbers:** PDF page index (printed catalog page in brackets).

## 1. Resolved from the drawings (implemented and tested)

| Topic | Pages | Resolution | Previous doc / code |
| :--- | :---: | :--- | :--- |
| Horizontal bend R | 5–8, 31–32, 42–43 | R is the **inner side-rail** radius: bottom chain `W │ R │ 125`, cover inner edge `R−19` (= flange edge R−13 minus 6 mm overhang). Centerline R + W/2. | Doc said inner radius, code used centerline radius. |
| Vertical inside bend R | 11–14, 34, 44 | R is on the **rail-top / cover side** (cover `R−2`, chain `125 │ R │ H`); the tray bottom (rungs) is on the outer radius R + H. | Doc claimed R is on the "concave bottom where cables sit" — wrong side. |
| Vertical outside bend R | 15–18, 35, 45 | R is at the **tray bottom** (chain `125 │ R │ H`, left chain `H │ R │ 125`); cover side R + H (cover `H+R−10`). | Code had the riser section rotated 90° (up = width axis). |
| One derivation | all bends | catalogRadius → centerlineRadius (R + W/2 or R + H/2) → outer radius (R + W or R + H) in `TrayLayouts.ts`; ports, routes, bounds, geometry and BOM read it. `radiusReference: 'CENTERLINE'` is a migration aid for legacy callers. | Each module interpreted `radius` on its own. |
| Tangents | 5–18, 31–35, 42–45 | 125 mm straight at every bend / tee / cross end; ports sit at the physical end of the tangent. | Parameter existed but was ignored. |
| Tee / Cross shape | 9, 10, 33 | Radius-R curved corner rails; spans from the dimension chains. | Straight boxes, square junction. |
| Reducer shape & hand | 19–21 | 200 + 200 + 200; LEFT keeps the left rail straight viewed from W1 toward W2 (NEMA convention; plan drawing p.20). | Linear taper; LEFT/RIGHT mirrored. |
| Ventilated series content | 29, 40 (index) | A (100×50): straight, H90, H45, tee, VI90, VO90. B (300×100): straight, H90, H30, VI90, VO90. | Classification claimed tee / cross / reducers / 60° for B. |
| Materials | 4, 30, 31, 41 | Ladder rails 6063-T5 4.0t; ventilated A straight 6063-T5 2.0t, fittings 5052-H32 2.0t; ventilated B 5052-H32 2.0t; covers 5052 2.0t; finish polyester powder coat #67 ≥ 50 µm. | BOM spec printed "HDG 85 µm" (galvanised) — wrong for aluminium. |
| Small accessories | 22–26, 36–37, 46–47 | Not routing geometry; BOM rules later. Straight-tray splice plates are optional, tagged accessory, excluded from bounds / mate. | Splice plates always on and 60 mm past the port. |

## 2. Documented approximations (drawing does not dimension them)

| Item | Pages | Approximation | Impact |
| :--- | :---: | :--- | :--- |
| Web position inside the 30 mm ladder flange | 4 | Symmetric I: flange −17…+13 mm about the W line, web −4…0 mm (only W + 26 overall is dimensioned). | Rung length ± 8 mm; no routing / port impact. |
| Rung layout inside tee / cross junction | 9, 10 | Rungs spanning to the curved rail at ≤ 250 mm pitch. | Visual only. |
| Ventilated floor slots (10×30) | 30, 41 | Solid floor plate. | Visual only. |
| Separator plate position | 25 | Centred, standing on rungs / floor. | Visual only. |

## 3. Project decisions (2026-09-24)

1. **Vendor name** — not written out anywhere in the library or docs; profiles use the masked name `SECXXX`.
2. **Project default radius** — **R = 300** is the project standard (profile default). 600 / 900 stay selectable as catalog sizes.
3. **Covers (蓋板)** — **not modelled.** Covers stay out of geometry, bounds and the clearance envelope; they can be handled as BOM items later.
4. **Ladder rail web position** — the §2 approximation is **accepted** (no routing / port impact).
5. **Handwritten annotations** in the PDF — **ignored**; not used by the library.

No open questions remain for the vendor.
