# Vendor Major Component Validation Matrix

**Vendor Engineering Catalog:** 鋁製電纜線槽 (Aluminum Cable Tray Catalog)  
**Standard References:** CNS 13303 C4466, NEMA VE 1-2017  
**Validation Date:** 2026-09-23  
**Evaluator:** MCR-Studio Senior Engineering Team  

---

## 1. Validation Status Key

* **`MATCH`**: Current library component parameters, ports, centerline, and geometry match the vendor catalog with no functional or geometric discrepancies.
* **`MATCH_WITH_MINOR_DIFFERENCE`**: Overall routing geometry matches; minor cosmetic or non-routing differences exist (e.g. flange profile, perforation pattern).
* **`NEEDS_CORRECTION`**: Engineering geometry discrepancy identified against the vendor catalog (e.g. missing tangent extension, incorrect dimension formula, or transition geometry).
* **`MISSING_MAJOR_COMPONENT`**: Major routing/fitting component documented in catalog but missing in library; directly affects routing topology, ports, cable length, and BOM.
* **`NOT_REQUIRED_FOR_3D`**: Small accessory or mounting hardware (splice plates, clamps, bolts, washers); to be derived via BOM rules, no detailed 3D model required.
* **`INSUFFICIENT_CATALOG_DATA`**: Catalog drawing or table lacks critical dimensions required for exact parametric derivation.

---

## 2. Major Component Validation Matrix

| Catalog Product | PDF Page | Current Library Component | Current Status | Shape | Parameters | Ports | Centerline | Bounds | Action |
| :--- | :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **直式線槽** (Straight Cable Tray - Ladder) | 4 | `TRAY_STRAIGHT` | `MATCH_WITH_MINOR_DIFFERENCE` | Match | Match | Match | Match | Match | Maintain backward compatibility; add `overallWidth = W + 26`, `coverWidth = W + 38` formula notes and Ventilated profile support. |
| **直式隔板線槽** (Straight Cable Tray with Divider) | 4, 25 | `TRAY_STRAIGHT_DIVIDER` | `MATCH_WITH_MINOR_DIFFERENCE` | Match | Match | Match | Match | Match | Verified against Page 25 Separater Plate. Integrated inside straight tray. |
| **水平 L 形 90° 彎頭** (Horizontal 90° Elbow) | 5, 31, 42 | `FITTING_ELBOW_90` | `NEEDS_CORRECTION` | Differs | Differs | Differs | Differs | Differs | Catalog features `125mm` straight tangent extensions at both ends and inner radius `R`. Add `tangentLength` support (125mm catalog standard), preserving zero-tangent mode for legacy prototype baseline. |
| **水平 L 形 60° 彎頭** (Horizontal 60° Elbow) | 6 | `FITTING_ELBOW_90` (angleDeg=60) | `MATCH_WITH_MINOR_DIFFERENCE` | Match | Match | Match | Match | Match | Fully supported by generic `angleDeg: 60` with optional `tangentLength: 125`. |
| **水平 L 形 45° 彎頭** (Horizontal 45° Elbow) | 7, 32 | `FITTING_ELBOW_45` | `NEEDS_CORRECTION` | Differs | Differs | Differs | Differs | Differs | Add `tangentLength: 125` parameter support and vendor catalog preset derivation. |
| **水平 L 形 30° 彎頭** (Horizontal 30° Elbow) | 8, 43 | `FITTING_ELBOW_90` (angleDeg=30) | `MATCH_WITH_MINOR_DIFFERENCE` | Match | Match | Match | Match | Match | Fully supported by generic `angleDeg: 30` with optional `tangentLength: 125`. |
| **水平 T 形彎頭** (Horizontal Tee Elbow) | 9, 33 | `FITTING_TEE` | `NEEDS_CORRECTION` | Differs | Differs | Differs | Differs | Differs | Catalog dimensions: Main length `L = W + 2*R + 250mm`, Branch length `BL = W/2 + R + 125mm` (or `W + R + 125mm` from back rail). Update formulas and support vendor presets. |
| **水平 X 形彎頭** (Horizontal Cross Elbow) | 10 | *None* | `MISSING_MAJOR_COMPONENT` | Missing | Missing | Missing | Missing | Missing | **Implement `FITTING_CROSS`**: 4 symmetrical ports (PORT_A, PORT_B, PORT_C, PORT_D), 6 route centerlines (A-B, C-D, A-C, A-D, B-C, B-D), parametric geometry, and bounds. |
| **垂直上升 90° 彎頭** (Vertical Inside 90° Elbow) | 11, 34, 44 | `FITTING_RISER_IN_90` | `NEEDS_CORRECTION` | Differs | Differs | Differs | Differs | Differs | Catalog features `125mm` straight tangent extensions at both ports. Concave bend (cables on inner arc R, outer rail R+H). Add tangent support. |
| **垂直上升 60° 彎頭** (Vertical Inside 60° Elbow) | 12 | `FITTING_RISER_IN_90` (angleDeg=60) | `MATCH_WITH_MINOR_DIFFERENCE` | Match | Match | Match | Match | Match | Fully supported via generic `angleDeg: 60`. |
| **垂直上升 45° 彎頭** (Vertical Inside 45° Elbow) | 13 | `FITTING_RISER_IN_45` | `NEEDS_CORRECTION` | Differs | Differs | Differs | Differs | Differs | Add tangent support (125mm extension). |
| **垂直上升 30° 彎頭** (Vertical Inside 30° Elbow) | 14 | `FITTING_RISER_IN_90` (angleDeg=30) | `MATCH_WITH_MINOR_DIFFERENCE` | Match | Match | Match | Match | Match | Fully supported via generic `angleDeg: 30`. |
| **垂直下降 90° 彎頭** (Vertical Outside 90° Elbow) | 15, 35, 45 | `FITTING_RISER_OUT_90` | `NEEDS_CORRECTION` | Differs | Differs | Differs | Differs | Differs | Catalog features `125mm` straight tangent extensions. Convex bend (cables on outer arc R+H, inner rail R). Add tangent support. |
| **垂直下降 60° 彎頭** (Vertical Outside 60° Elbow) | 16 | `FITTING_RISER_OUT_90` (angleDeg=60) | `MATCH_WITH_MINOR_DIFFERENCE` | Match | Match | Match | Match | Match | Fully supported via generic `angleDeg: 60`. |
| **垂直下降 45° 彎頭** (Vertical Outside 45° Elbow) | 17 | `FITTING_RISER_OUT_45` | `NEEDS_CORRECTION` | Differs | Differs | Differs | Differs | Differs | Add tangent support (125mm extension). |
| **垂直下降 30° 彎頭** (Vertical Outside 30° Elbow) | 18 | `FITTING_RISER_OUT_90` (angleDeg=30) | `MATCH_WITH_MINOR_DIFFERENCE` | Match | Match | Match | Match | Match | Fully supported via generic `angleDeg: 30`. |
| **中間異徑接頭** (Center Reducer Elbow) | 19 | `FITTING_REDUCER_CENTER` | `NEEDS_CORRECTION` | Differs | Differs | Differs | Differs | Differs | Catalog specifies fixed length 600mm: 200mm inlet tangent + 200mm taper transition + 200mm outlet tangent. Add 3-stage reducer transition support. |
| **左偏異徑接頭** (Left Reducer Elbow) | 20 | `FITTING_REDUCER_LEFT` | `NEEDS_CORRECTION` | Differs | Differs | Differs | Differs | Differs | Left side straight; right side has 200mm tangent + 200mm taper + 200mm tangent. Physical hypotenuse centerline length accounts for 3D path. |
| **右偏異徑接頭** (Right Reducer Elbow) | 21 | `FITTING_REDUCER_RIGHT` | `NEEDS_CORRECTION` | Differs | Differs | Differs | Differs | Differs | Right side straight; left side has 200mm tangent + 200mm taper + 200mm tangent. |
| **線槽連接片** (Straight Tray Connector) | 22, 36, 46 | `FITTING_SPLICE_PLATE` | `NOT_REQUIRED_FOR_3D` | N/A | N/A | N/A | N/A | N/A | Accessory hardware. Retain existing 3D model for compatibility; future BOM derived from joint count rule. |
| **配電盤連接片** (Panel Plate Connector) | 22 | *None* | `NOT_REQUIRED_FOR_3D` | N/A | N/A | N/A | N/A | N/A | Accessory hardware; future BOM rule. |
| **水平可調連接片** (Adjustable Horizontal Connector) | 22, 36 | *None* | `NOT_REQUIRED_FOR_3D` | N/A | N/A | N/A | N/A | N/A | Accessory hardware; future BOM rule. |
| **垂直可調連接片** (Adjustable Vertical Connector) | 23, 36 | *None* | `NOT_REQUIRED_FOR_3D` | N/A | N/A | N/A | N/A | N/A | Accessory hardware; future BOM rule. |
| **異徑連接片** (Reducer Plates) | 23 | *None* | `NOT_REQUIRED_FOR_3D` | N/A | N/A | N/A | N/A | N/A | Accessory hardware; future BOM rule. |
| **終端封板** (Blind End Cover) | 23, 46 | *None* | `NOT_REQUIRED_FOR_3D` | N/A | N/A | N/A | N/A | N/A | Accessory hardware; future BOM rule. |
| **蓋板固定夾** (Cover Clamp) | 24, 37, 47 | *None* | `NOT_REQUIRED_FOR_3D` | N/A | N/A | N/A | N/A | N/A | Accessory hardware; future BOM rule. |
| **外側固定片** (Outside Hold Down Clamp) | 24, 47 | *None* | `NOT_REQUIRED_FOR_3D` | N/A | N/A | N/A | N/A | N/A | Accessory hardware; future BOM rule. |
| **內側固定片** (Inside Hold Down Clamp) | 24 | *None* | `NOT_REQUIRED_FOR_3D` | N/A | N/A | N/A | N/A | N/A | Accessory hardware; future BOM rule. |
| **分隔板** (Separater Plate) | 25 | In `TRAY_STRAIGHT_DIVIDER` | `MATCH_WITH_MINOR_DIFFERENCE` | Match | Match | Match | Match | Match | Integrated into divided straight tray. |
| **接地銅片** (Copper Grounding Pieces) | 25 | *None* | `NOT_REQUIRED_FOR_3D` | N/A | N/A | N/A | N/A | N/A | Electrical grounding accessory; BOM rule. |
| **馬車螺絲** (Square Neck Bolt) | 25, 37, 47 | *None* | `NOT_REQUIRED_FOR_3D` | N/A | N/A | N/A | N/A | N/A | Fastener accessory; BOM rule. |
| **電纜槽外側夾鉤** (Hold Down Clamp) | 26 | *None* | `NOT_REQUIRED_FOR_3D` | N/A | N/A | N/A | N/A | N/A | Support fixing accessory; BOM rule. |

---

## 3. Engineering Dimension Formulas Summary

1. **Straight Tray:**
   * Nominal Width: $W$
   * Nominal Height: $H$
   * Standard Length: $L = 3000\,\text{mm}$
   * Ladder Overall Tray Width: $\text{overallWidth} = W + 26\,\text{mm}$ (flange lips)
   * Ladder Cover Width: $\text{coverWidth} = W + 38\,\text{mm}$ (for $W=1000$: $W + 48\,\text{mm}$)
   * Ventilated Through Cover Width: $\text{coverWidth} = W + 6\,\text{mm}$

2. **Horizontal Elbow (with Tangent Extension $T = 125\,\text{mm}$):**
   * Centerline Radius: $R_{\text{center}} = R + W / 2$ (when $R$ is inner radius)
   * Port A position: $[R_{\text{center}}, 0, T]$ with direction $[0, 0, 1]$
   * Port B position: $[(R_{\text{center}}) \cos\theta - T \sin\theta, 0, -(R_{\text{center}}) \sin\theta - T \cos\theta]$
   * Analytic Centerline Length: $L_{\text{cl}} = 2 \cdot T + R_{\text{center}} \cdot \theta_{\text{rad}}$

3. **Horizontal Tee (with Tangent Extension $T = 125\,\text{mm}$):**
   * Main Run Length: $L_{\text{main}} = W + 2 \cdot R + 2 \cdot T$
   * Branch Extension from Centerline: $L_{\text{branch}} = W / 2 + R + T$
   * Branch Route Length: $L_{\text{branch\_cl}} = (L_{\text{main}} / 2 - R) + \frac{\pi}{2} R + (L_{\text{branch}} - W / 2 - R)$

4. **Horizontal Cross (with Tangent Extension $T = 125\,\text{mm}$):**
   * Full Span (both X and Z axes): $S = W + 2 \cdot R + 2 \cdot T$
   * 4 Ports at distance $S / 2$ from center: PORT_A $(-X)$, PORT_B $(+X)$, PORT_C $(+Z)$, PORT_D $(-Z)$
   * Straight Route Length: $L_{\text{straight}} = S$
   * Branch 90° Turn Route Length: $L_{\text{turn}} = 2 \cdot T + \frac{\pi}{2} (R + W / 2)$

5. **Reducers (Catalog Standard Length $L = 600\,\text{mm}$, Tangent $T = 200\,\text{mm}$):**
   * Inlet Tangent: $200\,\text{mm}$
   * Transition Taper: $200\,\text{mm}$
   * Outlet Tangent: $200\,\text{mm}$
   * Lateral Offset: Center = $0$, Left = $\frac{W_2 - W_1}{2}$, Right = $\frac{W_1 - W_2}{2}$
   * Analytic Centerline Length: $L_{\text{cl}} = 200 + \sqrt{200^2 + \text{offset}^2} + 200$
