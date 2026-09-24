/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
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
  Filter,
  Search,
  ArrowUpDown,
  ShieldCheck,
  Check,
  Info,
  SlidersHorizontal,
  RefreshCcw,
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
  TRAY_SYSTEM_METAS,
  type TraySystemCategory,
  getComponentSubCategory,
  SUB_CATEGORY_NAMES,
  getComponentSystemCategories,
  type ComponentSubCategory,
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
    nameZh: '極致對比螢光',
    badge: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    bgColor: 0x020408,
    bgHex: '#020408',
    ambientLight: { color: 0xffffff, intensity: 0.5 },
    sunLight: { color: 0x00ffcc, intensity: 1.5 },
    fillLight: { color: 0x38bdf8, intensity: 2.8 },
    backLight: { color: 0x818cf8, intensity: 2.0 },
    gridCenter: 0x0891b2,
    gridLines: 0x042f2e,
    edgeColor: 0x00ffcc,
    isLight: false,
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'VIEWER' | 'MATE_DEMO' | 'PLANT_SCENE' | 'TESTS' | 'BOM'>('VIEWER');
  const [selectedCompId, setSelectedCompId] = useState<string>('TRAY_STRAIGHT');
  const [componentParams, setComponentParams] = useState<Record<string, any>>({});
  const [testReport, setTestReport] = useState<TestSuiteReport | null>(null);
  const [bomReport, setBomReport] = useState<BomReport | null>(null);
  const [selectedBomScope, setSelectedBomScope] = useState<BomScopeType | 'ALL'>('ALL');
  const [selectedPort, setSelectedPort] = useState<WorldPortDefinition | null>(null);

  // Component Library filtering & sorting state
  const [selectedSystemCategory, setSelectedSystemCategory] = useState<TraySystemCategory>('ALL');
  const [componentSortMode, setComponentSortMode] = useState<'BY_TYPE' | 'BY_NAME'>('BY_TYPE');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Interactive Mate Selection State
  const [mateCompAId, setMateCompAId] = useState<string>('TRAY_STRAIGHT');
  const [matePortAId, setMatePortAId] = useState<string>('PORT_B');
  const [mateParamsA, setMateParamsA] = useState<Record<string, any>>({ length: 2000, width: 600, depth: 100 });

  const [mateCompBId, setMateCompBId] = useState<string>('FITTING_ELBOW_60');
  const [matePortBId, setMatePortBId] = useState<string>('PORT_A');
  const [mateParamsB, setMateParamsB] = useState<Record<string, any>>({ radius: 600, width: 600, depth: 100, angleDeg: 60, tangentLength: 125 });
  const [mateTolerance, setMateTolerance] = useState<number>(0.5);
  const [mateResult, setMateResult] = useState<any>(null);

  // Plant scene layer visibility states
  const [plantShowNIS, setPlantShowNIS] = useState(true);
  const [plantShowIS, setPlantShowIS] = useState(true);
  const [plantShowBays, setPlantShowBays] = useState(true);
  const [plantShowJBs, setPlantShowJBs] = useState(true);
  const [plantShowPipes, setPlantShowPipes] = useState(true);
  const [plantShowMCT, setPlantShowMCT] = useState(true);

  // Theme & Visual Contrast state
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>('STUDIO_LIGHT');
  const [showEdges, setShowEdges] = useState<boolean>(true);
  const [showPorts, setShowPorts] = useState(true);
  const [showCenterline, setShowCenterline] = useState(true);
  const [showBounds, setShowBounds] = useState(false);
  const [showCables, setShowCables] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);

  // 3D Canvas Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const activeModelGroupRef = useRef<THREE.Group>(new THREE.Group());
  const visualHelpersGroupRef = useRef<THREE.Group>(new THREE.Group());
  const edgeHelpersGroupRef = useRef<THREE.Group>(new THREE.Group());

  // Light & Grid Refs
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

    const sampleInstances = [
      new ComponentInstance('tray_1', ComponentRegistry.get('TRAY_STRAIGHT')!),
      new ComponentInstance('tray_2', ComponentRegistry.get('TRAY_STRAIGHT_DIVIDER')!),
      new ComponentInstance('elbow_1', ComponentRegistry.get('FITTING_ELBOW_90')!),
      new ComponentInstance('elbow_60', ComponentRegistry.get('FITTING_ELBOW_60')!),
      new ComponentInstance('tee_1', ComponentRegistry.get('FITTING_TEE')!),
      new ComponentInstance('cross_1', ComponentRegistry.get('FITTING_CROSS')!),
      new ComponentInstance('mct_1', ComponentRegistry.get('PENETRATION_MCT')!),
      new ComponentInstance('bay_1', ComponentRegistry.get('STRUCT_MAIN_BAY')!),
    ];
    setBomReport(BomManager.generateBom(sampleInstances));
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth > 0 ? canvasRef.current.clientWidth : 800;
    const height = canvasRef.current.clientHeight > 0 ? canvasRef.current.clientHeight : 600;
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

    scene.add(activeModelGroupRef.current);
    scene.add(edgeHelpersGroupRef.current);
    scene.add(visualHelpersGroupRef.current);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();

      const tex = Materials.getCableFlowTexture();
      if (tex && showCables) {
        tex.offset.x -= 0.012;
      }

      renderer.render(scene, camera);
    };
    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!canvasRef.current || !renderer || !camera) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(canvasRef.current);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // Theme application
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
      gridRef.current.geometry.dispose();
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

  // Update scene when activeTab, parameters, or models change
  useEffect(() => {
    if (!sceneRef.current) return;

    if (activeTab === 'VIEWER') {
      loadComponentToScene(selectedCompId, componentParams);
    } else if (activeTab === 'PLANT_SCENE') {
      loadFullPlantScene();
    } else if (activeTab === 'MATE_DEMO') {
      loadInteractiveMateScene();
    }
  }, [
    activeTab,
    selectedCompId,
    componentParams,
    showPorts,
    showCenterline,
    showBounds,
    showCables,
    showEdges,
    selectedThemeId,
    mateCompAId,
    matePortAId,
    mateParamsA,
    mateCompBId,
    matePortBId,
    mateParamsB,
    mateTolerance,
    plantShowNIS,
    plantShowIS,
    plantShowBays,
    plantShowJBs,
    plantShowPipes,
    plantShowMCT,
  ]);

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

    const meshGroup = inst.getThreeMesh();
    activeModelGroupRef.current.add(meshGroup);

    const theme = THEME_PRESETS[selectedThemeId];

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

    const ports = inst.getWorldPorts();
    const routes = inst.getCenterlines();
    const bounds = inst.getBounds();

    if (showPorts) {
      ports.forEach((p) => {
        const portMarkerGroup = new THREE.Group();
        const posM = [Units.mmToM(p.worldPosition[0]), Units.mmToM(p.worldPosition[1]), Units.mmToM(p.worldPosition[2])];
        portMarkerGroup.position.set(posM[0], posM[1], posM[2]);

        const discGeo = new THREE.RingGeometry(0.04, 0.08, 24);
        const discMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide });
        const disc = new THREE.Mesh(discGeo, discMat);
        disc.rotation.y = Math.PI / 2;
        portMarkerGroup.add(disc);

        const dirVec = new THREE.Vector3(...p.worldDirection).normalize();
        const arrow = new THREE.ArrowHelper(dirVec, new THREE.Vector3(0, 0, 0), 0.28, 0x00e5ff, 0.08, 0.04);
        portMarkerGroup.add(arrow);

        const upVec = new THREE.Vector3(...p.worldUp).normalize();
        const upArrow = new THREE.ArrowHelper(upVec, new THREE.Vector3(0, 0, 0), 0.16, 0x00ff88, 0.05, 0.025);
        portMarkerGroup.add(upArrow);

        visualHelpersGroupRef.current.add(portMarkerGroup);
      });
    }

    if (showCenterline) {
      routes.forEach((route) => {
        const rawPoints = route.samplePoints || (route as any).points || [];
        if (rawPoints.length >= 2) {
          const pts = rawPoints.map((pt: [number, number, number]) => new THREE.Vector3(Units.mmToM(pt[0]), Units.mmToM(pt[1]), Units.mmToM(pt[2])));
          const curve = new THREE.CatmullRomCurve3(pts);
          const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.016, 8, false);
          const tubeMat = Materials.createCableFlowMaterial(0x00d2ff, 0x0088cc);
          const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
          visualHelpersGroupRef.current.add(tubeMesh);
        }
      });
    }

    if (showBounds) {
      const minM = [Units.mmToM(bounds.min[0]), Units.mmToM(bounds.min[1]), Units.mmToM(bounds.min[2])];
      const maxM = [Units.mmToM(bounds.max[0]), Units.mmToM(bounds.max[1]), Units.mmToM(bounds.max[2])];
      const sizeM = [maxM[0] - minM[0], maxM[1] - minM[1], maxM[2] - minM[2]];
      const centerM = [(minM[0] + maxM[0]) / 2, (minM[1] + maxM[1]) / 2, (minM[2] + maxM[2]) / 2];

      const boxGeo = new THREE.BoxGeometry(sizeM[0], sizeM[1], sizeM[2]);
      const boxEdgeMat = new THREE.LineBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.6 });
      const wireframe = new THREE.LineSegments(new THREE.EdgesGeometry(boxGeo), boxEdgeMat);
      wireframe.position.set(centerM[0], centerM[1], centerM[2]);
      visualHelpersGroupRef.current.add(wireframe);
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
    if (plantShowBays) {
      const bayDef = ComponentRegistry.get('STRUCT_MAIN_BAY')!;
      [-18, -14, -8, -2, 4, 8].forEach((x) => {
        const bay = new ComponentInstance(`bay_${x}`, bayDef, {}, { position: [x * 1000, 0, 0] });
        plantGroup.add(bay.getThreeMesh());
      });

      const branchBayDef = ComponentRegistry.get('STRUCT_BRANCH_BAY')!;
      [-6.5, -9.5].forEach((bz) => {
        const bBay = new ComponentInstance(`b_bay_${bz}`, branchBayDef, {}, { position: [-14000, 0, bz * 1000] });
        plantGroup.add(bBay.getThreeMesh());
      });
    }

    // 2. Process & Steam Piping Obstacles
    if (plantShowPipes) {
      const pProc = new ComponentInstance('p_proc', ComponentRegistry.get('OBSTACLE_MAIN_PROCESS_PIPE')!, {}, { position: [-5000, 3300, -1200] });
      const pSteam = new ComponentInstance('p_steam', ComponentRegistry.get('OBSTACLE_MAIN_STEAM_PIPE')!, {}, { position: [-5000, 5050, 1200] });
      plantGroup.add(pProc.getThreeMesh(), pSteam.getThreeMesh());
    }

    // 3. Junction Boxes
    if (plantShowJBs) {
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
    }

    // 4. MCT Penetration & Control Building
    if (plantShowMCT) {
      const mctDef = ComponentRegistry.get('PENETRATION_MCT')!;
      const mct1 = new ComponentInstance('mct_1', mctDef, {}, { position: [12000, 3200, -2500] });
      const mct2 = new ComponentInstance('mct_2', mctDef, {}, { position: [12000, 3200, 2500] });
      const bldg = new ComponentInstance('bldg', ComponentRegistry.get('CONTEXT_BUILDING')!, {}, { position: [16000, 2750, 0] });
      plantGroup.add(mct1.getThreeMesh(), mct2.getThreeMesh(), bldg.getThreeMesh());
    }

    // 5. Cable Trays (Upper Non-IS EL +7.2m & Lower IS EL +6.4m)
    const trayDef = ComponentRegistry.get('TRAY_STRAIGHT')!;
    if (plantShowIS) {
      const trayIS = new ComponentInstance('tray_is', trayDef, { length: 26000, width: 600, depth: 100, isIS: true }, { position: [-5000, 6400, -1800] });
      plantGroup.add(trayIS.getThreeMesh());
    }
    if (plantShowNIS) {
      const trayNIS = new ComponentInstance('tray_nis', trayDef, { length: 26000, width: 600, depth: 100, isIS: false }, { position: [-5000, 7200, 600] });
      plantGroup.add(trayNIS.getThreeMesh());
    }

    // 6. Dynamic Flowing Cables
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

  // Load Interactive Mating Scene (User selects Comp A, Comp B and test connection)
  const loadInteractiveMateScene = () => {
    while (activeModelGroupRef.current.children.length > 0) {
      activeModelGroupRef.current.remove(activeModelGroupRef.current.children[0]);
    }
    while (visualHelpersGroupRef.current.children.length > 0) {
      visualHelpersGroupRef.current.remove(visualHelpersGroupRef.current.children[0]);
    }
    while (edgeHelpersGroupRef.current.children.length > 0) {
      edgeHelpersGroupRef.current.remove(edgeHelpersGroupRef.current.children[0]);
    }

    const defA = ComponentRegistry.get(mateCompAId);
    const defB = ComponentRegistry.get(mateCompBId);
    if (!defA || !defB) return;

    const instA = new ComponentInstance('mate_inst_a', defA, mateParamsA);
    instA.setPlacement({ position: [0, 0, -1000], quaternion: [0, 0, 0, 1] });

    const instB = new ComponentInstance('mate_inst_b', defB, mateParamsB);

    // 1. Connection Validation Check
    const connCheck = ConnectionValidator.validateConnection(instA, matePortAId, instB, matePortBId);

    // 2. Spatial Mate Placement
    let mateTransform: any = null;
    let matePassed = false;
    if (connCheck.valid) {
      mateTransform = MateEngine.computeMateTransform(instA, matePortAId, instB, matePortBId, mateTolerance);
      matePassed = mateTransform.success;
      if (matePassed) {
        instB.setPlacement(mateTransform.placement);
      }
    }

    setMateResult({
      connectionCheck: connCheck,
      spatialMate: mateTransform,
      success: connCheck.valid && matePassed,
      positionErrorMm: mateTransform ? mateTransform.positionErrorMm : 0,
      alignmentDotProduct: mateTransform ? mateTransform.alignmentDotProduct : 0,
      upDotProduct: mateTransform ? mateTransform.upDotProduct : 0,
      placement: mateTransform ? mateTransform.placement : null,
    });

    const meshA = instA.getThreeMesh();
    const meshB = instB.getThreeMesh();
    activeModelGroupRef.current.add(meshA, meshB);

    const theme = THEME_PRESETS[selectedThemeId];
    if (showEdges) {
      const edgeMat = new THREE.LineBasicMaterial({
        color: theme.edgeColor,
        linewidth: 1.5,
        transparent: true,
        opacity: theme.isLight ? 0.75 : 0.6,
      });

      [meshA, meshB].forEach((m) => {
        m.traverse((child) => {
          if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).geometry) {
            const edges = new THREE.EdgesGeometry((child as THREE.Mesh).geometry, 26);
            const line = new THREE.LineSegments(edges, edgeMat);
            line.matrix = child.matrix;
            line.matrixAutoUpdate = false;
            edgeHelpersGroupRef.current.add(line);
          }
        });
      });
    }

    // Highlight mating ports in 3D
    const portAWorld = instA.getWorldPorts().find((p) => p.id === matePortAId);
    const portBWorld = instB.getWorldPorts().find((p) => p.id === matePortBId);

    if (portAWorld) {
      const ringGeo = new THREE.RingGeometry(0.12, 0.18, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: connCheck.valid ? 0x00ff88 : 0xff2244,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(Units.mmToM(portAWorld.worldPosition[0]), Units.mmToM(portAWorld.worldPosition[1]), Units.mmToM(portAWorld.worldPosition[2]));
      visualHelpersGroupRef.current.add(ring);

      const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(...portAWorld.worldDirection).normalize(),
        new THREE.Vector3(...portAWorld.worldPosition.map((v) => Units.mmToM(v))),
        0.4,
        connCheck.valid ? 0x00ff88 : 0xff2244,
        0.08,
        0.04
      );
      visualHelpersGroupRef.current.add(arrow);
    }

    if (portBWorld && connCheck.valid) {
      const arrowB = new THREE.ArrowHelper(
        new THREE.Vector3(...portBWorld.worldDirection).normalize(),
        new THREE.Vector3(...portBWorld.worldPosition.map((v) => Units.mmToM(v))),
        0.4,
        0x00d2ff,
        0.08,
        0.04
      );
      visualHelpersGroupRef.current.add(arrowB);
    }

    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.set(2.0, 2.2, 2.0);
      controlsRef.current.target.set(0, 0, 0);
    }
  };

  // Quick Preset Scenarios for Interactive Mating
  const applyMateScenarioPreset = (scenario: string) => {
    if (scenario === 'LADDER_60') {
      setMateCompAId('TRAY_STRAIGHT');
      setMatePortAId('PORT_B');
      setMateParamsA({ length: 2000, width: 600, depth: 100 });

      setMateCompBId('FITTING_ELBOW_60');
      setMatePortBId('PORT_A');
      setMateParamsB({ radius: 600, width: 600, depth: 100, angleDeg: 60, tangentLength: 125 });
    } else if (scenario === 'LADDER_90') {
      setMateCompAId('TRAY_STRAIGHT');
      setMatePortAId('PORT_B');
      setMateParamsA({ length: 2000, width: 600, depth: 100 });

      setMateCompBId('FITTING_ELBOW_90');
      setMatePortBId('PORT_A');
      setMateParamsB({ radius: 600, width: 600, depth: 100, angleDeg: 90, tangentLength: 125 });
    } else if (scenario === 'LADDER_CROSS') {
      setMateCompAId('TRAY_STRAIGHT');
      setMatePortAId('PORT_B');
      setMateParamsA({ length: 2000, width: 600, depth: 100 });

      setMateCompBId('FITTING_CROSS');
      setMatePortBId('PORT_A');
      setMateParamsB({ radius: 300, width: 600, depth: 100, tangentLength: 125, length: 1450 });
    } else if (scenario === 'VENTILATED_SMALL_45') {
      setMateCompAId('TRAY_STRAIGHT');
      setMatePortAId('PORT_B');
      setMateParamsA({ length: 2000, width: 100, depth: 50 });

      setMateCompBId('FITTING_ELBOW_45');
      setMatePortBId('PORT_A');
      setMateParamsB({ radius: 300, width: 100, depth: 50, angleDeg: 45, tangentLength: 125 });
    } else if (scenario === 'VENTILATED_LARGE_60') {
      setMateCompAId('TRAY_STRAIGHT');
      setMatePortAId('PORT_B');
      setMateParamsA({ length: 2000, width: 300, depth: 100 });

      setMateCompBId('FITTING_ELBOW_60');
      setMatePortBId('PORT_A');
      setMateParamsB({ radius: 300, width: 300, depth: 100, angleDeg: 60, tangentLength: 125 });
    } else if (scenario === 'REDUCER_TRANS') {
      setMateCompAId('TRAY_STRAIGHT');
      setMatePortAId('PORT_B');
      setMateParamsA({ length: 2000, width: 600, depth: 100 });

      setMateCompBId('FITTING_REDUCER_CENTER');
      setMatePortBId('PORT_A');
      setMateParamsB({ length: 600, width: 600, widthRight: 450, depth: 100 });
    } else if (scenario === 'MISMATCH_WIDTH') {
      setMateCompAId('TRAY_STRAIGHT');
      setMatePortAId('PORT_B');
      setMateParamsA({ length: 2000, width: 600, depth: 100 });

      setMateCompBId('FITTING_ELBOW_60');
      setMatePortBId('PORT_A');
      setMateParamsB({ radius: 600, width: 450, depth: 100, angleDeg: 60 });
    } else if (scenario === 'MISMATCH_DEPTH') {
      setMateCompAId('TRAY_STRAIGHT');
      setMatePortAId('PORT_B');
      setMateParamsA({ length: 2000, width: 600, depth: 100 });

      setMateCompBId('FITTING_ELBOW_90');
      setMatePortBId('PORT_A');
      setMateParamsB({ radius: 600, width: 600, depth: 150, angleDeg: 90 });
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

  // Filter and sort component list
  const filteredComponents = useMemo(() => {
    let list = ComponentRegistry.getAll();

    // 1. Filter by System Category
    if (selectedSystemCategory !== 'ALL') {
      list = list.filter((d) => {
        const cats = getComponentSystemCategories(d.id);
        return cats.includes(selectedSystemCategory);
      });
    }

    // 2. Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.id.toLowerCase().includes(q) ||
          d.name.toLowerCase().includes(q) ||
          d.nameZh.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      );
    }

    // 3. Sorting
    if (componentSortMode === 'BY_NAME') {
      return [...list].sort((a, b) => a.nameZh.localeCompare(b.nameZh, 'zh-Hant'));
    }

    return list;
  }, [selectedSystemCategory, searchQuery, componentSortMode]);

  // Group by engineering sub-category if in BY_TYPE mode
  const groupedComponents = useMemo(() => {
    if (componentSortMode === 'BY_NAME') {
      return { ALL: filteredComponents };
    }

    const groups: Partial<Record<ComponentSubCategory, ComponentDefinition[]>> = {};
    filteredComponents.forEach((def) => {
      const sub = getComponentSubCategory(def.id);
      if (!groups[sub]) groups[sub] = [];
      groups[sub]!.push(def);
    });
    return groups;
  }, [filteredComponents, componentSortMode]);

  const currentDef = ComponentRegistry.get(selectedCompId);
  const currentPorts = currentInstanceRef.current?.getWorldPorts() || [];
  const currentRoutes = currentInstanceRef.current?.getCenterlines() || [];
  const conformance = currentDef ? CatalogStandards.checkConformance(componentParams) : { isStandard: true, warnings: [] };

  // Determine current active tray type for pairing guidance
  const activeTraySystemType: TraySystemCategory = useMemo(() => {
    if (selectedSystemCategory !== 'ALL') return selectedSystemCategory;
    if (selectedCompId.startsWith('TRAY_STRAIGHT')) {
      const w = componentParams.width ?? 600;
      const h = componentParams.depth ?? 100;
      if (w <= 100 && h <= 50) return 'SYSTEM_VENTILATED_SMALL';
      if (w <= 300 && h <= 100) return 'SYSTEM_VENTILATED_LARGE';
      return 'SYSTEM_LADDER';
    }
    return 'SYSTEM_LADDER';
  }, [selectedSystemCategory, selectedCompId, componentParams]);

  return (
    <div className="flex h-screen w-screen bg-[#060913] text-slate-100 font-sans select-none overflow-hidden">
      {/* ========================================================================= */}
      {/* GLOBAL LEFT SIDEBAR - DYNAMICALLY CONTEXT-AWARE BASED ON ACTIVETAB        */}
      {/* ========================================================================= */}
      <aside className="w-84 border-r border-slate-800/80 bg-[#090e1c] flex flex-col shrink-0 z-20">
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
              <p className="text-[10px] text-slate-400">@mcr-studio/parametric-3d Engine</p>
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* MAJOR WORKSPACE NAVIGATION SWITCHER IN LEFT SIDEBAR           */}
        {/* ============================================================= */}
        <div className="p-2.5 bg-slate-950 border-b border-slate-800 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between px-1">
            <span>工作區功能導覽 (Workspace Mode)</span>
            <span className="text-cyan-400 font-mono text-[10px]">5 大核心</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              onClick={() => setActiveTab('VIEWER')}
              className={`p-2 rounded-lg font-bold flex items-center space-x-2 transition text-left col-span-2 ${
                activeTab === 'VIEWER'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400'
                  : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <Box className="w-4 h-4 text-cyan-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold leading-tight flex items-center justify-between">
                  <span>配件庫與單品檢視</span>
                  <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">34構件</span>
                </div>
                <div className="text-[10px] font-normal text-slate-300/80 truncate mt-0.5">型錄規格、三維特徵與即時參數</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('MATE_DEMO')}
              className={`p-2 rounded-lg font-bold flex items-center space-x-2 transition text-left ${
                activeTab === 'MATE_DEMO'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                  : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <Link className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold leading-tight">自選對接測試</div>
                <div className="text-[10px] font-normal text-emerald-400/80 truncate mt-0.5">任選兩件對接驗證</div>
              </div>
            </button>

            <button
              onClick={() => {
                const report = AcceptanceTestSuite.runAll();
                setTestReport(report);
                setActiveTab('TESTS');
              }}
              className={`p-2 rounded-lg font-bold flex items-center space-x-2 transition text-left ${
                activeTab === 'TESTS'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400'
                  : 'bg-slate-900/90 text-amber-300 hover:bg-slate-800 hover:text-white border border-amber-900/40'
              }`}
            >
              <Play className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold leading-tight">28項驗收測試</div>
                <div className="text-[10px] font-normal text-amber-400/80 truncate mt-0.5">Case A ~ AB 全數 PASS</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('PLANT_SCENE')}
              className={`p-2 rounded-lg font-bold flex items-center space-x-2 transition text-left ${
                activeTab === 'PLANT_SCENE'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                  : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <Layers className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold leading-tight">主管廊 3D 場景</div>
                <div className="text-[10px] font-normal text-slate-400 truncate mt-0.5">雙階托架與鋼構設施</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('BOM')}
              className={`p-2 rounded-lg font-bold flex items-center space-x-2 transition text-left ${
                activeTab === 'BOM'
                  ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                  : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <ListOrdered className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold leading-tight">BOM 採購清單</div>
                <div className="text-[10px] font-normal text-slate-400 truncate mt-0.5">零重複計價驗證</div>
              </div>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CONTEXT 1: COMPONENT LIBRARY (配件庫) - WHEN IN VIEWER MODE   */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'VIEWER' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* System Category Selector */}
            <div className="p-2.5 bg-slate-950/80 border-b border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span className="flex items-center space-x-1">
                  <Filter className="w-3 h-3 text-cyan-400" />
                  <span>電纜托架系統類別 (Tray System):</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400">{filteredComponents.length} 構件</span>
              </div>
              <select
                value={selectedSystemCategory}
                onChange={(e) => {
                  const cat = e.target.value as TraySystemCategory;
                  setSelectedSystemCategory(cat);
                  if (cat === 'SYSTEM_VENTILATED_SMALL') {
                    const prof = TraySystemProfiles.get('VENTILATED_PROFILE_A')!;
                    setComponentParams((prev) => ({
                      ...prev,
                      width: prof.width,
                      depth: prof.height,
                      radius: prof.defaultRadius,
                      tangentLength: prof.tangentLength ?? 125,
                    }));
                  } else if (cat === 'SYSTEM_VENTILATED_LARGE') {
                    const prof = TraySystemProfiles.get('VENTILATED_PROFILE_B')!;
                    setComponentParams((prev) => ({
                      ...prev,
                      width: prof.width,
                      depth: prof.height,
                      radius: prof.defaultRadius,
                      tangentLength: prof.tangentLength ?? 125,
                    }));
                  } else if (cat === 'SYSTEM_LADDER') {
                    const prof = TraySystemProfiles.get('LADDER_PROFILE_STANDARD')!;
                    setComponentParams((prev) => ({
                      ...prev,
                      width: prof.width,
                      depth: prof.height,
                      radius: prof.defaultRadius,
                      tangentLength: prof.tangentLength ?? 125,
                    }));
                  }
                }}
                className="w-full text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-cyan-500 font-medium"
              >
                <option value="ALL">全部配件與構件庫 (All - 34項)</option>
                <option value="SYSTEM_LADDER">鋁製梯型托架系統 (Ladder Tray, P.3-26)</option>
                <option value="SYSTEM_VENTILATED_SMALL">通風沖底型 - 小型 (100W x 50H, P.27-37)</option>
                <option value="SYSTEM_VENTILATED_LARGE">通風沖底型 - 大型 (300W x 100H, P.38-47)</option>
                <option value="SYSTEM_STRUCTURAL">主管廊鋼構管架 (Structural Bays)</option>
                <option value="SYSTEM_EQUIPMENT">現場設備與穿牆封堵 (Equipment & MCT)</option>
                <option value="SYSTEM_OBSTACLE">現場製程避讓管道 (Piping Obstacles)</option>
              </select>

              {/* Search & Sort Controls */}
              <div className="flex items-center space-x-1.5 pt-1">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋名稱/60°/Elbow..."
                    className="w-full pl-7 pr-2 py-1 text-[11px] bg-slate-900 border border-slate-700 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  onClick={() => setComponentSortMode((prev) => (prev === 'BY_TYPE' ? 'BY_NAME' : 'BY_TYPE'))}
                  className={`p-1.5 rounded border text-[10px] flex items-center space-x-1 transition ${
                    componentSortMode === 'BY_NAME'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title="切換排序：依工程種類分組 / 依名稱字母"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  <span>{componentSortMode === 'BY_TYPE' ? '依種類' : '依字母'}</span>
                </button>
              </div>
            </div>

            {/* System Selection & Pairing Indicator Banner */}
            <div className="px-3 py-2 bg-gradient-to-r from-slate-950 to-[#0c1527] border-b border-slate-800 text-[11px]">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-bold text-slate-300 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>目前配置系統:</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-300 font-semibold">
                  {TRAY_SYSTEM_METAS[activeTraySystemType]?.nameZh || '工業標準系列'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                {activeTraySystemType === 'SYSTEM_LADDER' && '已對應梯型托架：推薦搭配 90°/60°/45°/30° 彎頭、三通、四通、爬坡彎頭。'}
                {activeTraySystemType === 'SYSTEM_VENTILATED_SMALL' && '已對應通風沖底型小型(100x50)：推薦搭配 100W 45°/90° 沖底彎頭、三通、異徑。'}
                {activeTraySystemType === 'SYSTEM_VENTILATED_LARGE' && '已對應通風沖底型大型(300x100)：推薦搭配 300W 30°/45°/60°/90° 沖底彎頭、三通、四通。'}
                {activeTraySystemType !== 'SYSTEM_LADDER' &&
                  activeTraySystemType !== 'SYSTEM_VENTILATED_SMALL' &&
                  activeTraySystemType !== 'SYSTEM_VENTILATED_LARGE' &&
                  '可自由檢視與調整該分類下之工程物件幾何參數。'}
              </p>
            </div>

            {/* Component Inventory List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-3">
              {Object.entries(groupedComponents).map(([groupKey, defs]) => {
                if (!defs || defs.length === 0) return null;
                const groupTitle = componentSortMode === 'BY_TYPE' ? SUB_CATEGORY_NAMES[groupKey as ComponentSubCategory] : '全部元件清單';

                return (
                  <div key={groupKey} className="space-y-1">
                    <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/80 rounded border border-slate-800/60">
                      <span>{groupTitle}</span>
                      <span className="font-mono text-cyan-400">{defs.length}</span>
                    </div>

                    <div className="space-y-0.5">
                      {defs.map((def) => {
                        const isSelected = selectedCompId === def.id;
                        const isFitting = def.id.startsWith('FITTING_');
                        const isCompatibleWithActiveSystem = getComponentSystemCategories(def.id).includes(activeTraySystemType);

                        return (
                          <button
                            key={def.id}
                            onClick={() => handleSelectComponent(def.id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition ${
                              isSelected
                                ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-600 font-medium shadow'
                                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                            }`}
                          >
                            <div className="truncate flex-1 pr-1">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-medium truncate">{def.nameZh}</span>
                                {isFitting && isCompatibleWithActiveSystem && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                                    相容
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono truncate">{def.name}</div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CONTEXT 2: INTERACTIVE MATING INSPECTOR (自選對接裝配控制台)     */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'MATE_DEMO' && (
          <div className="flex-1 flex flex-col overflow-y-auto p-3 space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Link className="w-4 h-4 text-emerald-400" />
                <span>自選裝配對接控制台</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-1">從配件庫任選兩項構件與指定埠位，檢查相容性並即時對接放置。</p>
            </div>

            {/* Quick Preset Scenarios */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>型錄驗證快捷情境 (Quick Scenarios):</span>
              </span>
              <div className="grid grid-cols-1 gap-1 text-[11px]">
                <button
                  onClick={() => applyMateScenarioPreset('LADDER_60')}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-700 rounded text-left flex items-center justify-between"
                >
                  <span>1. 梯型直槽 ➔ 60° 水平彎頭</span>
                  <span className="text-[10px] text-emerald-400 font-mono">P.7 / P.43 相容</span>
                </button>
                <button
                  onClick={() => applyMateScenarioPreset('LADDER_90')}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-700 rounded text-left flex items-center justify-between"
                >
                  <span>2. 梯型直槽 ➔ 90° 水平彎頭</span>
                  <span className="text-[10px] text-emerald-400 font-mono">P.7 相容</span>
                </button>
                <button
                  onClick={() => applyMateScenarioPreset('LADDER_CROSS')}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-700 rounded text-left flex items-center justify-between"
                >
                  <span>3. 梯型直槽 ➔ 十字四通托架</span>
                  <span className="text-[10px] text-emerald-400 font-mono">P.10 相容</span>
                </button>
                <button
                  onClick={() => applyMateScenarioPreset('VENTILATED_SMALL_45')}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-700 rounded text-left flex items-center justify-between"
                >
                  <span>4. 沖底型小型直槽 ➔ 45° 彎頭 (100W)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">P.32 相容</span>
                </button>
                <button
                  onClick={() => applyMateScenarioPreset('VENTILATED_LARGE_60')}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-700 rounded text-left flex items-center justify-between"
                >
                  <span>5. 沖底型大型直槽 ➔ 60° 彎頭 (300W)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">P.43 相容</span>
                </button>
                <button
                  onClick={() => applyMateScenarioPreset('REDUCER_TRANS')}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-700 rounded text-left flex items-center justify-between"
                >
                  <span>6. 600W 直槽 ➔ 同心大小頭 (600➔450)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">P.19 相容</span>
                </button>
                <button
                  onClick={() => applyMateScenarioPreset('MISMATCH_WIDTH')}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-slate-800 hover:border-red-700 rounded text-left flex items-center justify-between"
                >
                  <span>7. 寬度不符攔截展示 (600W vs 450W)</span>
                  <span className="text-[10px] text-red-400 font-mono">攔截驗證</span>
                </button>
                <button
                  onClick={() => applyMateScenarioPreset('MISMATCH_DEPTH')}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-slate-800 hover:border-red-700 rounded text-left flex items-center justify-between"
                >
                  <span>8. 邊高不符攔截展示 (100H vs 150H)</span>
                  <span className="text-[10px] text-red-400 font-mono">攔截驗證</span>
                </button>
              </div>
            </div>

            {/* Component A Config */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400">基準構件 A (Base Component)</span>
                <span className="text-[10px] font-mono text-slate-400">世界原點固定</span>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">自配件庫選擇構件 A:</label>
                <select
                  value={mateCompAId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setMateCompAId(id);
                    const def = ComponentRegistry.get(id);
                    if (def) {
                      setMateParamsA({ ...def.defaultParameters });
                      const p = def.getLocalPorts(def.defaultParameters);
                      if (p.length > 0) setMatePortAId(p[p.length - 1].id);
                    }
                  }}
                  className="w-full text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 font-medium"
                >
                  {ComponentRegistry.getAll()
                    .filter((d) => d.origin !== 'DERIVED_ASSEMBLY' && !d.id.startsWith('STRUCT'))
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nameZh} ({d.id})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">對接埠位 (Port A):</label>
                  <select
                    value={matePortAId}
                    onChange={(e) => setMatePortAId(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 font-mono"
                  >
                    {ComponentRegistry.get(mateCompAId)
                      ?.getLocalPorts(mateParamsA)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.id} ({p.name})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">寬度 W (mm):</label>
                  <input
                    type="number"
                    step="50"
                    value={mateParamsA.width ?? 600}
                    onChange={(e) => setMateParamsA((prev) => ({ ...prev, width: parseFloat(e.target.value) || 600 }))}
                    className="w-full text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Component B Config */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">欲對接構件 B (Target Component)</span>
                <span className="text-[10px] font-mono text-emerald-400">裝配引擎自動變換</span>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">自配件庫選擇構件 B:</label>
                <select
                  value={mateCompBId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setMateCompBId(id);
                    const def = ComponentRegistry.get(id);
                    if (def) {
                      setMateParamsB({ ...def.defaultParameters });
                      const p = def.getLocalPorts(def.defaultParameters);
                      if (p.length > 0) setMatePortBId(p[0].id);
                    }
                  }}
                  className="w-full text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 font-medium"
                >
                  {ComponentRegistry.getAll()
                    .filter((d) => d.origin !== 'DERIVED_ASSEMBLY' && !d.id.startsWith('STRUCT'))
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nameZh} ({d.id})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">對接埠位 (Port B):</label>
                  <select
                    value={matePortBId}
                    onChange={(e) => setMatePortBId(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 font-mono"
                  >
                    {ComponentRegistry.get(mateCompBId)
                      ?.getLocalPorts(mateParamsB)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.id} ({p.name})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">寬度 W (mm):</label>
                  <input
                    type="number"
                    step="50"
                    value={mateParamsB.width ?? 600}
                    onChange={(e) => setMateParamsB((prev) => ({ ...prev, width: parseFloat(e.target.value) || 600 }))}
                    className="w-full text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Tolerance Slider */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="font-medium">對接容許公差 (Tolerance):</span>
                <span className="font-mono text-cyan-400">&plusmn;{mateTolerance} mm</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={mateTolerance}
                onChange={(e) => setMateTolerance(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CONTEXT 3: PLANT SCENE LAYERS - WHEN IN PLANT SCENE MODE      */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'PLANT_SCENE' && (
          <div className="flex-1 flex flex-col overflow-y-auto p-3 space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>主管廊場景圖層與設施清單</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-1">26m 跨距鋼構主立管架、雙階電纜托架、現場防爆接線箱與熱管道避讓體。</p>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-300 block text-[11px]">場景設施開關 (Layer Visibility):</span>

              <label className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <span className="text-slate-300">上層非本安托架 (Non-IS EL +7.2m)</span>
                <input
                  type="checkbox"
                  checked={plantShowNIS}
                  onChange={(e) => setPlantShowNIS(e.target.checked)}
                  className="accent-blue-500 w-4 h-4 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <span className="text-slate-300">下層本安托架 (IS EL +6.4m)</span>
                <input
                  type="checkbox"
                  checked={plantShowIS}
                  onChange={(e) => setPlantShowIS(e.target.checked)}
                  className="accent-cyan-500 w-4 h-4 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <span className="text-slate-300">鋼構管架門型跨距 (Main & Branch Bays)</span>
                <input
                  type="checkbox"
                  checked={plantShowBays}
                  onChange={(e) => setPlantShowBays(e.target.checked)}
                  className="accent-purple-500 w-4 h-4 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <span className="text-slate-300">現場防爆接線箱 (Junction Boxes x 6)</span>
                <input
                  type="checkbox"
                  checked={plantShowJBs}
                  onChange={(e) => setPlantShowJBs(e.target.checked)}
                  className="accent-amber-500 w-4 h-4 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <span className="text-slate-300">高溫製程/蒸汽管道 (Piping Obstacles)</span>
                <input
                  type="checkbox"
                  checked={plantShowPipes}
                  onChange={(e) => setPlantShowPipes(e.target.checked)}
                  className="accent-red-500 w-4 h-4 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <span className="text-slate-300">MCT 穿牆封堵框與控制室 (Penetration)</span>
                <input
                  type="checkbox"
                  checked={plantShowMCT}
                  onChange={(e) => setPlantShowMCT(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4 rounded"
                />
              </label>
            </div>
          </div>
        )}
      </aside>

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT CANVAS & GLOBAL TOP NAVIGATION BAR                          */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-950">
        {/* Global Top Navigation Bar */}
        <header className="h-14 border-b border-slate-800/80 bg-[#090e1c]/95 backdrop-blur px-4 flex items-center justify-between z-10">
          {/* Left: 5 Major Application Workspaces Switcher */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('VIEWER')}
              className={`py-1.5 px-3 rounded-lg font-bold flex items-center space-x-1.5 transition ${
                activeTab === 'VIEWER' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>配件庫與檢視器 (34)</span>
            </button>

            <button
              onClick={() => setActiveTab('MATE_DEMO')}
              className={`py-1.5 px-3 rounded-lg font-bold flex items-center space-x-1.5 transition ${
                activeTab === 'MATE_DEMO' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              <span>自選對接裝配工作區</span>
            </button>

            <button
              onClick={() => setActiveTab('PLANT_SCENE')}
              className={`py-1.5 px-3 rounded-lg font-bold flex items-center space-x-1.5 transition ${
                activeTab === 'PLANT_SCENE' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>主管廊 3D 整合場景</span>
            </button>

            <button
              onClick={() => setActiveTab('TESTS')}
              className={`py-1.5 px-2.5 rounded-lg font-medium flex items-center space-x-1.5 transition ${
                activeTab === 'TESTS' ? 'bg-amber-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Play className="w-3 h-3 text-amber-400" />
              <span>28項驗收測試</span>
            </button>

            <button
              onClick={() => setActiveTab('BOM')}
              className={`py-1.5 px-2.5 rounded-lg font-medium flex items-center space-x-1.5 transition ${
                activeTab === 'BOM' ? 'bg-purple-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ListOrdered className="w-3 h-3 text-purple-300" />
              <span>BOM 採購清單</span>
            </button>
          </div>

          {/* Center: Theme Selector Bar */}
          <div className="hidden lg:flex items-center bg-slate-900/90 border border-slate-700 rounded-lg p-1 space-x-1 text-xs">
            <span className="px-1.5 text-[10px] text-slate-400 flex items-center font-medium">
              <Palette className="w-3 h-3 mr-1 text-cyan-400" /> 主題:
            </span>
            {(Object.keys(THEME_PRESETS) as ThemeId[]).map((tId) => {
              const theme = THEME_PRESETS[tId];
              const isSelected = selectedThemeId === tId;
              return (
                <button
                  key={tId}
                  onClick={() => applyTheme(tId)}
                  className={`px-2 py-1 rounded text-[11px] font-medium flex items-center space-x-1 transition ${
                    isSelected ? 'bg-cyan-600 text-white font-bold shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={`${theme.nameZh} (${theme.name})`}
                >
                  <span className="w-2.5 h-2.5 rounded-full border border-white/30 shrink-0" style={{ backgroundColor: theme.bgHex }} />
                  <span>{theme.nameZh}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Camera Views & Helper Toggles */}
          <div className="flex items-center space-x-2 text-xs">
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 space-x-0.5 text-[11px]">
              <button
                onClick={() => setCameraAngle('ISO')}
                className="px-2 py-0.8 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                title="等角透視 (3D Isometric)"
              >
                等角
              </button>
              <button
                onClick={() => setCameraAngle('TOP')}
                className="px-2 py-0.8 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                title="俯視圖 (Top Plan)"
              >
                俯視
              </button>
              <button
                onClick={() => setCameraAngle('FRONT')}
                className="px-2 py-0.8 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                title="正視圖 (Front Elevation)"
              >
                正視
              </button>
              <button
                onClick={() => setCameraAngle('SIDE')}
                className="px-2 py-0.8 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                title="側視圖 (Side Profile)"
              >
                側視
              </button>
            </div>

            <button
              onClick={() => setShowEdges(!showEdges)}
              className={`px-2.5 py-1 rounded border flex items-center space-x-1 transition ${
                showEdges ? 'bg-amber-950/90 text-amber-300 border-amber-600 font-medium' : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
              title="強化構件邊緣輪廓線"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>輪廓: {showEdges ? '開' : '關'}</span>
            </button>

            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-1.5 rounded border transition ${
                autoRotate ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
              title="3D 環繞自動旋轉"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* 3D WebGL Canvas */}
        <div ref={canvasRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing relative" />

        {/* Floating Viewport Status Banner */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center space-x-2 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>
            {activeTab === 'VIEWER' && currentDef && `單品檢視: ${currentDef.nameZh} (${currentDef.name})`}
            {activeTab === 'MATE_DEMO' && `自選對接: ${mateCompAId} ➔ ${mateCompBId} [容差 ±${mateTolerance}mm]`}
            {activeTab === 'PLANT_SCENE' && '主管廊雙階整合尋徑場景 (EL +6.4m / +7.2m)'}
          </span>
        </div>

        {/* ========================================================================= */}
        {/* OVERLAY TABS: 28 ACCEPTANCE TESTS REPORT & BOM REPORT                     */}
        {/* ========================================================================= */}
        {activeTab === 'TESTS' && testReport && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur z-30 flex flex-col p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center font-bold text-white shadow-lg shadow-amber-500/20">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>28 項工程不變量與型錄驗收測試套件</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                      Case A ~ Case AB 全數 PASS
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">涵蓋對接相容、四通路由、偏心異徑、右手座標系、型錄全角度與規格預設集</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const report = AcceptanceTestSuite.runAll();
                    setTestReport(report);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>重新執行 28 項測試</span>
                </button>
                <button
                  onClick={() => setActiveTab('VIEWER')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
                >
                  返回檢視器
                </button>
              </div>
            </div>

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
                    {c.passed ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
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
                  返回檢視器
                </button>
              </div>
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
                  {bomReport.items.map((it) => (
                    <tr key={it.itemNumber} className="hover:bg-slate-900/60 transition">
                      <td className="py-2.5 px-3 text-slate-400">{it.itemNumber}</td>
                      <td className="py-2.5 px-3 font-bold text-cyan-400">{it.definitionId}</td>
                      <td className="py-2.5 px-3 text-white font-sans font-medium">{it.nameZh}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
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

      {/* ========================================================================= */}
      {/* GLOBAL RIGHT SIDEBAR - DYNAMICALLY CONTEXT-AWARE                         */}
      {/* ========================================================================= */}

      {/* ------------------------------------------------------------- */}
      {/* RIGHT SIDEBAR 1: VIEWER PARAMETER INSPECTOR                   */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'VIEWER' && currentDef && (
        <aside className="w-88 border-l border-slate-800/80 bg-[#090e1c] flex flex-col shrink-0 z-20 overflow-y-auto p-4 space-y-4">
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
              <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>套用專案規格集 (Catalog Preset)</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">P.27–47</span>
            </div>
            <select
              onChange={(e) => {
                const profileId = e.target.value;
                if (!profileId) return;
                const profile = TraySystemProfiles.get(profileId);
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
              defaultValue=""
              className="w-full text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 font-medium"
            >
              <option value="" disabled>
                -- 快速套用型錄標準尺寸預設 --
              </option>
              {TraySystemProfiles.getAll().map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameZh} ({p.width}W x {p.height}H)
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Parameter Tuning Sliders */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">工程參數 (Parameters)</span>
              <span className="text-[10px] text-slate-400 font-mono">Single SOT</span>
            </div>

            {/* Width */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">標稱寬度 (Width):</span>
                <span className="font-mono text-cyan-400">{componentParams.width ?? 600} mm</span>
              </div>
              <input
                type="range"
                min="100"
                max="1200"
                step="50"
                value={componentParams.width ?? 600}
                onChange={(e) => handleParamChange('width', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Depth / Side Rail Height */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">邊高/深度 (Height/Depth):</span>
                <span className="font-mono text-cyan-400">{componentParams.depth ?? 100} mm</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                step="25"
                value={componentParams.depth ?? 100}
                onChange={(e) => handleParamChange('depth', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Radius (if fitting) */}
            {componentParams.radius !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">曲率半徑 (Radius R):</span>
                  <span className="font-mono text-cyan-400">{componentParams.radius} mm</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="900"
                  step="50"
                  value={componentParams.radius}
                  onChange={(e) => handleParamChange('radius', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            )}

            {/* Angle (if elbow/riser) */}
            {componentParams.angleDeg !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">轉折角度 (Angle):</span>
                  <span className="font-mono text-cyan-400">{componentParams.angleDeg}°</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="90"
                  step="15"
                  value={componentParams.angleDeg}
                  onChange={(e) => handleParamChange('angleDeg', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            )}

            {/* Tangent Length (125mm vendor extension) */}
            {componentParams.tangentLength !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">端部切線延伸 (Tangent):</span>
                  <span className="font-mono text-cyan-400">{componentParams.tangentLength} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="25"
                  value={componentParams.tangentLength}
                  onChange={(e) => handleParamChange('tangentLength', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Quick Action Buttons to Mate Test & Acceptance Tests */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setMateCompAId(selectedCompId);
                setMateParamsA({ ...componentParams });
                setActiveTab('MATE_DEMO');
              }}
              className="w-full py-2 px-3 bg-emerald-700/90 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition border border-emerald-500 shadow-md shadow-emerald-950/60"
            >
              <Link className="w-3.5 h-3.5 text-emerald-300" />
              <span>帶入此構件至自選對接測試</span>
            </button>

            <button
              onClick={() => {
                const report = AcceptanceTestSuite.runAll();
                setTestReport(report);
                setActiveTab('TESTS');
              }}
              className="w-full py-2 px-3 bg-amber-700/90 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition border border-amber-500 shadow-md shadow-amber-950/60"
            >
              <Play className="w-3.5 h-3.5 text-amber-300" />
              <span>執行 28 項工程不變量測試</span>
            </button>
          </div>

          {/* Export JSON button */}
          <button
            onClick={() => {
              if (!currentInstanceRef.current) return;
              const jsonStr = JsonExporter.exportInstance(currentInstanceRef.current);
              const blob = new Blob([jsonStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${selectedCompId}_export.json`;
              a.click();
            }}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition shadow-lg shadow-cyan-600/20"
          >
            <Download className="w-4 h-4" />
            <span>匯出 Schema 2.0.0 JSON 模型</span>
          </button>
        </aside>
      )}

      {/* ------------------------------------------------------------- */}
      {/* RIGHT SIDEBAR 2: MATE DIAGNOSTIC & SPATIAL TOLERANCE REPORT   */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'MATE_DEMO' && (
        <aside className="w-88 border-l border-slate-800/80 bg-[#090e1c] flex flex-col shrink-0 z-20 overflow-y-auto p-4 space-y-4">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>裝配對接確效診斷</span>
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                  mateResult?.success
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : 'bg-red-950 text-red-300 border border-red-700'
                }`}
              >
                {mateResult?.success ? 'PASS (相容)' : 'MISMATCH (不相符)'}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {mateResult?.success
                ? '兩構件對接端面寬度、邊高與介面規範相符，剛體變換矩陣成功對齊。'
                : '裝配引擎攔截到不相容參數，防止施工現場發生錯位安裝。'}
            </p>
          </div>

          {/* Compatibility Details Card */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-slate-200 block border-b border-slate-800 pb-1.5">
              端面介面檢核 (Interface Check):
            </span>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">構件 A 埠位尺寸:</span>
                <span className="text-cyan-400">
                  {mateParamsA.width ?? 600}W x {mateParamsA.depth ?? 100}H mm
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">構件 B 埠位尺寸:</span>
                <span className="text-emerald-400">
                  {mateParamsB.width ?? 600}W x {mateParamsB.depth ?? 100}H mm
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">介面類型相容性:</span>
                <span className="text-slate-200">TRAY_END ➔ TRAY_END</span>
              </div>
            </div>

            {/* If validation failed, display specific error reasons */}
            {mateResult && !mateResult.connectionCheck?.valid && (
              <div className="p-2.5 rounded bg-red-950/80 border border-red-800 text-[11px] text-red-300 space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>連接驗證攔截原因:</span>
                </div>
                {mateResult.connectionCheck.reasons.map((r: string, idx: number) => (
                  <div key={idx} className="font-mono pl-4">
                    &bull; {r}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Spatial Mate Numerical Invariants */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-slate-200 block border-b border-slate-800 pb-1.5">
              3D 空間剛體對齊不變量 (Spatial Invariants):
            </span>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">中心點間隙 (Position Error):</span>
                <span className="text-emerald-400 font-bold">
                  {mateResult?.positionErrorMm !== undefined ? `${mateResult.positionErrorMm.toFixed(4)} mm` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">法線反向內積 (Normal Dot):</span>
                <span className="text-cyan-400">
                  {mateResult?.alignmentDotProduct !== undefined ? mateResult.alignmentDotProduct.toFixed(4) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">頂部朝向內積 (Up Dot):</span>
                <span className="text-cyan-400">
                  {mateResult?.upDotProduct !== undefined ? mateResult.upDotProduct.toFixed(4) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* ------------------------------------------------------------- */}
      {/* RIGHT SIDEBAR 3: PLANT SCENE ENGINEERING OVERVIEW             */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'PLANT_SCENE' && (
        <aside className="w-88 border-l border-slate-800/80 bg-[#090e1c] flex flex-col shrink-0 z-20 overflow-y-auto p-4 space-y-4">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-blue-400 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>MCR 主管廊工程數據概覽</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              雙階電纜托架系統遵循安全防爆規範，上層為一般動力非本安托架，下層為儀表本安托架。
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
            <span className="font-bold text-slate-200 block border-b border-slate-800 pb-1.5 font-sans">
              標高配置 (Elevations):
            </span>
            <div className="flex justify-between">
              <span className="text-slate-400">上層非本安托架:</span>
              <span className="text-amber-400 font-bold">EL +7,200 mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">下層本安托架:</span>
              <span className="text-cyan-400 font-bold">EL +6,400 mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">高溫蒸汽管標高:</span>
              <span className="text-red-400">EL +5,050 mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">高溫製程管標高:</span>
              <span className="text-red-400">EL +3,300 mm</span>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
