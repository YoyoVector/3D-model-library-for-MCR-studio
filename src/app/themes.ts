/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Viewer themes. A theme only changes presentation (UI chrome, viewport background, lights,
 * environment reflections, grid, edges, tone mapping). It never touches geometry, ports,
 * centerlines, bounds, mate or BOM.
 */

export type ThemeId =
  | 'PRESENTATION_STEEL'
  | 'ENGINEERING_DARK'
  | 'ENGINEERING_LIGHT'
  | 'CAD_BLUEPRINT'
  | 'WARM_STUDIO'
  | 'CYBER_CONTRAST';

export interface ThemePreset {
  id: ThemeId;
  name: string;
  nameZh: string;
  /** Primary themes are shown directly; others live in the "more" menu. */
  primary: boolean;
  /** UI chrome mode. */
  ui: 'light' | 'dark';
  /** CSS background of the viewport (the WebGL canvas is transparent). */
  viewportCss: string;
  /** Swatch colour for the theme picker. */
  swatch: string;
  exposure: number;
  /** Image-based reflection strength (RoomEnvironment). 0 disables the environment. */
  environment: number;
  ambient: { color: number; intensity: number };
  key: { color: number; intensity: number };
  fill: { color: number; intensity: number };
  /** Opacity of the soft contact shadow on the ground (0 = no ground shadow). */
  shadowOpacity: number;
  grid: { center: number; lines: number; opacity: number };
  edgeColor: number;
  edgeOpacity: number;
  /** Edges drawn by default in this theme. */
  edgesByDefault: boolean;
  /** Port / centerline helper colours. */
  helper: { port: number; up: number; centerline: number; bounds: number };
  /** Optional rendering override of the shared tray material (appearance only). */
  trayMaterial?: { color: number; metalness: number; roughness: number };
}

export const THEME_PRESETS: Record<ThemeId, ThemePreset> = {
  PRESENTATION_STEEL: {
    id: 'PRESENTATION_STEEL',
    name: 'Presentation Steel',
    nameZh: '簡報鋼灰',
    primary: true,
    ui: 'light',
    viewportCss: 'radial-gradient(120% 90% at 50% 35%, #6b737d 0%, #4b525b 45%, #2e3339 100%)',
    swatch: '#555c65',
    exposure: 1.0,
    environment: 1.0,
    ambient: { color: 0xffffff, intensity: 0.25 },
    key: { color: 0xfff6ea, intensity: 2.1 },
    fill: { color: 0xc8d6ff, intensity: 0.55 },
    shadowOpacity: 0.32,
    grid: { center: 0x8a929c, lines: 0x69717b, opacity: 0.35 },
    edgeColor: 0x1b2027,
    edgeOpacity: 0.35,
    edgesByDefault: false,
    helper: { port: 0x38bdf8, up: 0x4ade80, centerline: 0xfbbf24, bounds: 0xf59e0b },
    // Neutral brushed-aluminium look for management demos (the catalog finish is a light grey powder coat).
    trayMaterial: { color: 0xc9cfd6, metalness: 0.82, roughness: 0.3 },
  },
  ENGINEERING_DARK: {
    id: 'ENGINEERING_DARK',
    name: 'Engineering Dark',
    nameZh: '工程深色',
    primary: true,
    ui: 'dark',
    viewportCss: '#0b111b',
    swatch: '#0b111b',
    exposure: 1.1,
    environment: 0.35,
    ambient: { color: 0xffffff, intensity: 0.55 },
    key: { color: 0xffffff, intensity: 1.8 },
    fill: { color: 0x38bdf8, intensity: 0.9 },
    shadowOpacity: 0.0,
    grid: { center: 0x334155, lines: 0x1e293b, opacity: 0.9 },
    edgeColor: 0x38bdf8,
    edgeOpacity: 0.55,
    edgesByDefault: true,
    helper: { port: 0x22d3ee, up: 0x4ade80, centerline: 0xfacc15, bounds: 0xfb923c },
  },
  ENGINEERING_LIGHT: {
    id: 'ENGINEERING_LIGHT',
    name: 'Engineering Light',
    nameZh: '工程淺色',
    primary: true,
    ui: 'light',
    viewportCss: '#e8ecf1',
    swatch: '#e8ecf1',
    exposure: 1.05,
    environment: 0.6,
    ambient: { color: 0xffffff, intensity: 0.9 },
    key: { color: 0xffffff, intensity: 1.9 },
    fill: { color: 0xdbeafe, intensity: 0.6 },
    shadowOpacity: 0.18,
    grid: { center: 0x94a3b8, lines: 0xcbd5e1, opacity: 0.8 },
    edgeColor: 0x1e293b,
    edgeOpacity: 0.7,
    edgesByDefault: true,
    helper: { port: 0x0284c7, up: 0x16a34a, centerline: 0xd97706, bounds: 0xea580c },
  },
  CAD_BLUEPRINT: {
    id: 'CAD_BLUEPRINT',
    name: 'CAD Blueprint',
    nameZh: 'CAD 藍圖',
    primary: false,
    ui: 'dark',
    viewportCss: '#09182f',
    swatch: '#09182f',
    exposure: 1.2,
    environment: 0.25,
    ambient: { color: 0xe0f2fe, intensity: 0.8 },
    key: { color: 0xffffff, intensity: 1.9 },
    fill: { color: 0x38bdf8, intensity: 1.2 },
    shadowOpacity: 0,
    grid: { center: 0x0284c7, lines: 0x172554, opacity: 1 },
    edgeColor: 0x7dd3fc,
    edgeOpacity: 0.6,
    edgesByDefault: true,
    helper: { port: 0x7dd3fc, up: 0x86efac, centerline: 0xfde047, bounds: 0xfdba74 },
  },
  WARM_STUDIO: {
    id: 'WARM_STUDIO',
    name: 'Warm Industrial Stone',
    nameZh: '工藝暖灰',
    primary: false,
    ui: 'dark',
    viewportCss: '#1c1917',
    swatch: '#1c1917',
    exposure: 1.2,
    environment: 0.3,
    ambient: { color: 0xfef3c7, intensity: 0.7 },
    key: { color: 0xffedd5, intensity: 2.0 },
    fill: { color: 0xf59e0b, intensity: 1.0 },
    shadowOpacity: 0,
    grid: { center: 0x57534e, lines: 0x292524, opacity: 1 },
    edgeColor: 0xfcd34d,
    edgeOpacity: 0.6,
    edgesByDefault: true,
    helper: { port: 0xfcd34d, up: 0x86efac, centerline: 0xfb923c, bounds: 0xf87171 },
  },
  CYBER_CONTRAST: {
    id: 'CYBER_CONTRAST',
    name: 'Cyber Pitch Black',
    nameZh: '高對比螢光',
    primary: false,
    ui: 'dark',
    viewportCss: '#020408',
    swatch: '#020408',
    exposure: 1.2,
    environment: 0.2,
    ambient: { color: 0xffffff, intensity: 0.5 },
    key: { color: 0x00ffcc, intensity: 1.5 },
    fill: { color: 0x38bdf8, intensity: 1.4 },
    shadowOpacity: 0,
    grid: { center: 0x0891b2, lines: 0x042f2e, opacity: 1 },
    edgeColor: 0x00ffcc,
    edgeOpacity: 0.65,
    edgesByDefault: true,
    helper: { port: 0x00ffcc, up: 0x86efac, centerline: 0xf0abfc, bounds: 0xfb923c },
  },
};

export const PRIMARY_THEMES = (Object.values(THEME_PRESETS) as ThemePreset[]).filter((t) => t.primary);
export const MORE_THEMES = (Object.values(THEME_PRESETS) as ThemePreset[]).filter((t) => !t.primary);
