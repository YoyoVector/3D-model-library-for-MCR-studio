# Vendor Major Component Validation Matrix

**Vendor catalog:** `CABLE TRAY CATALOGS_Code 1.pdf` — 鋁製梯型電纜線槽 (PDF p.1–26), 鋁製密閉沖底型電纜線槽 100W×50H (PDF p.27–37) and 300W×100H (PDF p.38–47)
**Standards cited by the catalog:** CNS 13303 C4466, NEMA VE 1-2017
**Audit date:** 2026-09-24 (replaces the 2026-09-23 matrix, which listed corrections that were never implemented)
**Page numbers:** PDF page index; printed catalog page in brackets.

Everything below was re-read from the drawings and checked by executable tests: golden fixtures (Case AC, `src/tests/fixtures/vendorCatalogFixtures.ts`), mesh curvature probes (Case AD / AE), radius semantics on vertices (Case AG), port-plane termination (Case AH) and physical assembly checks (Case AI–AK).

## 1. Status key

| Status | Meaning |
| :--- | :--- |
| `VERIFIED` | Library already matched the drawing; confirmed by tests. |
| `CORRECTED` | Library was wrong or incomplete; corrected in this session and now matches the drawing (tests). |
| `NEEDS_CORRECTION` | Known mismatch still open. |
| `BLOCKED_BY_CATALOG` | Drawing does not dimension it; modelled as a documented approximation. |
| `GENERIC_ONLY` | Library capability outside the vendor catalog (kept, marked generic). |
| `OUT_OF_SCOPE` | Small accessory: no routing geometry; BOM rule later. |

## 2. Major routing components

| Catalog product | PDF p. (printed) | Library component | Status | Evidence / correction |
| :--- | :---: | :--- | :--- | :--- |
| 直式線槽 Straight, ladder | 4 (2) | `TRAY_STRAIGHT` | `CORRECTED` | H 150 via ladder profile; I-profile rails, overall **W + 26**; rungs 50×25 at **125 + 250·k**; splice plates were 60 mm past PORT_B → now optional accessory; end rung was 17.5 mm past PORT_A → inside. |
| 直式線槽 + 分隔板 | 4, 25 | `TRAY_STRAIGHT_DIVIDER` | `CORRECTED` (plate position `BLOCKED_BY_CATALOG`) | Same body as straight; separator plate position not dimensioned. |
| 水平 L 形 90° | 5 (3) | `FITTING_ELBOW_90` | `CORRECTED` | R = inner rail radius (chain `W │ R │ 125`, cover `R−19`); 125 mm tangents now real ports/geometry; centerline R + W/2. |
| 水平 L 形 60° | 6 (4) | `FITTING_ELBOW_60` | `CORRECTED` | Was tagged VERIFIED with H 100, no tangents and wrong page ("7, 42–43"). |
| 水平 L 形 45° | 7 (5) | `FITTING_ELBOW_45` | `CORRECTED` | As 90°. |
| 水平 L 形 30° | 8 (6) | `FITTING_ELBOW_30` | `CORRECTED` | Was tagged VERIFIED (same issues as 60°). |
| 水平 T 形彎頭 Tee | 9 (7) | `FITTING_TEE` | `CORRECTED` | Was straight boxes with a square junction. Now radius-R curved front rails; main span **W + 2R + 250**, back rail → branch end **W + R + 125**; routes A→C / B→C concentric with the curved rail (R + W/2). Junction rung layout `BLOCKED_BY_CATALOG` (visual approximation). |
| 水平 X 形彎頭 Cross | 10 (8) | `FITTING_CROSS` | `CORRECTED` | Was 8 straight boxes. Now four radius-R corners, span **W + 2R + 250** both axes, 6 routes (A↔B, D↔C, A↔C, A↔D, B↔C, B↔D) along real arcs. Provenance claimed H 150 while default was 100 → generic defaults are now labelled generic. |
| 垂直上升 90°/60°/45°/30° | 11–14 (9–12) | `FITTING_RISER_IN_90/60/45/30` | `CORRECTED` | Port up vector was the width axis (riser mated sideways). R is on the **rail-top / cover side** (cover `R−2`), tray bottom at R + H; centerline R + H/2; 125 tangents. 60°/30° IDs added. |
| 垂直下降 90°/60°/45°/30° | 15–18 (13–16) | `FITTING_RISER_OUT_90/60/45/30` | `CORRECTED` | R at the **tray bottom** (chain `125 │ R │ H`), cover side R + H. |
| 中間異徑接頭 | 19 (17) | `FITTING_REDUCER_CENTER` | `CORRECTED` | Catalog 200 straight + 200 taper + 200 straight = 600 (was full-length linear taper). |
| 左偏異徑接頭 | 20 (18) | `FITTING_REDUCER_LEFT` | `CORRECTED` | Handedness was mirrored: LEFT now keeps the **left** rail straight viewed from W1 toward W2 (outlet centre +(W1−W2)/2 on the traveller's left). |
| 右偏異徑接頭 | 21 (19) | `FITTING_REDUCER_RIGHT` | `CORRECTED` | Mirror of LEFT. |
| Ventilated 100W×50H: straight, H90, H45, tee, VI90, VO90 | 30–35 (2–7) | same IDs, `VENTILATED_PROFILE_A` | `CORRECTED` | Channel section (W outer, 2.0t, 10 mm lips, floor plate). Straight 6063-T5, fittings 5052-H32. Floor slot pattern `BLOCKED_BY_CATALOG` (solid plate). No cross / reducers in this series. |
| Ventilated 300W×100H: straight, H90, H30, VI90, VO90 | 41–45 (2–6) | same IDs, `VENTILATED_PROFILE_B` | `CORRECTED` | Channel section, 15 mm lips, 5052-H32. No tee / cross / reducers in this series (profile no longer lists them). |

## 3. Connection semantics (all tray components)

Every TRAY_END port carries a `connectionFace` (style, half width, up range). Body geometry ends exactly on every port plane (Case AH, 200+ ports). Mated pairs are checked on the meshes for separation, gap, face match and centerline continuity (Case AI–AK). Negative controls prove the checks catch a 60 mm overhang, a 30 mm penetration, a 20 mm gap, a 90° rotated part and a width mismatch (Case AJ).

## 4. Accessories (not routing geometry)

| Catalog product | PDF p. | Status |
| :--- | :---: | :--- |
| 線槽連接片 / 配電盤連接片 / 水平可調連接片 | 22, 36, 46 | `OUT_OF_SCOPE` |
| 垂直可調連接片 / 異徑連接片 / 終端封板 | 23, 36, 46 | `OUT_OF_SCOPE` |
| 蓋板固定夾 / 外側固定片 / 內側固定片 | 24, 37, 47 | `OUT_OF_SCOPE` |
| 分隔板 / 接地銅片 / 馬車螺絲 | 25, 37, 47 | `OUT_OF_SCOPE` (separator used by `TRAY_STRAIGHT_DIVIDER`) |
| 電纜槽外側夾鉤 | 26 | `OUT_OF_SCOPE` |
| Legacy `FITTING_SPLICE_PLATE` component | — | `GENERIC_ONLY` (kept for compatibility) |

Straight-tray splice plates can still be shown with `hasSplicePlates: true`; they are tagged `userData.isAccessory` and excluded from bounds and connection checks.

## 5. Engineering formulas (single source: `src/geometry/TrayLayouts.ts`)

| Item | Formula | Catalog basis |
| :--- | :--- | :--- |
| Ladder overall width | W + 26 | p.4 section `W+26` |
| Ladder cover width | W + 38 (W = 1000: W + 48) | p.4 note |
| Ventilated cover width | W + 6 | p.30, p.41 |
| Horizontal bend | R inner rail; centerline R + W/2; outer rail R + W; tangent 125 | p.5–8 |
| Vertical inside bend | R on rail-top side; bottom R + H; centerline R + H/2; tangent 125 | p.11–14 |
| Vertical outside bend | R on tray bottom; cover side R + H; centerline R + H/2; tangent 125 | p.15–18 |
| Tee | main span W + 2R + 250; branch from main centerline W/2 + R + 125; turning route 250 + (π/2)(R + W/2) | p.9 |
| Cross | span W + 2R + 250 on both axes; turning route 250 + (π/2)(R + W/2) | p.10 |
| Reducer | 200 + taper 200 + 200 = 600; route 400 + √(200² + offset²); offset 0 / ±(W1 − W2)/2 | p.19–21 |
| Rungs (ladder) | 50 × 25, pitch 250, first at 125 from the end | p.4 |
