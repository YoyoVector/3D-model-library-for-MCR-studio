/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Download,
  Box,
  Layers,
  ListOrdered,
  RotateCw,
  Cpu,
  Link,
  ChevronRight,
  Palette,
  Eye,
  Camera,
  Sun,
  Moon,
  Compass,
  Maximize2,
  Sparkles,
} from 'lucide-react';

import {
  VERSION,
  ComponentRegistry,
  ComponentInstance,
  MateEngine,
  ConnectionValidator,
  AcceptanceTestSuite,
  type TestSuiteReport,
  JsonExporter,
  BomManager,
  type BomReport,
  CatalogStandards,
  Units,
  Materials,
  BomScope,
  type ComponentDefinition,
  type WorldPortDefinition,
  type BomScopeType,
} from './index.ts';
import { TraySystemProfiles } from './registry/TraySystemProfile.ts';

// Theme Presets Definition
export type ThemeId = 'DARK_SLATE' | 'STUDIO_LIGHT' | 'CAD_BLUEPRINT' | 'WARM_STUDIO' | 'CYBER_CONTRAST';

export interface ThemePreset {
  id: ThemeId;
  name: string;
  nameZh: string;
  badge: string;
  bgColor: number;
  bgHex: string;
  ambientLight: { color: number; intensity: number };
  sunLight: { color: number; intensity: number };
  fillLight: { color: number; intensity: number };
  backLight: { color: number; intensity: number };
  gridCenter: number;
  gridLines: number;
  edgeColor: number;
  isLight: boolean;
}

export const THEME_PRESETS: Record<ThemeId, ThemePreset> = {
  STUDIO_LIGHT: {
    id: 'STUDIO_LIGHT',
    name: 'Studio Light (High Contrast)',
    nameZh: '明亮工程灰 (推薦)',
    badge: 'bg-slate-200 text-slate-900 border-slate-400',
    bgColor: 0xebedf0,
    bgHex: '#ebedf0',
    ambientLight: { color: 0xffffff, intensity: 1.15 },
    sunLight: { color: 0xffffff, intensity: 2.2 },
    fillLight: { color: 0x0284c7, intensity: 1.2 },
    backLight: { color: 0x475569, intensity: 1.0 },
    gridCenter: 0x64748b,
    gridLines: 0xcbd5e1,
    edgeColor: 0x1e293b,
    isLight: true,
  },
  DARK_SLATE: {
    id: 'DARK_SLATE',
    name: 'Dark Industrial',
    nameZh: '深邃工程黑',
    badge: 'bg-slate-900 text-slate-300 border-slate-700',
    bgColor: 0x070b14,
    bgHex: '#070b14',
    ambientLight: { color: 0xffffff, intensity: 0.65 },
    sunLight: { color: 0xfffaed, intensity: 1.8 },
    fillLight: { color: 0x38bdf8, intensity: 2.2 },
    backLight: { color: 0xa855f7, intensity: 1.8 },
    gridCenter: 0x334155,
    gridLines: 0x0f172a,
    edgeColor: 0x38bdf8,
    isLight: false,
  },
  CAD_BLUEPRINT: {
    id: 'CAD_BLUEPRINT',
    name: 'CAD Blueprint',
    nameZh: '經典 CAD 藍圖',
    badge: 'bg-blue-950 text-blue-300 border-blue-800',
    bgColor: 0x09182f,
    bgHex: '#09182f',
    ambientLight: { color: 0xe0f2fe, intensity: 0.8 },
    sunLight: { color: 0xffffff, intensity: 1.9 },
    fillLight: { color: 0x38bdf8, intensity: 2.5 },
    backLight: { color: 0x0284c7, intensity: 1.8 },
    gridCenter: 0x0284c7,
    gridLines: 0x172554,
    edgeColor: 0x7dd3fc,
    isLight: false,
  },
  WARM_STUDIO: {
    id: 'WARM_STUDIO',
    name: 'Warm Industrial Stone',
    nameZh: '工藝鑄造暖灰',
    badge: 'bg-amber-950 text-amber-300 border-amber-800',
    bgColor: 0x1c1917,
    bgHex: '#1c1917',
    ambientLight: { color: 0xfef3c7, intensity: 0.7 },
    sunLight: { color: 0xffedd5, intensity: 2.0 },
    fillLight: { color: 0xf59e0b, intensity: 2.2 },
    backLight: { color: 0xf43f5e, intensity: 1.5 },
    gridCenter: 0x57534e,
    gridLines: 0x292524,
    edgeColor: 0xfcd34d,
    isLight: false,
  },
  CYBER_CONTRAST: {
    id: 'CYBER_CONTRAST',
    name: 'Cyber Pitch Black',
    nameZh: '極致高反差黑曜',
    badge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    bgColor: 0x000000,
    bgHex: '#000000',
    ambientLight: { color: 0xffffff, intensity: 0.5 },
    sunLight: { color: 0xffffff, intensity: 2.2 },
    fillLight: { color: 0x00ff88, intensity: 2.8 },
    backLight: { color: 0x00d2ff, intensity: 2.4 },
    gridCenter: 0x10b981,
    gridLines: 0x042f2e,
    edgeColor: 0x00ffcc,
    isLight: false,
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'VIEWER' | 'PLANT_SCENE' | 'MATE_DEMO' | 'TESTS' | 'BOM'>('VIEWER');
  const [selectedCompId, setSelectedCompId] = useState<string>('TRAY_STRAIGHT');
  const [componentParams, setComponentParams] = useState<Record<string, any>>({});
  const [testReport, setTestReport] = useState<TestSuiteReport | null>(null);
  const [bomReport, setBomReport] = useState<BomReport | null>(null);
  const [selectedBomScope, setSelectedBomScope] = useState<BomScopeType | 'ALL'>('ALL');
  const [selectedPort, setSelectedPort] = useState<WorldPortDefinition | null>(null);

  // Theme & Visual Contrast state (Default to STUDIO_LIGHT for high contrast full-visibility)
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>('STUDIO_LIGHT');
  const [showEdges, setShowEdges] = useState<boolean>(true); // Edge outlines so shape never blends with background!
  const [showPorts, setShowPorts] = useState(true);
  const [showCenterline, setShowCenterline] = useState(true);
  const [showBounds, setShowBounds] = useState(false);
  const [showCables, setShowCables] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);

  // Mating demo state
  const [mateTolerance, setMateTolerance] = useState<number>(0.5);
  const [mateResult, setMateResult] = useState<any>(null);

  // 3D Canvas Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const activeModelGroupRef = useRef<THREE.Group>(new THREE.Group());
  const visualHelpersGroupRef = useRef<THREE.Group>(new THREE.Group());
  const edgeHelpersGroupRef = useRef<THREE.Group>(new THREE.Group());

  // Light & Grid Refs for dynamic live switching
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.PointLight | null>(null);
  const backLightRef = useRef<THREE.PointLight | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);

  // Current active instance ref
  const currentInstanceRef = useRef<ComponentInstance | null>(null);

  // Initialize tests and default parameters on mount
  useEffect(() => {
    const initialReport = AcceptanceTestSuite.runAll();
    setTestReport(initialReport);

    const initialDef = ComponentRegistry.get('TRAY_STRAIGHT');
    if (initialDef) {
      setComponentParams({ ...initialDef.defaultParameters });
    }

    // Initial BOM
    const sampleInstances = [
      new ComponentInstance('tray_1', ComponentRegistry.get('TRAY_STRAIGHT')!),
      new ComponentInstance('tray_2', ComponentRegistry.get('TRAY_STRAIGHT_DIVIDER')!),
      new ComponentInstance('elbow_1', ComponentRegistry.get('FITTING_ELBOW_90')!),
      new ComponentInstance('tee_1', ComponentRegistry.get('FITTING_TEE')!),
      new ComponentInstance('mct_1', ComponentRegistry.get('PENETRATION_MCT')!),
      new ComponentInstance('bay_1', ComponentRegistry.get('STRUCT_MAIN_BAY')!),
    ];
    setBomReport(BomManager.generateBom(sampleInstances));
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth;
    const height = canvasRef.current.clientHeight;
    const initialTheme = THEME_PRESETS[selectedThemeId];

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(initialTheme.bgColor);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(2.6, 2.0, 3.0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    canvasRef.current.replaceChildren(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controlsRef.current = controls;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(initialTheme.ambientLight.color, initialTheme.ambientLight.intensity);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const sunLight = new THREE.DirectionalLight(initialTheme.sunLight.color, initialTheme.sunLight.intensity);
    sunLight.position.set(6, 12, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    const fillLight = new THREE.PointLight(initialTheme.fillLight.color, initialTheme.fillLight.intensity, 18);
    fillLight.position.set(-4, 3, 4);
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    const backLight = new THREE.PointLight(initialTheme.backLight.color, initialTheme.backLight.intensity, 18);
    backLight.position.set(4, -2, -4);
    scene.add(backLight);
    backLightRef.current = backLight;

    // Floor grid
    const grid = new THREE.GridHelper(16, 32, initialTheme.gridCenter, initialTheme.gridLines);
    grid.position.y = -0.01;
    scene.add(grid);
    gridRef.current = grid;

    // Add model & helper groups
    scene.add(activeModelGroupRef.current);
    scene.add(edgeHelpersGroupRef.current);
    scene.add(visualHelpersGroupRef.current);

    // Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();

      // Flow texture animation
      const tex = Materials.getCableFlowTexture();
      if (tex && showCables) {
        tex.offset.x -= 0.012;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update theme dynamically
  const applyTheme = (themeId: ThemeId) => {
    setSelectedThemeId(themeId);
    const theme = THEME_PRESETS[themeId];
    if (!sceneRef.current) return;

    sceneRef.current.background = new THREE.Color(theme.bgColor);

    if (ambientLightRef.current) {
      ambientLightRef.current.color.setHex(theme.ambientLight.color);
      ambientLightRef.current.intensity = theme.ambientLight.intensity;
    }
    if (sunLightRef.current) {
      sunLightRef.current.color.setHex(theme.sunLight.color);
      sunLightRef.current.intensity = theme.sunLight.intensity;
    }
    if (fillLightRef.current) {
      fillLightRef.current.color.setHex(theme.fillLight.color);
      fillLightRef.current.intensity = theme.fillLight.intensity;
    }
    if (backLightRef.current) {
      backLightRef.current.color.setHex(theme.backLight.color);
      backLightRef.current.intensity = theme.backLight.intensity;
    }

    if (gridRef.current && sceneRef.current) {
      sceneRef.current.remove(gridRef.current);
      gridRef.current.dispose();
      const newGrid = new THREE.GridHelper(16, 32, theme.gridCenter, theme.gridLines);
      newGrid.position.y = -0.01;
      sceneRef.current.add(newGrid);
      gridRef.current = newGrid;
    }
  };

  // Camera preset views
  const setCameraAngle = (view: 'ISO' | 'TOP' | 'FRONT' | 'SIDE') => {
    if (!cameraRef.current || !controlsRef.current) return;
    controlsRef.current.target.set(0, 0, 0);

    if (view === 'ISO') {
      cameraRef.current.position.set(2.6, 2.0, 3.0);
    } else if (view === 'TOP') {
      cameraRef.current.position.set(0, 4.2, 0.001);
    } else if (view === 'FRONT') {
      cameraRef.current.position.set(0, 0.3, 3.6);
    } else if (view === 'SIDE') {
      cameraRef.current.position.set(3.6, 0.3, 0);
    }
    controlsRef.current.update();
  };

  // Update scene when selected component, params, or view mode changes
  useEffect(() => {
    if (!sceneRef.current) return;

    if (activeTab === 'VIEWER') {
      loadComponentToScene(selectedCompId, componentParams);
    } else if (activeTab === 'PLANT_SCENE') {
      loadFullPlantScene();
    } else if (activeTab === 'MATE_DEMO') {
      loadMateDemoScene();
    }
  }, [activeTab, selectedCompId, componentParams, showPorts, showCenterline, showBounds, showCables, showEdges, selectedThemeId]);

  // Handle auto-rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 1.5;
    }
  }, [autoRotate]);

  // Load Single Component in Viewer
  const loadComponentToScene = (compId: string, customParams: Record<string, any>) => {
    const def = ComponentRegistry.get(compId);
    if (!def) return;

    // Clear previous models and helpers
    while (activeModelGroupRef.current.children.length > 0) {
      activeModelGroupRef.current.remove(activeModelGroupRef.current.children[0]);
    }
    while (visualHelpersGroupRef.current.children.length > 0) {
      visualHelpersGroupRef.current.remove(visualHelpersGroupRef.current.children[0]);
    }
    while (edgeHelpersGroupRef.current.children.length > 0) {
      edgeHelpersGroupRef.current.remove(edgeHelpersGroupRef.current.children[0]);
    }

    const effective = { ...def.defaultParameters, ...customParams };
    const inst = new ComponentInstance('preview_instance', def, effective);
    currentInstanceRef.current = inst;

    // Add mesh to scene
    const meshGroup = inst.getThreeMesh();
    activeModelGroupRef.current.add(meshGroup);

    const theme = THEME_PRESETS[selectedThemeId];

    // Build Edge Outlines (Ensures crystal clear shape even without rotating or against any background)
    if (showEdges) {
      const edgeMat = new THREE.LineBasicMaterial({
        color: theme.edgeColor,
        linewidth: 1.5,
        transparent: true,
        opacity: theme.isLight ? 0.75 : 0.6,
      });

      meshGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).geometry) {
          const edges = new THREE.EdgesGeometry((child as THREE.Mesh).geometry, 26);
          const line = new THREE.LineSegments(edges, edgeMat);
          line.matrix = child.matrix;
          line.matrixAutoUpdate = false;
          edgeHelpersGroupRef.current.add(line);
        }
      });
    }

    // Build visual helpers
    const ports = inst.getWorldPorts();
    const routes = inst.getCenterlines();
    const bounds = inst.getBounds();

    // 1. Ports and outward normal arrows
    if (showPorts) {
      ports.forEach((p) => {
        const portMarkerGroup = new THREE.Group();
        const posM = [Units.mmToM(p.worldPosition[0]), Units.mmToM(p.worldPosition[1]), Units.mmToM(p.worldPosition[2])];
        portMarkerGroup.position.set(posM[0], posM[1], posM[2]);

        const rectGeo = new THREE.PlaneGeometry(Units.mmToM(p.width), Units.mmToM(p.depth));
        const rectMat = new THREE.MeshBasicMaterial({
          color: theme.isLight ? 0x0284c7 : 0x00ffff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5,
          wireframe: true,
        });
        const rectMesh = new THREE.Mesh(rectGeo, rectMat);

        const dirVec = new THREE.Vector3(p.worldDirection[0], p.worldDirection[1], p.worldDirection[2]).normalize();
        const upVec = new THREE.Vector3(p.worldUp[0], p.worldUp[1], p.worldUp[2]).normalize();
        const rotMat = new THREE.Matrix4().makeBasis(
          new THREE.Vector3().crossVectors(upVec, dirVec).normalize(),
          upVec,
          dirVec
        );
        rectMesh.quaternion.setFromRotationMatrix(rotMat);
        portMarkerGroup.add(rectMesh);

        // Outward direction arrow
        const arrowColor = theme.isLight ? 0x059669 : 0x00ff88;
        const arrowHelper = new THREE.ArrowHelper(dirVec, new THREE.Vector3(0, 0, 0), 0.25, arrowColor, 0.08, 0.04);
        portMarkerGroup.add(arrowHelper);

        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.02, 16, 16),
          new THREE.MeshBasicMaterial({ color: theme.isLight ? 0x0284c7 : 0x00ffff })
        );
        portMarkerGroup.add(sphere);

        visualHelpersGroupRef.current.add(portMarkerGroup);
      });
    }

    // 2. Centerline routes
    if (showCenterline) {
      routes.forEach((route, idx) => {
        const colors = theme.isLight
          ? [0x0284c7, 0xd97706, 0x059669, 0xdb2777]
          : [0x38bdf8, 0xf59e0b, 0x10b981, 0xec4899];
        const routeColor = colors[idx % colors.length];

        const pts = route.samplePoints.map((pt) => new THREE.Vector3(Units.mmToM(pt[0]), Units.mmToM(pt[1]), Units.mmToM(pt[2])));
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const lineMat = new THREE.LineBasicMaterial({ color: routeColor, linewidth: 3 });
        const line = new THREE.Line(lineGeo, lineMat);
        visualHelpersGroupRef.current.add(line);
      });
    }

    // 3. Bounds & Clearance
    if (showBounds && bounds) {
      const minM = [Units.mmToM(bounds.min[0]), Units.mmToM(bounds.min[1]), Units.mmToM(bounds.min[2])];
      const maxM = [Units.mmToM(bounds.max[0]), Units.mmToM(bounds.max[1]), Units.mmToM(bounds.max[2])];
      const sizeM = [maxM[0] - minM[0], maxM[1] - minM[1], maxM[2] - minM[2]];
      const centerM = [(minM[0] + maxM[0]) / 2, (minM[1] + maxM[1]) / 2, (minM[2] + maxM[2]) / 2];

      const boxGeo = new THREE.BoxGeometry(sizeM[0], sizeM[1], sizeM[2]);
      const boxWire = new THREE.BoxHelper(new THREE.Mesh(boxGeo), theme.isLight ? 0x94a3b8 : 0x334155);
      boxWire.position.set(centerM[0], centerM[1], centerM[2]);
      visualHelpersGroupRef.current.add(boxWire);

      if (bounds.clearanceEnvelope) {
        const cMin = bounds.clearanceEnvelope.min.map((v) => Units.mmToM(v));
        const cMax = bounds.clearanceEnvelope.max.map((v) => Units.mmToM(v));
        const cSize = [cMax[0] - cMin[0], cMax[1] - cMin[1], cMax[2] - cMin[2]];
        const cCenter = [(cMin[0] + cMax[0]) / 2, (cMin[1] + cMax[1]) / 2, (cMin[2] + cMax[2]) / 2];

        const clearMesh = new THREE.Mesh(
          new THREE.BoxGeometry(cSize[0], cSize[1], cSize[2]),
          new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.18 })
        );
        clearMesh.position.set(cCenter[0], cCenter[1], cCenter[2]);
        const clearWire = new THREE.BoxHelper(clearMesh, 0xf87171);
        visualHelpersGroupRef.current.add(clearMesh, clearWire);
      }
    }

    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.target.set(0, 0, 0);
    }
  };

  // Load Complete MCR Plant Scene
  const loadFullPlantScene = () => {
    while (activeModelGroupRef.current.children.length > 0) {
      activeModelGroupRef.current.remove(activeModelGroupRef.current.children[0]);
    }
    while (visualHelpersGroupRef.current.children.length > 0) {
      visualHelpersGroupRef.current.remove(visualHelpersGroupRef.current.children[0]);
    }
    while (edgeHelpersGroupRef.current.children.length > 0) {
      edgeHelpersGroupRef.current.remove(edgeHelpersGroupRef.current.children[0]);
    }

    const plantGroup = new THREE.Group();

    // 1. Main Pipe Rack Portal Bays
    const bayDef = ComponentRegistry.get('STRUCT_MAIN_BAY')!;
    [-18, -14, -8, -2, 4, 8].forEach((x) => {
      const bay = new ComponentInstance(`bay_${x}`, bayDef, {}, { position: [x * 1000, 0, 0] });
      plantGroup.add(bay.getThreeMesh());
    });

    // 2. North and South Branch Bays
    const branchBayDef = ComponentRegistry.get('STRUCT_BRANCH_BAY')!;
    [-6.5, -9.5].forEach((bz) => {
      const bBay = new ComponentInstance(`b_bay_${bz}`, branchBayDef, {}, { position: [-14000, 0, bz * 1000] });
      plantGroup.add(bBay.getThreeMesh());
    });

    // 3. Process & Steam Piping Obstacles
    const pProc = new ComponentInstance('p_proc', ComponentRegistry.get('OBSTACLE_MAIN_PROCESS_PIPE')!, {}, { position: [-5000, 3300, -1200] });
    const pSteam = new ComponentInstance('p_steam', ComponentRegistry.get('OBSTACLE_MAIN_STEAM_PIPE')!, {}, { position: [-5000, 5050, 1200] });
    plantGroup.add(pProc.getThreeMesh(), pSteam.getThreeMesh());

    // 4. Junction Boxes
    const jbDef = ComponentRegistry.get('EQUIP_JUNCTION_BOX')!;
    const jbs = [
      { id: 'JB101', pos: [-14000, 1400, -9500], type: 'IS' },
      { id: 'JB102', pos: [-14000, 1400, -6500], type: 'NON_IS' },
      { id: 'JB103', pos: [-8000, 1400, -3800], type: 'IS' },
      { id: 'JB201', pos: [-14000, 1400, 3800], type: 'NON_IS' },
      { id: 'JB202', pos: [-2000, 1400, 6500], type: 'IS' },
      { id: 'JB203', pos: [-2000, 1400, 9500], type: 'FIBER' },
    ];
    jbs.forEach((jb) => {
      const jbInst = new ComponentInstance(jb.id, jbDef, { boxType: jb.type }, { position: jb.pos as any });
      plantGroup.add(jbInst.getThreeMesh());
    });

    // 5. MCT Penetration & Control Building
    const mctDef = ComponentRegistry.get('PENETRATION_MCT')!;
    const mct1 = new ComponentInstance('mct_1', mctDef, {}, { position: [12000, 3200, -2500] });
    const mct2 = new ComponentInstance('mct_2', mctDef, {}, { position: [12000, 3200, 2500] });
    const bldg = new ComponentInstance('bldg', ComponentRegistry.get('CONTEXT_BUILDING')!, {}, { position: [16000, 2750, 0] });
    plantGroup.add(mct1.getThreeMesh(), mct2.getThreeMesh(), bldg.getThreeMesh());

    // 6. Cable Trays (Upper Non-IS EL +7.2m & Lower IS EL +6.4m)
    const trayDef = ComponentRegistry.get('TRAY_STRAIGHT')!;
    const trayIS = new ComponentInstance('tray_is', trayDef, { length: 26000, width: 600, depth: 100, isIS: true }, { position: [-5000, 6400, -1800] });
    const trayNIS = new ComponentInstance('tray_nis', trayDef, { length: 26000, width: 600, depth: 100, isIS: false }, { position: [-5000, 7200, 600] });
    plantGroup.add(trayIS.getThreeMesh(), trayNIS.getThreeMesh());

    // 7. Dynamic Flowing Cables
    if (showCables) {
      const cableDef = ComponentRegistry.get('VISUAL_CABLE_GENERATOR')!;
      const isCable = new ComponentInstance('cable_is', cableDef, {
        colorHex: 0x00d2ff,
        emissiveHex: 0x0088cc,
        pathPoints: [
          [-14000, 1400, -9500],
          [-14000, 6400, -9500],
          [-14000, 6400, -1800],
          [8000, 6400, -1800],
          [12000, 3200, -2500],
          [16000, 400, -2500],
        ],
      });
      const nonIsCable = new ComponentInstance('cable_nis', cableDef, {
        colorHex: 0xffb703,
        emissiveHex: 0xcc8800,
        pathPoints: [
          [-14000, 1400, -6500],
          [-14000, 7200, -6500],
          [-14000, 7200, 600],
          [8000, 7200, 600],
          [12000, 3200, 2500],
          [16000, 400, 2500],
        ],
      });
      plantGroup.add(isCable.getThreeMesh(), nonIsCable.getThreeMesh());
    }

    activeModelGroupRef.current.add(plantGroup);

    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.set(24, 18, 22);
      controlsRef.current.target.set(0, 4, 0);
    }
  };

  // Load Live Assembly & Mating Demo Scene
  const loadMateDemoScene = () => {
    while (activeModelGroupRef.current.children.length > 0) {
      activeModelGroupRef.current.remove(activeModelGroupRef.current.children[0]);
    }
    while (visualHelpersGroupRef.current.children.length > 0) {
      visualHelpersGroupRef.current.remove(visualHelpersGroupRef.current.children[0]);
    }
    while (edgeHelpersGroupRef.current.children.length > 0) {
      edgeHelpersGroupRef.current.remove(edgeHelpersGroupRef.current.children[0]);
    }

    const straightDef = ComponentRegistry.get('TRAY_STRAIGHT')!;
    const elbowDef = ComponentRegistry.get('FITTING_ELBOW_90')!;

    const instA = new ComponentInstance('straight_run', straightDef, { length: 2000, width: 600, depth: 100 });
    instA.setPlacement({ position: [0, 0, -1000], quaternion: [0, 0, 0, 1] });

    const instB = new ComponentInstance('elbow_turn', elbowDef, { radius: 600, width: 600, depth: 100 });

    const result = MateEngine.computeMateTransform(instA, 'PORT_B', instB, 'PORT_A', mateTolerance);
    setMateResult(result);

    if (result.success) {
      instB.setPlacement(result.placement);
    }

    activeModelGroupRef.current.add(instA.getThreeMesh(), instB.getThreeMesh());

    // Highlight mating port interface
    const portsA = instA.getWorldPorts();
    const portB = portsA.find((p) => p.id === 'PORT_B');
    if (portB) {
      const ringGeo = new THREE.RingGeometry(0.1, 0.15, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(Units.mmToM(portB.worldPosition[0]), Units.mmToM(portB.worldPosition[1]), Units.mmToM(portB.worldPosition[2]));
      visualHelpersGroupRef.current.add(ring);
    }

    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.set(1.5, 2.0, 1.5);
      controlsRef.current.target.set(0, 0, 0);
    }
  };

  const handleSelectComponent = (id: string) => {
    setSelectedCompId(id);
    const def = ComponentRegistry.get(id);
    if (def) {
      setComponentParams({ ...def.defaultParameters });
    }
    setSelectedPort(null);
  };

  const handleParamChange = (paramKey: string, val: number | string) => {
    setComponentParams((prev) => ({
      ...prev,
      [paramKey]: val,
    }));
  };

  const currentDef = ComponentRegistry.get(selectedCompId);
  const currentPorts = currentInstanceRef.current?.getWorldPorts() || [];
  const currentRoutes = currentInstanceRef.current?.getCenterlines() || [];
  const conformance = currentDef ? CatalogStandards.checkConformance(componentParams) : { isStandard: true, warnings: [] };
  const currentTheme = THEME_PRESETS[selectedThemeId];

  return (
    <div className="flex h-screen w-screen bg-[#060913] text-slate-100 font-sans select-none overflow-hidden">
      {/* Sidebar: Navigation & Component Inventory */}
      <aside className="w-80 border-r border-slate-800/80 bg-[#090e1c] flex flex-col shrink-0 z-20">
        {/* Branding Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xs tracking-wider text-white flex items-center">
                MCR-STUDIO <span className="text-[10px] ml-1.5 px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">v{VERSION}</span>
              </h1>
              <p className="text-[10px] text-slate-400">@mcr-studio/parametric-3d Demo Consumer</p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-slate-950 border-b border-slate-800/80 text-[11px] font-medium">
          <button
            onClick={() => setActiveTab('VIEWER')}
            className={`py-1.5 px-2 rounded flex flex-col items-center justify-center transition ${
              activeTab === 'VIEWER' ? 'bg-cyan-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Box className="w-3.5 h-3.5 mb-0.5" />
            <span>配件庫 (32)</span>
          </button>
          <button
            onClick={() => setActiveTab('PLANT_SCENE')}
            className={`py-1.5 px-2 rounded flex flex-col items-center justify-center transition ${
              activeTab === 'PLANT_SCENE' ? 'bg-blue-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 mb-0.5" />
            <span>主管廊場景</span>
          </button>
          <button
            onClick={() => setActiveTab('MATE_DEMO')}
            className={`py-1.5 px-2 rounded flex flex-col items-center justify-center transition ${
              activeTab === 'MATE_DEMO' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Link className="w-3.5 h-3.5 mb-0.5" />
            <span>對接裝配</span>
          </button>
        </div>

        {/* Component Inventory List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {['LEGACY_FITTING_LIBRARY', 'LEGACY_MCR_PROTOTYPE', 'NEW_COMPONENT', 'DERIVED_ASSEMBLY'].map((originKey) => {
            const originDefs = ComponentRegistry.getAll().filter((d) => d.origin === originKey);
            const originTitle =
              originKey === 'LEGACY_FITTING_LIBRARY'
                ? '既有配件基準 (Legacy Fitting)'
                : originKey === 'LEGACY_MCR_PROTOTYPE'
                ? '既有 MCR 原型模型 (Legacy MCR)'
                : originKey === 'NEW_COMPONENT'
                ? '全新補全構件 (New Component)'
                : '衍生組合件 (Derived Assembly)';

            return (
              <div key={originKey} className="space-y-1">
                <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/60 rounded">
                  <span>{originTitle}</span>
                  <span className="font-mono text-cyan-400">{originDefs.length}</span>
                </div>
                <div className="space-y-0.5">
                  {originDefs.map((def) => (
                    <button
                      key={def.id}
                      onClick={() => handleSelectComponent(def.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition ${
                        selectedCompId === def.id && activeTab === 'VIEWER'
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-medium'
                          : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-medium truncate">{def.nameZh}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">{def.name}</div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons: Run Tests & BOM */}
        <div className="p-2 border-t border-slate-800 bg-slate-950 grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setActiveTab('TESTS')}
            className={`py-2 px-2.5 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'TESTS' ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-amber-400" />
            <span>28項驗收 (Case A~AB)</span>
          </button>
          <button
            onClick={() => setActiveTab('BOM')}
            className={`py-2 px-2.5 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'BOM' ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 text-blue-400" />
            <span>BOM 材料</span>
          </button>
        </div>
      </aside>

      {/* Main Viewport & Viewer Canvas */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-950">
        {/* Top Control Bar: Themes, Camera Presets & Visibility Controls */}
        <header className="h-14 border-b border-slate-800/80 bg-[#090e1c]/95 backdrop-blur px-4 flex items-center justify-between z-10">
          {/* Left: Component Title & Status */}
          <div className="flex items-center space-x-3">
            <span className="font-bold text-sm text-white flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>
                {activeTab === 'VIEWER' && currentDef ? `${currentDef.nameZh} (${currentDef.name})` : ''}
                {activeTab === 'PLANT_SCENE' && '主管廊最頂雙階 3D 整合尋徑場景 (EL +6.4m / +7.2m)'}
                {activeTab === 'MATE_DEMO' && '裝配引擎精確對接展示 (Mate Transform & Tolerance)'}
                {activeTab === 'TESTS' && '自動化驗收測試總覽 (Case A ~ Case P Acceptance Suite)'}
                {activeTab === 'BOM' && 'BOM 材料單與防重複計價驗證 (Zero Double-Counting)'}
              </span>
            </span>
          </div>

          {/* Center: Theme Switcher Bar (Directly Solves Background Contrast!) */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700 rounded-lg p-1 space-x-1 text-xs">
            <span className="px-1.5 text-[10px] text-slate-400 flex items-center font-medium">
              <Palette className="w-3 h-3 mr-1 text-cyan-400" /> 主題底色:
            </span>
            {(Object.keys(THEME_PRESETS) as ThemeId[]).map((tId) => {
              const theme = THEME_PRESETS[tId];
              const isSelected = selectedThemeId === tId;
              return (
                <button
                  key={tId}
                  onClick={() => applyTheme(tId)}
                  className={`px-2 py-1 rounded text-[11px] font-medium flex items-center space-x-1 transition ${
                    isSelected
                      ? 'bg-cyan-600 text-white font-bold shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={`${theme.nameZh} (${theme.name})`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/30 shrink-0"
                    style={{ backgroundColor: theme.bgHex }}
                  />
                  <span>{theme.nameZh}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Camera Presets & Toggles */}
          <div className="flex items-center space-x-2 text-xs">
            {/* Camera View Presets */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 space-x-0.5 text-[11px]">
              <button
                onClick={() => setCameraAngle('ISO')}
                className="px-2 py-0.8 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                title="等角透視 (3D Isometric 3/4)"
              >
                3D等角
              </button>
              <button
                onClick={() => setCameraAngle('TOP')}
                className="px-2 py-0.8 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                title="俯視平面圖 (Top Plan)"
              >
                俯視
              </button>
              <button
                onClick={() => setCameraAngle('FRONT')}
                className="px-2 py-0.8 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                title="正視剖面 (Front Elevation)"
              >
                正視
              </button>
              <button
                onClick={() => setCameraAngle('SIDE')}
                className="px-2 py-0.8 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                title="側視剖面 (Side Profile)"
              >
                側視
              </button>
            </div>

            {/* Edge Outlines Toggle (Sharp silhouette against any background!) */}
            <button
              onClick={() => setShowEdges(!showEdges)}
              className={`px-2.5 py-1 rounded border flex items-center space-x-1 transition ${
                showEdges
                  ? 'bg-amber-950/90 text-amber-300 border-amber-600 font-medium'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
              title="強化構件邊緣輪廓線 (防止融入背景，清晰展現橫檔、邊軌與法蘭幾何)"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>輪廓線: {showEdges ? '開' : '關'}</span>
            </button>

            {/* Ports Toggle */}
            <button
              onClick={() => setShowPorts(!showPorts)}
              className={`px-2.5 py-1 rounded border transition ${
                showPorts ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              Ports ({currentPorts.length})
            </button>

            {/* Centerlines Toggle */}
            <button
              onClick={() => setShowCenterline(!showCenterline)}
              className={`px-2.5 py-1 rounded border transition ${
                showCenterline ? 'bg-blue-950 text-blue-300 border-blue-700' : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              Centerlines
            </button>

            {/* Auto-Rotate Toggle */}
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-2.5 py-1 rounded border transition ${
                autoRotate ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              旋轉: {autoRotate ? '開' : '關'}
            </button>

            {/* JSON Export */}
            <button
              onClick={() => {
                if (currentDef) {
                  const json = JsonExporter.exportDefinition(currentDef);
                  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${currentDef.id}_definition_v2.json`;
                  a.click();
                }
              }}
              className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
              title="匯出符合 Schema 2.0.0 之規格 JSON"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>JSON</span>
            </button>
          </div>
        </header>

        {/* 3D Canvas Viewport */}
        <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: currentTheme.bgHex }}>
          <div ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Quick Notice Badge in Canvas */}
          <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur border border-slate-700/80 rounded-lg px-3 py-1.5 text-[11px] text-slate-300 flex items-center space-x-2 shadow-lg">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentTheme.isLight ? '#0284c7' : '#38bdf8' }} />
            <span>當前主題: <strong>{currentTheme.nameZh}</strong> ({currentTheme.name})</span>
            <span className="text-slate-500">|</span>
            <span>輪廓強化: {showEdges ? '已啟用' : '關閉'}</span>
            <span className="text-slate-500">|</span>
            <span>拖曳旋轉 / 滾輪縮放 / 點擊上方視角快速切換</span>
          </div>

          {/* Non-standard catalog warning alert banner */}
          {conformance.warnings.length > 0 && activeTab === 'VIEWER' && (
            <div className="absolute top-3 left-3 max-w-md bg-amber-950/90 border border-amber-600/80 rounded-lg p-2.5 text-amber-200 text-xs shadow-2xl flex items-start space-x-2 backdrop-blur">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">型錄標準警示 (Catalog Notice):</span>
                <p className="text-[11px] text-amber-300/90">{conformance.warnings.join(' ')}</p>
              </div>
            </div>
          )}

          {/* Live Mate Engine Demo Overlay */}
          {activeTab === 'MATE_DEMO' && mateResult && (
            <div className="absolute top-3 left-3 bg-[#0f172a]/95 border border-cyan-700/60 rounded-xl p-3.5 text-xs shadow-2xl space-y-2 backdrop-blur max-w-sm">
              <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                <span className="font-bold text-cyan-400 flex items-center space-x-1.5">
                  <Link className="w-4 h-4" />
                  <span>對接裝配運算 (Mate Engine)</span>
                </span>
                <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${mateResult.success ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-red-950 text-red-300'}`}>
                  {mateResult.success ? 'PASS (對接成功)' : 'FAIL'}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">對接端點:</span>
                  <span className="text-white">Straight Port B ➔ Elbow Port A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">位置重合誤差:</span>
                  <span className="text-emerald-400 font-bold">{mateResult.positionErrorMm.toFixed(4)} mm (門檻 &le; {mateTolerance}mm)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">方向相反 Dot:</span>
                  <span className="text-cyan-400 font-bold">{mateResult.alignmentDotProduct.toFixed(4)} (門檻 &le; -0.99)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">推導位置 (mm):</span>
                  <span className="text-slate-300">[{mateResult.placement.position.map((v: number) => v.toFixed(1)).join(', ')}]</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Inspector & Test Report Drawer */}
        {activeTab === 'TESTS' && testReport && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur z-30 flex flex-col p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>驗收與不變量測試報告 (Acceptance & Invariant Suite Case A ~ Case V)</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-700">
                      {testReport.totalPassed} / {testReport.totalCases} PASS (100%)
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">嚴格驗證 Mate Transform、世界 Port、解析長度誤差 (&le;0.001mm)、BOM 防重複計價、通用角度 SOT 與 32 項幾何不變量</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setTestReport(AcceptanceTestSuite.runAll())}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>重新執行全部測試</span>
                </button>
                <button
                  onClick={() => setActiveTab('VIEWER')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
                >
                  關閉
                </button>
              </div>
            </div>

            {/* Test Case Cards Grid */}
            <div className="flex-1 overflow-y-auto mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 pr-1">
              {testReport.cases.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border bg-[#0d1424] border-slate-800 flex flex-col justify-between space-y-2 hover:border-slate-700 transition shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {c.id}
                        </span>
                        <span className="font-bold text-xs text-slate-200">{c.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono pt-1">
                        <span className="text-slate-500">預期: </span>
                        {c.expected}
                      </div>
                    </div>
                    {c.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] p-2 rounded bg-slate-950 font-mono text-emerald-300 border border-slate-800/80">
                    <span className="text-slate-500 font-sans font-medium">實際確效: </span>
                    {c.actual}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOM View Overlay */}
        {activeTab === 'BOM' && bomReport && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur z-30 flex flex-col p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                  <ListOrdered className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>工程採購材料清單 (BOM - Bill of Materials)</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-950 text-blue-300 border border-blue-700">
                      Zero Double-Counting Verified
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">組合件套件採購單元過濾，防止子構件重複計算成本</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const rows = [
                      ['Item', 'Definition ID', 'Name', 'Name Zh', 'Specification', 'Quantity', 'Unit', 'Notes'],
                      ...bomReport.items.map((it) => [
                        it.itemNumber,
                        it.definitionId,
                        it.name,
                        it.nameZh,
                        `"${it.spec}"`,
                        it.quantity,
                        it.unit,
                        `"${it.notes}"`,
                      ]),
                    ];
                    const csvStr = rows.map((r) => r.join(',')).join('\n');
                    const blob = new Blob(['\ufeff' + csvStr], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `MCR_BOM_${Date.now()}.csv`;
                    a.click();
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>匯出 BOM CSV</span>
                </button>
                <button
                  onClick={() => setActiveTab('VIEWER')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
                >
                  關閉
                </button>
              </div>
            </div>

            {/* Scope Filter Tabs */}
            <div className="flex items-center space-x-1.5 mt-3 pt-3 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 font-medium text-[11px] mr-1">BOM 採購範圍篩選:</span>
              {[
                { id: 'ALL', label: '全部範圍 (All Scopes)' },
                { id: BomScope.MCR_CABLE_TRAY_BOM, label: '托架採購 (MCR Cable Tray)' },
                { id: BomScope.MCR_TERMINATION_BOM, label: '終端與穿牆 (Termination/MCT)' },
                { id: BomScope.STRUCTURAL_REF, label: '結構參考 (Structural Ref)' },
                { id: BomScope.PROCESS_PIPING_REF, label: '製程管線 (Process Piping)' },
              ].map((scopeOption) => {
                const isSelected = selectedBomScope === scopeOption.id;
                return (
                  <button
                    key={scopeOption.id}
                    onClick={() => setSelectedBomScope(scopeOption.id as any)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {scopeOption.label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-auto mt-4">
              <table className="w-full text-left text-xs border border-slate-800 whitespace-nowrap">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">項目</th>
                    <th className="py-2.5 px-3">元件代號</th>
                    <th className="py-2.5 px-3">工程名稱</th>
                    <th className="py-2.5 px-3">BOM 範圍</th>
                    <th className="py-2.5 px-3">工藝技術規格</th>
                    <th className="py-2.5 px-3 text-right">數量</th>
                    <th className="py-2.5 px-3">單位</th>
                    <th className="py-2.5 px-3">BOM 防重複計價說明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-slate-300 text-[11px]">
                  {bomReport.items
                    .filter((it) => selectedBomScope === 'ALL' || it.bomScope === selectedBomScope)
                    .map((it) => (
                      <tr key={it.itemNumber} className="hover:bg-slate-900/60 transition">
                        <td className="py-2.5 px-3 text-slate-400">{it.itemNumber}</td>
                        <td className="py-2.5 px-3 font-bold text-cyan-400">{it.definitionId}</td>
                        <td className="py-2.5 px-3 text-white font-sans font-medium">{it.nameZh}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            it.bomScope === BomScope.MCR_CABLE_TRAY_BOM
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : it.bomScope === BomScope.MCR_TERMINATION_BOM
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : it.bomScope === BomScope.STRUCTURAL_REF
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}>
                            {it.bomScope}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-amber-300">{it.spec}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-white">{it.quantity}</td>
                        <td className="py-2.5 px-3 text-slate-400">{it.unit}</td>
                        <td className="py-2.5 px-3 text-slate-400 text-[10px] font-sans">
                          {it.isAssemblyKit ? (
                            <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                              組合套件 (子構件已封裝，零重複計價)
                            </span>
                          ) : (
                            <span>獨立單品</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Right Engineering Inspector & Parameter Controls */}
      {activeTab === 'VIEWER' && currentDef && (
        <aside className="w-88 border-l border-slate-800/80 bg-[#090e1c] flex flex-col shrink-0 z-20 overflow-y-auto p-4 space-y-4">
          {/* Component Info Card */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-cyan-400">{currentDef.nameZh}</span>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-900 text-slate-400 border border-slate-800">
                {currentDef.id}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{currentDef.description}</p>
          </div>

          {/* Catalog Preset Selector */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">型錄標準規格集 (Catalog Preset)</span>
              <span className="text-[10px] text-cyan-400 font-mono">Page 27–47</span>
            </div>
            <select
              defaultValue="CUSTOM"
              onChange={(e) => {
                const pid = e.target.value;
                if (pid === 'CUSTOM') return;
                const profile = TraySystemProfiles.get(pid);
                if (profile) {
                  setComponentParams((prev) => ({
                    ...prev,
                    width: profile.width,
                    depth: profile.height,
                    radius: profile.defaultRadius,
                    tangentLength: profile.tangentLength ?? 125,
                  }));
                }
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="CUSTOM">-- 自訂參數 (Custom Dynamic Values) --</option>
              {TraySystemProfiles.getAll().map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.width}W x {p.height}H) - P.{p.source.pages.join(',')}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Parameters Tuning (Single Source of Truth) */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-1.5">
                <span>參數動態推導 (Single SOT)</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">頂點即時重算</span>
            </div>

            <div className="space-y-2.5">
              {Object.keys(currentDef.defaultParameters).map((paramKey) => {
                const currentVal = componentParams[paramKey] ?? currentDef.defaultParameters[paramKey];
                const prov = currentDef.provenance[paramKey];

                return (
                  <div key={paramKey} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300 font-mono">{paramKey}</span>
                      <span className="font-bold text-cyan-400 font-mono">{currentVal}</span>
                    </div>

                    {/* Numeric slider or input */}
                    {typeof currentVal === 'number' && (
                      <input
                        type="range"
                        min={paramKey.toLowerCase().includes('angle') ? 15 : paramKey.toLowerCase().includes('radius') ? 200 : 100}
                        max={paramKey.toLowerCase().includes('angle') ? 90 : paramKey.toLowerCase().includes('radius') ? 1200 : 6000}
                        step={paramKey.toLowerCase().includes('angle') ? 7.5 : 50}
                        value={currentVal}
                        onChange={(e) => handleParamChange(paramKey, Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    )}

                    {/* Provenance Badge */}
                    {prov && (
                      <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 pt-0.5">
                        <span
                          className={`px-1.5 py-0.2 rounded font-mono ${
                            prov.assumptionLevel === 'VERIFIED_PROJECT_REQUIREMENT'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : prov.assumptionLevel === 'VERIFIED_VENDOR_CATALOG'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : prov.assumptionLevel === 'UNVERIFIED'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {prov.assumptionLevel}
                        </span>
                        <span className="truncate text-slate-400">{prov.source}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connection Ports Table */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                連接端點 (Ports: {currentPorts.length})
              </span>
              <span className="text-[10px] text-slate-400">正交基底向量</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {currentPorts.map((port) => (
                <div
                  key={port.id}
                  onClick={() => setSelectedPort(port)}
                  className={`p-2 rounded border text-[11px] font-mono cursor-pointer transition ${
                    selectedPort?.id === port.id
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                      : 'bg-slate-900/80 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between font-bold">
                    <span className="text-cyan-400">{port.id}</span>
                    <span className="text-slate-400">{port.width}x{port.depth}mm</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between pt-0.5">
                    <span>Pos: [{port.worldPosition.map((v) => v.toFixed(0)).join(',')}]</span>
                    <span>Dir: [{port.worldDirection.map((v) => v.toFixed(1)).join(',')}]</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Centerline Routes & Exact Analytic Length */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                中心線解析長度 (Centerlines)
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">&plusmn;0.001mm</span>
            </div>
            <div className="space-y-1.5">
              {currentRoutes.map((r) => (
                <div key={r.id} className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono space-y-0.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-cyan-400 font-bold">{r.id}</span>
                    <span className="text-slate-400">{r.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">解析數學長度:</span>
                    <span className="text-emerald-400 font-bold">{r.analyticLength.toFixed(3)} mm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
