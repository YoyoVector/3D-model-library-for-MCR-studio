/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Golden fixtures read directly from the vendor catalog PDF (`CABLE TRAY CATALOGS_Code 1.pdf`).
 *
 * Every expected value below is written from the catalog DIMENSION CHAINS and TABLES — never
 * copied from library output — so the suite catches any drift between the library and the drawing.
 * Page numbers are PDF page indices (printed catalog page in brackets).
 *
 * Coordinate conventions of the library (documented in geometry/TrayLayouts.ts):
 * - Ladder overall width = W + 26 (p.4 section "W+26") → body half width W/2 + 13.
 * - Ventilated: W is the outer width (p.30 / p.41) → body half width W/2.
 * - Horizontal bends: arc centre at origin, inlet PORT_A at (R + W/2, 0, T) heading into −Z.
 * - Tee / cross: origin at the crossing of the run centerlines, back rail at z = −W/2 (tee).
 * - Vertical bends: arc centre at origin, inlet PORT_A at (−T, ∓(R + H/2), 0).
 * - Reducers: PORT_A (wide) at z = −L/2, travel +Z; LEFT = +X (left when viewed toward the narrow end).
 */

type V3 = [number, number, number];

export interface GoldenPort {
  id: string;
  position: V3;
  direction: V3;
  up?: V3;
  width?: number;
}

export interface GoldenFixture {
  id: string;
  description: string;
  sourcePage: number;
  printedPage: string;
  profileId: 'LADDER_PROFILE_STANDARD' | 'VENTILATED_PROFILE_A' | 'VENTILATED_PROFILE_B';
  definitionId: string;
  /** Catalog parameters (W, H, R, angle, tangent, …) — overrides applied on top of the profile. */
  params: Record<string, number | string>;
  /** Catalog dimension chain as printed, for the reader. */
  catalogChain: string;
  expectedPorts: GoldenPort[];
  /** Route lengths by route id (mm). */
  expectedRouteLengths: Record<string, number>;
  /** Body bounds (mm), when the drawing fixes them unambiguously. */
  expectedBounds?: { min: V3; max: V3 };
  /** Resolved engineering dimensions that must match (subset of getEngineeringDimensions). */
  expectedDims?: Record<string, number>;
}

const S = Math.SQRT1_2; // sin 45° = cos 45°
const C30 = Math.sqrt(3) / 2;
const HALF_PI = Math.PI / 2;

export const VENDOR_GOLDEN_FIXTURES: GoldenFixture[] = [
  // ------------------------------------------------------------------ LADDER (H = 150)
  {
    id: 'LADDER_STRAIGHT_600',
    description: 'Straight ladder tray 600W × 150H × 3000L',
    sourcePage: 4,
    printedPage: '2',
    profileId: 'LADDER_PROFILE_STANDARD',
    definitionId: 'TRAY_STRAIGHT',
    params: { width: 600 },
    catalogChain: 'W (100–1000) | H 150 | L 3000; W+26 overall; rungs 125 + 11 × 250 + 125',
    expectedPorts: [
      { id: 'PORT_A', position: [0, 0, -1500], direction: [0, 0, -1], up: [0, 1, 0], width: 600 },
      { id: 'PORT_B', position: [0, 0, 1500], direction: [0, 0, 1], up: [0, 1, 0], width: 600 },
    ],
    expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 3000 },
    expectedBounds: { min: [-313, -75, -1500], max: [313, 75, 1500] },
    expectedDims: { overallWidth: 626, height: 150 },
  },
  {
    id: 'LADDER_STRAIGHT_300',
    description: 'Straight ladder tray 300W × 150H (project size, highlighted p.4)',
    sourcePage: 4,
    printedPage: '2',
    profileId: 'LADDER_PROFILE_STANDARD',
    definitionId: 'TRAY_STRAIGHT',
    params: { width: 300 },
    catalogChain: 'W 300 | H 150 | L 3000; W+26 = 326 overall',
    expectedPorts: [
      { id: 'PORT_A', position: [0, 0, -1500], direction: [0, 0, -1], width: 300 },
      { id: 'PORT_B', position: [0, 0, 1500], direction: [0, 0, 1], width: 300 },
    ],
    expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 3000 },
    expectedBounds: { min: [-163, -75, -1500], max: [163, 75, 1500] },
    expectedDims: { overallWidth: 326 },
  },
  {
    id: 'LADDER_H90_300_R300',
    description: 'Horizontal 90° elbow 300W, R 300 (project highlight p.5)',
    sourcePage: 5,
    printedPage: '3',
    profileId: 'LADDER_PROFILE_STANDARD',
    definitionId: 'FITTING_ELBOW_90',
    params: { width: 300, radius: 300 },
    catalogChain: 'bottom: W | R | 125 ; right: W | R | 125 (R to the inner rail, 125 tangents)',
    // Rc = R + W/2 = 450. Inlet (450, 0, 125); outlet (−125, 0, −450).
    expectedPorts: [
      { id: 'PORT_A', position: [450, 0, 125], direction: [0, 0, 1], up: [0, 1, 0] },
      { id: 'PORT_B', position: [-125, 0, -450], direction: [-1, 0, 0], up: [0, 1, 0] },
    ],
    expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 250 + 450 * HALF_PI },
    // Outer rail line R + W = 600, flange +13 → 613; tangents reach x = −125 and z = +125.
    expectedBounds: { min: [-125, -75, -613], max: [613, 75, 125] },
    expectedDims: { catalogRadius: 300, centerlineRadius: 450, innerRailRadius: 300, outerRailRadius: 600, tangentLength: 125 },
  },
  {
    id: 'LADDER_H60_600_R300',
    description: 'Horizontal 60° elbow 600W, R 300',
    sourcePage: 6,
    printedPage: '4',
    profileId: 'LADDER_PROFILE_STANDARD',
    definitionId: 'FITTING_ELBOW_60',
    params: { width: 600, radius: 300 },
    catalogChain: 'bottom: W | R ; 125 tangents at both ends; 60°',
    // Rc = 600. Outlet = (Rc cos60 − 125 sin60, 0, −Rc sin60 − 125 cos60).
    expectedPorts: [
      { id: 'PORT_A', position: [600, 0, 125], direction: [0, 0, 1] },
      { id: 'PORT_B', position: [600 * 0.5 - 125 * C30, 0, -600 * C30 - 125 * 0.5], direction: [-C30, 0, -0.5] },
    ],
    expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 250 + (600 * Math.PI) / 3 },
    expectedDims: { centerlineRadius: 600, angleDeg: 60 },
  },
  {
    id: 'LADDER_H45_600_R300',
    description: 'Horizontal 45° elbow 600W, R 300 (project highlight p.7)',
    sourcePage: 7,
    printedPage: '5',
    profileId: 'LADDER_PROFILE_STANDARD',
    definitionId: 'FITTING_ELBOW_45',
    params: { width: 600, radius: 300 },
    catalogChain: 'bottom: W | R ; 125 tangents at both ends; 45°',
    expectedPorts: [
      { id: 'PORT_A', position: [600, 0, 125], direction: [0, 0, 1] },
      { id: 'PORT_B', position: [(600 - 125) * S, 0, -(600 + 125) * S], direction: [-S, 0, -S] },
    ],
    expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 250 + (600 * Math.PI) / 4 },
    // Outlet face corners: PORT_B ± 313·right, right = (−S, 0, S).
    expectedBounds: {
      min: [(600 - 125) * S - 313 * S, -75, -(600 + 125) * S - 313 * S],
      max: [913, 75, 125],
    },
  },
  {
    id: 'LADDER_H30_600_R300',
    description: 'Horizontal 30° elbow 600W, R 300 (project highlight p.8)',
    sourcePage: 8,
    printedPage: '6',
    profileId: 'LADDER_PROFILE_STANDARD',
    definitionId: 'FITTING_ELBOW_30',
    params: { width: 600, radius: 300 },
    catalogChain: 'bottom: W | R ; 125 tangents at both ends; 30°',
    expectedPorts: [
      { id: 'PORT_A', position: [600, 0, 125], direction: [0, 0, 1] },
      { id: 'PORT_B', position: [600 * C30 - 125 * 0.5, 0, -600 * 0.5 - 125 * C30], direction: [-0.5, 0, -C30] },
    ],
    expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 250 + (600 * Math.PI) / 6 },
  },
  {
    id: 'LADDER_TEE_600_R300',
    description: 'Horizontal tee 600W, R 300 — Page 9 golden fixture',
    sourcePage: 9,
    printedPage: '7',
    profileId: 'LADDER_PROFILE_STANDARD',
    definitionId: 'FITTING_TEE',
    params: { width: 600, radius: 300 },
    catalogChain: 'bottom: 125 | R | W | R | 125 (main span 1450) ; right: W | R | 125 (back rail → branch end 1025)',
    expectedPorts: [
      { id: 'PORT_A', position: [-725, 0, 0], direction: [-1, 0, 0], up: [0, 1, 0] },
      { id: 'PORT_B', position: [725, 0, 0], direction: [1, 0, 0], up: [0, 1, 0] },
      { id: 'PORT_C', position: [0, 0, 725], direction: [0, 0, 1], up: [0, 1, 0] },
    ],
    expectedRouteLengths: {
      ROUTE_A_B: 1450,
      ROUTE_A_C: 250 + 600 * HALF_PI,
      ROUTE_B_C: 250 + 600 * HALF_PI,
    },
    // Back rail at z = −300 with 13 flange → −313; branch end z = 725; main ends x = ±725.
    expectedBounds: { min: [-725, -75, -313], max: [725, 75, 725] },
    expectedDims: { mainSpan: 1450, branchProjection: 725, branchFromBackRail: 1025, catalogRadius: 300, centerlineRadius: 600 },
  },
  {
    id: 'LADDER_TEE_600_R600',
    description: 'Horizontal tee 600W, R 600 — radius must drive the spans',
    sourcePage: 9,
    printedPage: '7',
    profileId: 'LADDER_PROFILE_STANDARD',
    definitionId: 'FITTING_TEE',
    params: { width: 600, radius: 600 },
    catalogChain: '125 | 600 | 600 | 600 | 125 = 2050 ; 600 | 600 | 125',
    expectedPorts: [
      { id: 'PORT_A', position: [-1025, 0, 0], direction: [-1, 0, 0] },
      { id: 'PORT_B', position: [1025, 0, 0], direction: [1, 0, 0] },
      { id: 'PORT_C', position: [0, 0, 1025], direction: [0, 0, 1] },
    ],
    expectedRouteLengths: { ROUTE_A_B: 2050, ROUTE_A_C: 250 + 900 * HALF_PI },
    expectedBounds: { min: [-1025, -75, -313], max: [1025, 75, 1025] },
  },
  {
    id: 'LADDER_CROSS_600_R300',
    description: 'Horizontal cross 600W, R 300 — Page 10 golden fixture',
    sourcePage: 10,
    printedPage: '8',
    profileId: 'LADDER_PROFILE_STANDARD',
    definitionId: 'FITTING_CROSS',
    params: { width: 600, radius: 300 },
    catalogChain: '125 | R | W | R | 125 on both axes (span 1450), four radius-R corners',
    expectedPorts: [
      { id: 'PORT_A', position: [-725, 0, 0], direction: [-1, 0, 0] },
      { id: 'PORT_B', position: [725, 0, 0], direction: [1, 0, 0] },
      { id: 'PORT_C', position: [0, 0, 725], direction: [0, 0, 1] },
      { id: 'PORT_D', position: [0, 0, -725], direction: [0, 0, -1] },
    ],
    expectedRouteLengths: {
      ROUTE_PORT_A_PORT_B: 1450,
      ROUTE_PORT_D_PORT_C: 1450,
      ROUTE_PORT_A_PORT_C: 250 + 600 * HALF_PI,
      ROUTE_PORT_A_PORT_D: 250 + 600 * HALF_PI,
      ROUTE_PORT_B_PORT_C: 250 + 600 * HALF_PI,
      ROUTE_PORT_B_PORT_D: 250 + 600 * HALF_PI,
    },
    expectedBounds: { min: [-725, -75, -725], max: [725, 75, 725] },
    expectedDims: { span: 1450 },
  },
  {
    id: 'LADDER_VI90_300_R300',
    description: 'Vertical inside (rising) 90° 300W, R 300 (project highlight p.11)',
    sourcePage: 11,
    printedPage: '9',
    profileId: 'LADDER_PROFILE_STANDARD',
    definitionId: 'FITTING_RISER_IN_90',
    params: { width: 300, radius: 300 },
    catalogChain: 'top: 125 | R | H ; left: 125 | R | H ; cover R−2 (R on the rail-top side)',
    // Rc = R + H/2 = 375. Inlet (−125, −375, 0) horizontal; outlet (375, 125, 0) vertical.
    expectedPorts: [
      { id: 'PORT_A', position: [-125, -375, 0], direction: [-1, 0, 0], up: [0, 1, 0] },
      { id: 'PORT_B', position: [375, 125, 0], direction: [0, 1, 0], up: [-1, 0, 0] },
    ],
    expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 250 + 375 * HALF_PI },
    // x: −125 … R+H = 450 ; y: −(R+H) = −450 … 125 ; z: ±(150 + 13).
    expectedBounds: { min: [-125, -450, -163], max: [450, 125, 163] },
    expectedDims: { catalogRadius: 300, centerlineRadius: 375, bottomRadius: 450, coverSideRadius: 300 },
  },
  {
    id: 'LADDER_VO90_600_R300',
    description: 'Vertical outside (falling) 90° 600W, R 300 (project highlight p.15)',
    sourcePage: 15,
    printedPage: '13',
    profileId: 'LADDER_PROFILE_STANDARD',
    definitionId: 'FITTING_RISER_OUT_90',
    params: { width: 600, radius: 300 },
    catalogChain: 'bottom: 125 | R | H ; left: H | R | 125 ; cover H+R−10 (R at the tray bottom)',
    expectedPorts: [
      { id: 'PORT_A', position: [-125, 375, 0], direction: [-1, 0, 0], up: [0, 1, 0] },
      { id: 'PORT_B', position: [375, -125, 0], direction: [0, -1, 0], up: [1, 0, 0] },
    ],
    expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 250 + 375 * HALF_PI },
    expectedBounds: { min: [-125, -125, -313], max: [450, 450, 313] },
    expectedDims: { bottomRadius: 300, coverSideRadius: 450 },
  },
  {
    id: 'LADDER_REDUCER_CENTER_600_300',
    description: 'Center reducer 600 → 300 (p.19 table)',
    sourcePage: 19,
    printedPage: '17',
    profileId: 'LADDER_PROFILE_STANDARD',
    definitionId: 'FITTING_REDUCER_CENTER',
    params: { inletWidth: 600, outletWidth: 300 },
    catalogChain: '200 straight | taper | 200 straight = 600L ; W1 bottom, W2 top',
    expectedPorts: [
      { id: 'PORT_A', position: [0, 0, -300], direction: [0, 0, -1], width: 600 },
      { id: 'PORT_B', position: [0, 0, 300], direction: [0, 0, 1], width: 300 },
    ],
    expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 600 },
    expectedBounds: { min: [-313, -75, -300], max: [313, 75, 300] },
    expectedDims: { length: 600, tangentLength: 200, transitionLength: 200, lateralOffset: 0 },
  },
  {
    id: 'LADDER_REDUCER_LEFT_600_300',
    description: 'Left reducer 600 → 300: left rail straight (p.20)',
    sourcePage: 20,
    printedPage: '18',
    profileId: 'LADDER_PROFILE_STANDARD',
    definitionId: 'FITTING_REDUCER_LEFT',
    params: { inletWidth: 600, outletWidth: 300 },
    catalogChain: 'left rail straight 600L ; right rail 200 | taper | 200',
    // Outlet centre shifts toward the straight (left, +X) side by (W1 − W2)/2 = 150.
    expectedPorts: [
      { id: 'PORT_A', position: [0, 0, -300], direction: [0, 0, -1], width: 600 },
      { id: 'PORT_B', position: [150, 0, 300], direction: [0, 0, 1], width: 300 },
    ],
    expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 200 + Math.hypot(200, 150) + 200 },
    expectedBounds: { min: [-313, -75, -300], max: [313, 75, 300] },
  },
  {
    id: 'LADDER_REDUCER_RIGHT_600_300',
    description: 'Right reducer 600 → 300: right rail straight (p.21)',
    sourcePage: 21,
    printedPage: '19',
    profileId: 'LADDER_PROFILE_STANDARD',
    definitionId: 'FITTING_REDUCER_RIGHT',
    params: { inletWidth: 600, outletWidth: 300 },
    catalogChain: 'right rail straight 600L ; left rail 200 | taper | 200',
    expectedPorts: [
      { id: 'PORT_A', position: [0, 0, -300], direction: [0, 0, -1], width: 600 },
      { id: 'PORT_B', position: [-150, 0, 300], direction: [0, 0, 1], width: 300 },
    ],
    expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 650 },
  },

  // ------------------------------------------------------------------ VENTILATED A (100W × 50H)
  {
    id: 'VENT_A_STRAIGHT',
    description: 'Ventilated-through straight 100W × 50H × 3000L',
    sourcePage: 30,
    printedPage: '2',
    profileId: 'VENTILATED_PROFILE_A',
    definitionId: 'TRAY_STRAIGHT',
    params: {},
    catalogChain: 'W 100 | H 50 | L 3000 ; cover W+6',
    expectedPorts: [
      { id: 'PORT_A', position: [0, 0, -1500], direction: [0, 0, -1], width: 100 },
      { id: 'PORT_B', position: [0, 0, 1500], direction: [0, 0, 1], width: 100 },
    ],
    expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 3000 },
    expectedBounds: { min: [-50, -25, -1500], max: [50, 25, 1500] },
  },
  {
    id: 'VENT_A_H90',
    description: 'Ventilated-through horizontal 90° 100W, R 300',
    sourcePage: 31,
    printedPage: '3',
    profileId: 'VENTILATED_PROFILE_A',
    definitionId: 'FITTING_ELBOW_90',
    params: {},
    catalogChain: 'bottom: W | R | 125 ; right: W | R | 125',
    expectedPorts: [
      { id: 'PORT_A', position: [350, 0, 125], direction: [0, 0, 1] },
      { id: 'PORT_B', position: [-125, 0, -350], direction: [-1, 0, 0] },
    ],
    expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 250 + 350 * HALF_PI },
    expectedBounds: { min: [-125, -25, -400], max: [400, 25, 125] },
  },
  {
    id: 'VENT_A_TEE',
    description: 'Ventilated-through tee 100W, R 300',
    sourcePage: 33,
    printedPage: '5',
    profileId: 'VENTILATED_PROFILE_A',
    definitionId: 'FITTING_TEE',
    params: {},
    catalogChain: '125 | R | W | R | 125 = 950 ; W | R | 125 = 525',
    expectedPorts: [
      { id: 'PORT_A', position: [-475, 0, 0], direction: [-1, 0, 0] },
      { id: 'PORT_B', position: [475, 0, 0], direction: [1, 0, 0] },
      { id: 'PORT_C', position: [0, 0, 475], direction: [0, 0, 1] },
    ],
    expectedRouteLengths: { ROUTE_A_B: 950, ROUTE_A_C: 250 + 350 * HALF_PI },
    expectedBounds: { min: [-475, -25, -50], max: [475, 25, 475] },
    expectedDims: { mainSpan: 950, branchFromBackRail: 525 },
  },
  {
    id: 'VENT_A_VI90',
    description: 'Ventilated-through vertical inside 90° 100W, R 300',
    sourcePage: 34,
    printedPage: '6',
    profileId: 'VENTILATED_PROFILE_A',
    definitionId: 'FITTING_RISER_IN_90',
    params: {},
    catalogChain: 'top: 125 | R | H ; left: 125 | R | H',
    expectedPorts: [
      { id: 'PORT_A', position: [-125, -325, 0], direction: [-1, 0, 0], up: [0, 1, 0] },
      { id: 'PORT_B', position: [325, 125, 0], direction: [0, 1, 0], up: [-1, 0, 0] },
    ],
    expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 250 + 325 * HALF_PI },
    expectedBounds: { min: [-125, -350, -50], max: [350, 125, 50] },
  },

  // ------------------------------------------------------------------ VENTILATED B (300W × 100H)
  {
    id: 'VENT_B_STRAIGHT',
    description: 'Ventilated-through straight 300W × 100H × 3000L',
    sourcePage: 41,
    printedPage: '2',
    profileId: 'VENTILATED_PROFILE_B',
    definitionId: 'TRAY_STRAIGHT',
    params: {},
    catalogChain: 'W 300 | H 100 | L 3000 ; cover W+6',
    expectedPorts: [
      { id: 'PORT_A', position: [0, 0, -1500], direction: [0, 0, -1], width: 300 },
      { id: 'PORT_B', position: [0, 0, 1500], direction: [0, 0, 1], width: 300 },
    ],
    expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 3000 },
    expectedBounds: { min: [-150, -50, -1500], max: [150, 50, 1500] },
  },
  {
    id: 'VENT_B_H30',
    description: 'Ventilated-through horizontal 30° 300W, R 300',
    sourcePage: 43,
    printedPage: '4',
    profileId: 'VENTILATED_PROFILE_B',
    definitionId: 'FITTING_ELBOW_30',
    params: {},
    catalogChain: 'bottom: W | R ; 125 tangents ; 30°',
    expectedPorts: [
      { id: 'PORT_A', position: [450, 0, 125], direction: [0, 0, 1] },
      { id: 'PORT_B', position: [450 * C30 - 125 * 0.5, 0, -450 * 0.5 - 125 * C30], direction: [-0.5, 0, -C30] },
    ],
    expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 250 + (450 * Math.PI) / 6 },
  },
  {
    id: 'VENT_B_VO90',
    description: 'Ventilated-through vertical outside 90° 300W, R 300',
    sourcePage: 45,
    printedPage: '6',
    profileId: 'VENTILATED_PROFILE_B',
    definitionId: 'FITTING_RISER_OUT_90',
    params: {},
    catalogChain: 'bottom: 125 | R | H ; left: H | R | 125',
    expectedPorts: [
      { id: 'PORT_A', position: [-125, 350, 0], direction: [-1, 0, 0], up: [0, 1, 0] },
      { id: 'PORT_B', position: [350, -125, 0], direction: [0, -1, 0], up: [1, 0, 0] },
    ],
    expectedRouteLengths: { ROUTE_PORT_A_PORT_B: 250 + 350 * HALF_PI },
    expectedBounds: { min: [-125, -125, -150], max: [400, 400, 150] },
  },
];
