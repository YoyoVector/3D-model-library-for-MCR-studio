/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type * as THREE from 'three';
import {
  Box,
  Link,
  Layers,
  Play,
  ListOrdered,
  Download,
  RotateCw,
  Maximize2,
  Palette,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Monitor,
  RefreshCcw,
} from 'lucide-react';

import {
  VERSION,
  ComponentRegistry,
  ComponentInstance,
  AcceptanceTestSuite,
  AssemblyValidator,
  JsonExporter,
  Materials,
  TraySystemProfiles,
  buildMatedAssembly,
  ASSEMBLY_DEMOS,
  trayFamilyOf,
  type TestSuiteReport,
  type AssemblyStep,
} from './index.ts';
import { THEME_PRESETS, PRIMARY_THEMES, MORE_THEMES, type ThemeId } from './app/themes.ts';
import { ViewportController, type CameraView } from './app/viewport.ts';
import { portMarkers, centerlineTubes, boundsBoxes, jointMarkers } from './app/sceneHelpers.ts';
import {
  PROFILE_KEYS,
  profileOf,
  profileShortName,
  profileShortNameZh,
  profileHeadline,
  componentGroupsFor,
  initialParams,
  validationOf,
  keyParamsOf,
  allDimensionsOf,
  type ProfileKey,
} from './app/catalog.ts';
import { buildPlantScene, DEFAULT_PLANT_LAYERS, type PlantLayers } from './app/plantScene.ts';
import { TestsView, BomView } from './app/ReportViews.tsx';
import { Badge, Section, KV, Field, SelectField, SliderField, ToggleButton, Dot } from './app/ui.tsx';

type Tab = 'VIEWER' | 'ASSEMBLY' | 'PLANT' | 'TESTS' | 'BOM';

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'VIEWER', label: '構件檢視 Viewer', icon: <Box className="w-3.5 h-3.5" /> },
  { id: 'ASSEMBLY', label: '對接裝配 Assembly', icon: <Link className="w-3.5 h-3.5" /> },
  { id: 'PLANT', label: '管廊場景 Plant', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'TESTS', label: '驗收測試 Tests', icon: <Play className="w-3.5 h-3.5" /> },
  { id: 'BOM', label: 'BOM', icon: <ListOrdered className="w-3.5 h-3.5" /> },
];

const FAMILY_LABEL: Record<string, string> = {
  STRAIGHT: '直式線槽 · STRAIGHT',
  H_BEND: '水平彎頭 · HORIZONTAL BEND',
  V_BEND: '垂直彎頭 · VERTICAL BEND',
  TEE: '三通 · TEE',
  CROSS: '四通 · CROSS',
  REDUCER: '異徑接頭 · REDUCER',
  OTHER: '工程構件 · COMPONENT',
};

/** Deterministic start state from the URL (demo links, screenshots): ?tab=&profile=&comp=&theme=&view=&demo=&present=1 */
function readUrlState() {
  const q = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const tab = (q.get('tab')?.toUpperCase() as Tab) || 'VIEWER';
  const profile = (q.get('profile') as ProfileKey) || 'LADDER_PROFILE_STANDARD';
  const comp = q.get('comp') || 'FITTING_TEE';
  const theme = (q.get('theme') as ThemeId) || 'PRESENTATION_STEEL';
  const view = (q.get('view')?.toUpperCase() as CameraView) || 'ISO';
  return {
    tab: TABS.some((t) => t.id === tab) ? tab : 'VIEWER',
    profile: PROFILE_KEYS.includes(profile) ? profile : 'LADDER_PROFILE_STANDARD',
    comp: ComponentRegistry.get(comp) ? comp : 'FITTING_TEE',
    theme: THEME_PRESETS[theme] ? theme : 'PRESENTATION_STEEL',
    view: ['ISO', 'TOP', 'FRONT', 'SIDE'].includes(view) ? view : 'ISO',
    demo: q.get('demo') && ASSEMBLY_DEMOS[q.get('demo')!] ? q.get('demo')! : 'ELBOW_TEE_CHAIN',
    present: q.get('present') === '1',
  } as const;
}

function demoApplicable(key: string, profileKey: ProfileKey): { ok: boolean; missing: string[] } {
  const p = profileOf(profileKey);
  if (!p) return { ok: true, missing: [] };
  const missing = Array.from(new Set(ASSEMBLY_DEMOS[key].steps.map((s) => s.definitionId))).filter((id) => !TraySystemProfiles.supports(p, id));
  return { ok: missing.length === 0, missing };
}

export default function App() {
  const init = useMemo(readUrlState, []);
  const [tab, setTab] = useState<Tab>(init.tab);
  const [themeId, setThemeId] = useState<ThemeId>(init.theme);
  const theme = THEME_PRESETS[themeId];
  const [profileKey, setProfileKey] = useState<ProfileKey>(init.profile);
  const [compId, setCompId] = useState<string>(() => {
    const p = profileOf(init.profile);
    return !p || TraySystemProfiles.supports(p, init.comp) ? init.comp : p.components[0].definitionId;
  });
  const [params, setParams] = useState<Record<string, any>>(() => initialParams(compId, init.profile));
  const [view, setView] = useState<CameraView>(init.view);
  const [showPorts, setShowPorts] = useState(true);
  const [showCenterline, setShowCenterline] = useState(true);
  const [showBounds, setShowBounds] = useState(false);
  const [showEdges, setShowEdges] = useState(THEME_PRESETS[init.theme].edgesByDefault);
  const [autoRotate, setAutoRotate] = useState(false);
  const [present, setPresent] = useState<boolean>(init.present);
  const [moreThemes, setMoreThemes] = useState(false);

  const [assemblyMode, setAssemblyMode] = useState<'DEMO' | 'CUSTOM'>('DEMO');
  const [demoKey, setDemoKey] = useState<string>(init.demo);
  const [custom, setCustom] = useState({ aId: 'TRAY_STRAIGHT', aPort: 'PORT_B', bId: 'FITTING_ELBOW_90', bPort: 'PORT_A' });
  const [plantLayers, setPlantLayers] = useState<PlantLayers>(DEFAULT_PLANT_LAYERS);
  const [testReport, setTestReport] = useState<TestSuiteReport | null>(null);
  const [testsRunning, setTestsRunning] = useState(false);

  const viewportEl = useRef<HTMLDivElement>(null);
  const infoCardEl = useRef<HTMLDivElement>(null);
  const toolbarEl = useRef<HTMLDivElement>(null);
  const vp = useRef<ViewportController | null>(null);
  const lastFrameKey = useRef('');

  const profile = profileOf(profileKey);
  const def = ComponentRegistry.get(compId)!;

  // ------------------------------------------------------------------ derived engineering state
  const viewerInstance = useMemo(() => new ComponentInstance('preview', def, params), [def, params]);
  const validation = useMemo(() => validationOf(compId, profileKey, params), [compId, profileKey, params]);
  const keyParams = useMemo(() => keyParamsOf(def, params), [def, params]);
  const termination = useMemo(() => AssemblyValidator.checkPortTermination(viewerInstance), [viewerInstance]);

  const assembly = useMemo(() => {
    if (assemblyMode === 'DEMO') {
      const applicable = demoApplicable(demoKey, profileKey);
      if (!applicable.ok) return { name: ASSEMBLY_DEMOS[demoKey].nameZh, instances: [], joints: [], passed: false, issues: [`此系列型錄無: ${applicable.missing.join(', ')}`] };
      const r = buildMatedAssembly(ASSEMBLY_DEMOS[demoKey].steps, { profile });
      return { name: ASSEMBLY_DEMOS[demoKey].nameZh, ...r };
    }
    const steps: AssemblyStep[] = [
      { definitionId: custom.aId, instanceId: 'A' },
      { definitionId: custom.bId, port: custom.bPort, attachPort: custom.aPort, instanceId: 'B' },
    ];
    try {
      const r = buildMatedAssembly(steps, { profile: profile && TraySystemProfiles.supports(profile, custom.aId) && TraySystemProfiles.supports(profile, custom.bId) ? profile : undefined });
      return { name: `${custom.aId}.${custom.aPort} ↔ ${custom.bId}.${custom.bPort}`, ...r };
    } catch (e: any) {
      return { name: 'Custom', instances: [], joints: [], passed: false, issues: [String(e?.message ?? e)] };
    }
  }, [assemblyMode, demoKey, custom, profile, profileKey]);

  const bomInstances = useMemo(() => {
    const extras = [
      new ComponentInstance('bom_mct', ComponentRegistry.get('PENETRATION_MCT')!),
      new ComponentInstance('bom_bay', ComponentRegistry.get('STRUCT_MAIN_BAY')!),
    ];
    return [...assembly.instances, ...extras];
  }, [assembly]);

  // ------------------------------------------------------------------ viewport lifecycle
  useEffect(() => {
    if (!viewportEl.current) return;
    const v = new ViewportController(viewportEl.current);
    vp.current = v;
    // Framing keeps the model clear of the info card and the camera toolbar.
    v.setOverlayProvider(() => [infoCardEl.current, toolbarEl.current].filter((el): el is HTMLDivElement => !!el));
    // A new controller has a fresh camera: force the next scene sync to frame the content
    // (React StrictMode re-creates this effect in development).
    lastFrameKey.current = '';
    const off = v.onFrame(() => {
      const tex = Materials.getCableFlowTexture();
      if (tex) tex.offset.x -= 0.012;
    });
    return () => {
      off();
      v.dispose();
      vp.current = null;
    };
  }, []);

  useEffect(() => {
    vp.current?.applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    vp.current?.setAutoRotate(autoRotate);
  }, [autoRotate]);

  useEffect(() => {
    const v = vp.current;
    if (!v) return;
    let objects: THREE.Object3D[] = [];
    let helpers: THREE.Object3D[] = [];
    let frameKey = '';
    const colors = theme.helper;

    if (tab === 'ASSEMBLY') {
      objects = assembly.instances.map((i) => i.getThreeMesh());
      if (showCenterline) helpers.push(...centerlineTubes(assembly.instances, colors.centerline));
      helpers.push(...jointMarkers(assembly.instances, assembly.joints));
      frameKey = `A|${assemblyMode}|${demoKey}|${JSON.stringify(custom)}|${profileKey}`;
    } else if (tab === 'PLANT') {
      objects = buildPlantScene(plantLayers);
      frameKey = 'PLANT';
    } else {
      objects = [viewerInstance.getThreeMesh()];
      if (showPorts) helpers.push(...portMarkers([viewerInstance], colors));
      if (showCenterline) helpers.push(...centerlineTubes([viewerInstance], colors.centerline));
      if (showBounds) helpers.push(...boundsBoxes([viewerInstance], colors.bounds));
      frameKey = `V|${compId}|${profileKey}`;
    }
    const reframe = frameKey !== lastFrameKey.current;
    v.setContent(objects, { frame: reframe, view });
    v.setHelpers(helpers);
    v.setEdgesEnabled(showEdges && tab !== 'PLANT');
    lastFrameKey.current = frameKey;
  }, [tab, viewerInstance, assembly, plantLayers, showPorts, showCenterline, showBounds, showEdges, theme, compId, profileKey, assemblyMode, demoKey, custom]);

  // ------------------------------------------------------------------ actions
  const selectProfile = (k: ProfileKey) => {
    setProfileKey(k);
    const p = profileOf(k);
    const next = !p || TraySystemProfiles.supports(p, compId) ? compId : p.components[0].definitionId;
    setCompId(next);
    setParams(initialParams(next, k));
  };
  const selectComponent = (id: string) => {
    setCompId(id);
    setParams(initialParams(id, profileKey));
    if (tab !== 'VIEWER') setTab('VIEWER');
  };
  const setParam = (k: string, v: any) => setParams((prev) => ({ ...prev, [k]: v }));
  const setCamera = (v: CameraView) => {
    setView(v);
    vp.current?.frame(v);
  };
  const selectTheme = (t: ThemeId) => {
    setThemeId(t);
    setShowEdges(THEME_PRESETS[t].edgesByDefault);
    setMoreThemes(false);
  };
  const runTests = () => {
    setTestsRunning(true);
    setTimeout(() => {
      setTestReport(AcceptanceTestSuite.runAll());
      setTestsRunning(false);
    }, 30);
  };
  useEffect(() => {
    if (tab === 'TESTS' && !testReport && !testsRunning) runTests();
  }, [tab]);

  const exportJson = () => {
    const blob = new Blob([JsonExporter.exportInstance(viewerInstance)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${compId}_${profileKey}.json`;
    a.click();
  };

  const effW = params.width ?? params.inletWidth;
  const headline = profileHeadline(profileKey, typeof effW === 'number' ? effW : undefined, typeof params.depth === 'number' ? params.depth : undefined);
  const family = trayFamilyOf(compId);
  const terminationOk = termination.length > 0 && termination.every((t) => t.passed);
  const showSidePanels = !present && (tab === 'VIEWER' || tab === 'ASSEMBLY' || tab === 'PLANT');

  return (
    <div className="app-root flex flex-col h-screen w-screen overflow-hidden select-none" data-ui={theme.ui}>
      {/* ============================ TOP BAR ============================ */}
      <header className="h-12 shrink-0 flex items-center gap-4 px-4 border-b panel">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-black text-[11px]" style={{ background: 'linear-gradient(135deg,#475569,#1e293b)' }}>
            MCR
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-bold t1">MCR-Studio 3D Component Library</div>
            <div className="text-[10.5px] t3 mono">@mcr-studio/parametric-3d v{VERSION}</div>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          {TABS.map((t) => (
            <button key={t.id} type="button" className="tab flex items-center gap-1.5" data-active={tab === t.id} onClick={() => setTab(t.id)}>
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 relative">
          <Palette className="w-3.5 h-3.5 t3" />
          {PRIMARY_THEMES.map((t) => (
            <button key={t.id} type="button" className="btn" data-active={themeId === t.id} onClick={() => selectTheme(t.id)} title={t.name}>
              <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ background: t.swatch }} />
              {t.nameZh}
            </button>
          ))}
          <button type="button" className="btn" data-active={!THEME_PRESETS[themeId].primary} onClick={() => setMoreThemes((v) => !v)}>
            更多
          </button>
          {moreThemes && (
            <div className="absolute right-0 top-9 z-50 glass p-1.5 space-y-1 w-48">
              {MORE_THEMES.map((t) => (
                <button key={t.id} type="button" className="pick-item flex items-center gap-2 text-[12px] t1" data-active={themeId === t.id} onClick={() => selectTheme(t.id)}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.swatch }} />
                  {t.nameZh} <span className="t3 text-[10.5px]">{t.name}</span>
                </button>
              ))}
            </div>
          )}
          <button type="button" className="btn" data-active={present} onClick={() => setPresent((v) => !v)} title="簡報模式：隱藏側欄">
            <Monitor className="w-3.5 h-3.5" />
            簡報模式
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* ============================ LEFT PANEL ============================ */}
        {showSidePanels && (
          <aside className="w-[300px] shrink-0 border-r panel flex flex-col min-h-0">
            {(tab === 'VIEWER' || tab === 'ASSEMBLY') && (
              <div className="p-3 border-b line space-y-2">
                <div className="section-title">型錄規格集 Active Profile</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {PROFILE_KEYS.map((k) => {
                    const p = profileOf(k);
                    return (
                      <button key={k} type="button" className="pick-item" data-active={profileKey === k} onClick={() => selectProfile(k)}>
                        <div className="text-[12px] font-semibold t1">{profileShortNameZh(k)}</div>
                        <div className="text-[10.5px] t3 mono">{p ? `${p.width}W × ${p.height}H · p.${p.source.pages[0]}–${p.source.pages[p.source.pages.length - 1]}` : 'library defaults'}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === 'VIEWER' && (
              <div className="flex-1 overflow-y-auto scroll-thin p-2 space-y-3">
                {componentGroupsFor(profileKey).map((g) => (
                  <div key={g.key} className="space-y-0.5">
                    <div className="section-title px-1.5 py-1">{g.title}</div>
                    {g.items.map((d) => {
                      const v = validationOf(d.id, profileKey, initialParams(d.id, profileKey));
                      return (
                        <button key={d.id} type="button" className="pick-item flex items-center gap-2" data-active={compId === d.id} onClick={() => selectComponent(d.id)}>
                          <Dot tone={v.tone} />
                          <div className="min-w-0">
                            <div className="text-[12.5px] t1 truncate">{d.nameZh}</div>
                            <div className="text-[10.5px] t3 mono truncate">{d.id}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {tab === 'ASSEMBLY' && (
              <AssemblyLeftPanel
                profileKey={profileKey}
                mode={assemblyMode}
                setMode={setAssemblyMode}
                demoKey={demoKey}
                setDemoKey={setDemoKey}
                custom={custom}
                setCustom={setCustom}
              />
            )}

            {tab === 'PLANT' && (
              <div className="p-3 space-y-2 overflow-y-auto scroll-thin">
                <div className="section-title">場景圖層 Layers</div>
                {(
                  [
                    ['nis', '上層非本安托架 Non-IS EL+7.2m'],
                    ['is', '下層本安托架 IS EL+6.4m'],
                    ['bays', '鋼構管架 Bays'],
                    ['jbs', '現場接線箱 JB ×6'],
                    ['pipes', '製程 / 蒸汽管 Piping'],
                    ['mct', 'MCT 與控制室 Building'],
                    ['cables', '動態電纜 Cables'],
                  ] as Array<[keyof PlantLayers, string]>
                ).map(([k, label]) => (
                  <label key={k} className="card-muted flex items-center justify-between px-2.5 py-2 text-[12px] t1 cursor-pointer">
                    {label}
                    <input type="checkbox" checked={plantLayers[k]} onChange={(e) => setPlantLayers((p) => ({ ...p, [k]: e.target.checked }))} />
                  </label>
                ))}
                <p className="text-[11px] t3">托架採用梯型規格集 600W × 150H，沿管廊 X 方向配置。</p>
              </div>
            )}
          </aside>
        )}

        {/* ============================ VIEWPORT ============================ */}
        <main className="flex-1 relative min-w-0">
          <div ref={viewportEl} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

          {(tab === 'VIEWER' || tab === 'ASSEMBLY') && (
            <div ref={infoCardEl} className="absolute top-3 left-3 z-10 max-w-[440px] pointer-events-none">
              {tab === 'VIEWER' ? (
                <ViewerInfoCard
                  familyLabel={FAMILY_LABEL[family]}
                  nameZh={def.nameZh}
                  name={def.name}
                  id={def.id}
                  headline={headline}
                  isVendor={!!profile}
                  validation={validation}
                  keyParams={keyParams}
                  terminationOk={terminationOk}
                  terminationCount={termination.length}
                />
              ) : (
                <AssemblyInfoCard name={assembly.name} headline={profileHeadline(profileKey)} passed={assembly.passed} joints={assembly.joints.length} issues={assembly.issues} />
              )}
            </div>
          )}

          {(tab === 'VIEWER' || tab === 'ASSEMBLY' || tab === 'PLANT') && (
            <div ref={toolbarEl} className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 glass px-2 py-1.5 flex items-center gap-1 w-max">
              {(['ISO', 'TOP', 'FRONT', 'SIDE'] as CameraView[]).map((v) => (
                <button key={v} type="button" className="btn" data-active={view === v} onClick={() => setCamera(v)}>
                  {{ ISO: '等角', TOP: '俯視', FRONT: '正視', SIDE: '側視' }[v]}
                </button>
              ))}
              <span className="w-px h-5 mx-1" style={{ background: 'var(--line)' }} />
              {tab !== 'PLANT' && (
                <>
                  {tab === 'VIEWER' && (
                    <ToggleButton active={showPorts} onClick={() => setShowPorts((v) => !v)} title="連接面與埠位方向">
                      連接面
                    </ToggleButton>
                  )}
                  <ToggleButton active={showCenterline} onClick={() => setShowCenterline((v) => !v)}>
                    中心線
                  </ToggleButton>
                  {tab === 'VIEWER' && (
                    <ToggleButton active={showBounds} onClick={() => setShowBounds((v) => !v)}>
                      包絡
                    </ToggleButton>
                  )}
                  <ToggleButton active={showEdges} onClick={() => setShowEdges((v) => !v)}>
                    輪廓
                  </ToggleButton>
                </>
              )}
              <ToggleButton active={autoRotate} onClick={() => setAutoRotate((v) => !v)} title="自動旋轉">
                <RotateCw className="w-3.5 h-3.5" />
              </ToggleButton>
              <button type="button" className="btn" onClick={() => vp.current?.frame(view)} title="Fit">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {tab === 'TESTS' && <TestsView report={testReport} running={testsRunning} onRun={runTests} />}
          {tab === 'BOM' && <BomView instances={bomInstances} title={`對接裝配「${assembly.name}」 (${profileHeadline(profileKey)}) + MCT + 管廊構架組`} />}
        </main>

        {/* ============================ RIGHT PANEL ============================ */}
        {showSidePanels && tab === 'VIEWER' && (
          <aside className="w-[330px] shrink-0 border-l panel overflow-y-auto scroll-thin p-3 space-y-3">
            <ParametersPanel compId={compId} profileKey={profileKey} params={params} setParam={setParam} reset={() => setParams(initialParams(compId, profileKey))} />
            <Section title="工程尺寸 Engineering (derived)">
              <div className="space-y-0.5">
                {allDimensionsOf(def, params).map(([k, v]) => (
                  <KV key={k} label={k} value={v} />
                ))}
                {allDimensionsOf(def, params).length === 0 && <div className="text-[12px] t3">No tray engineering layout for this component.</div>}
              </div>
            </Section>
            <Section title={`連接埠 Ports (${viewerInstance.getWorldPorts().length})`}>
              <div className="space-y-2">
                {viewerInstance.getWorldPorts().map((p) => {
                  const t = termination.find((x) => x.portId === p.id);
                  return (
                    <div key={p.id} className="card-muted p-2 text-[11.5px] space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="mono font-bold t1">{p.id}</span>
                        {t ? <Badge tone={t.passed ? 'ok' : 'bad'}>{t.passed ? 'FACE OK' : 'FACE ✗'}</Badge> : <span className="t3">{p.connectionType}</span>}
                      </div>
                      <div className="t2">{p.name}</div>
                      <div className="mono t3">pos [{p.worldPosition.map((v) => Math.round(v * 10) / 10).join(', ')}]</div>
                      <div className="mono t3">dir [{p.worldDirection.map((v) => Math.round(v * 1000) / 1000).join(', ')}]</div>
                      {p.connectionFace && (
                        <div className="mono t3">
                          face ±{p.connectionFace.halfWidth} × [{p.connectionFace.minUp}, {p.connectionFace.maxUp}] {p.connectionFace.style}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="btn justify-center"
                onClick={() => {
                  setCustom((c) => ({ ...c, aId: compId, aPort: viewerInstance.getWorldPorts().slice(-1)[0]?.id ?? 'PORT_B' }));
                  setAssemblyMode('CUSTOM');
                  setTab('ASSEMBLY');
                }}
              >
                <Link className="w-3.5 h-3.5" /> 帶入對接
              </button>
              <button type="button" className="btn justify-center" onClick={exportJson}>
                <Download className="w-3.5 h-3.5" /> JSON
              </button>
            </div>
          </aside>
        )}

        {showSidePanels && tab === 'ASSEMBLY' && (
          <aside className="w-[340px] shrink-0 border-l panel overflow-y-auto scroll-thin p-3 space-y-3">
            <AssemblyResultPanel joints={assembly.joints} passed={assembly.passed} issues={assembly.issues} instances={assembly.instances} />
          </aside>
        )}
      </div>
    </div>
  );
}

// =============================================================================== Viewer info card

function ViewerInfoCard(props: {
  familyLabel: string;
  nameZh: string;
  name: string;
  id: string;
  headline: string;
  isVendor: boolean;
  validation: ReturnType<typeof validationOf>;
  keyParams: ReturnType<typeof keyParamsOf>;
  terminationOk: boolean;
  terminationCount: number;
}) {
  const v = props.validation;
  return (
    <div className="glass p-3.5 space-y-2.5 pointer-events-auto">
      <div>
        <div className="section-title">{props.familyLabel}</div>
        <div className="text-[19px] font-bold t1 leading-tight mt-0.5">{props.nameZh}</div>
        <div className="text-[11.5px] t2">
          {props.name} · <span className="mono">{props.id}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[13px] font-semibold t1">
        <Dot tone={props.isVendor ? 'info' : 'neutral'} />
        {props.headline}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge tone={v.tone}>{v.label}</Badge>
        {v.pdfPages && (
          <span className="text-[11px] t2 mono">
            PDF p.{v.pdfPages.join(', ')} · 型錄頁 {v.printedPages?.join(', ')}
          </span>
        )}
      </div>
      {v.document && <div className="text-[11px] t3">{v.vendor} · {v.document}</div>}
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pt-1 border-t line">
        {props.keyParams.map((kp) => (
          <KV key={kp.label} label={kp.label} value={kp.value} hint={kp.hint} />
        ))}
      </div>
      {props.terminationCount > 0 && (
        <div className="flex items-center gap-1.5 text-[11.5px]" style={{ color: props.terminationOk ? '#16a34a' : '#dc2626' }}>
          {props.terminationOk ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          連接面檢查 {props.terminationOk ? `${props.terminationCount}/${props.terminationCount} 幾何精確終止於埠位平面` : '未通過'}
        </div>
      )}
      {v.notes.length > 0 && (
        <ul className="text-[11px] t3 space-y-0.5 list-disc pl-4">
          {v.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AssemblyInfoCard({ name, headline, passed, joints, issues }: { name: string; headline: string; passed: boolean; joints: number; issues: string[] }) {
  return (
    <div className="glass p-3.5 space-y-2 pointer-events-auto">
      <div className="section-title">對接裝配 · ASSEMBLY</div>
      <div className="text-[17px] font-bold t1 leading-tight">{name}</div>
      <div className="flex items-center gap-2 text-[12.5px] font-semibold t1">
        <Dot tone="info" />
        {headline}
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={passed ? 'ok' : 'bad'}>{passed ? 'MATE PASS' : 'MATE FAIL'}</Badge>
        <span className="text-[11.5px] t2">{joints} 個接頭實體檢查 (無穿模 / 無間隙 / 連接面一致 / 中心線連續)</span>
      </div>
      {!passed && issues.length > 0 && (
        <ul className="text-[11px] space-y-0.5" style={{ color: '#dc2626' }}>
          {issues.slice(0, 4).map((i) => (
            <li key={i}>• {i}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// =============================================================================== Parameters

function ParametersPanel({
  compId,
  profileKey,
  params,
  setParam,
  reset,
}: {
  compId: string;
  profileKey: ProfileKey;
  params: Record<string, any>;
  setParam: (k: string, v: any) => void;
  reset: () => void;
}) {
  const p = profileOf(profileKey);
  const vendor = !!p && TraySystemProfiles.supports(p, compId);
  const family = trayFamilyOf(compId);
  const def = ComponentRegistry.get(compId)!;
  const isBend = family === 'H_BEND' || family === 'V_BEND';
  const hasRadius = isBend || family === 'TEE' || family === 'CROSS';

  if (family === 'OTHER') {
    const numeric = Object.entries(def.defaultParameters).filter(([, v]) => typeof v === 'number');
    return (
      <Section title="參數 Parameters (generic)" right={<button type="button" className="btn" onClick={reset}><RefreshCcw className="w-3 h-3" /></button>}>
        {numeric.map(([k]) => (
          <Field key={k} label={k}>
            <input type="number" className="field mono" value={params[k] ?? ''} onChange={(e) => setParam(k, parseFloat(e.target.value))} />
          </Field>
        ))}
        {numeric.length === 0 && <div className="text-[12px] t3">No numeric parameters.</div>}
      </Section>
    );
  }

  if (vendor && p) {
    return (
      <Section
        title={`型錄參數 Catalog (${profileShortName(profileKey)})`}
        right={
          <button type="button" className="btn" onClick={reset} title="回復型錄預設">
            <RefreshCcw className="w-3 h-3" />
          </button>
        }
      >
        {family === 'REDUCER' ? (
          <>
            <Field label="W1 入口寬 (wide end)">
              <SelectField value={Number(params.inletWidth)} options={p.allowedWidths.filter((w) => w > p.allowedWidths[0])} onChange={(v) => {
                setParam('inletWidth', v);
                if (Number(params.outletWidth) >= v) setParam('outletWidth', p.allowedWidths.filter((w) => w < v).slice(-1)[0]);
              }} format={(v) => `${v} mm`} />
            </Field>
            <Field label="W2 出口寬 (narrow end)">
              <SelectField value={Number(params.outletWidth)} options={p.allowedWidths.filter((w) => w < Number(params.inletWidth))} onChange={(v) => setParam('outletWidth', v)} format={(v) => `${v} mm`} />
            </Field>
            <KV label="L 全長" value={`${params.length} mm`} hint={`${params.tangentLength} + taper + ${params.tangentLength}`} />
          </>
        ) : (
          <Field label="W 寬度" note={`型錄 ${p.allowedWidths[0]}–${p.allowedWidths[p.allowedWidths.length - 1]}`}>
            <SelectField value={Number(params.width)} options={p.allowedWidths} onChange={(v) => setParam('width', v)} format={(v) => `${v} mm`} />
          </Field>
        )}
        <KV label="H 邊高" value={`${params.depth} mm`} hint="catalog" />
        {hasRadius && (
          <Field label="R 彎曲半徑 (catalog inner R)" note="中心線半徑自動推導">
            <SelectField value={Number(params.radius)} options={p.allowedRadii} onChange={(v) => setParam('radius', v)} format={(v) => `${v} mm`} />
          </Field>
        )}
        {isBend && <KV label="角度 Angle" value={`${params.angleDeg ?? def.defaultParameters.angleDeg}°`} hint="by component" />}
        {hasRadius && <KV label="端部直段 Tangent" value={`${params.tangentLength} mm`} hint="catalog" />}
        {family === 'STRAIGHT' && (
          <Field label="L 長度" note={`型錄標準 ${p.standardLength}`}>
            <input type="number" className="field mono" step={100} value={params.length} onChange={(e) => setParam('length', Math.max(100, parseFloat(e.target.value) || p.standardLength))} />
          </Field>
        )}
        <KV label="型式 Style" value={p.trayType === 'LADDER' ? 'Ladder 梯型' : 'Ventilated 沖底型'} mono={false} />
        <KV label="材質 Material" value={family === 'STRAIGHT' ? p.material : p.fittingMaterial} />
      </Section>
    );
  }

  // Generic mode: free parameters.
  return (
    <Section
      title="通用參數 Generic Parameters"
      right={
        <button type="button" className="btn" onClick={reset} title="回復預設">
          <RefreshCcw className="w-3 h-3" />
        </button>
      }
    >
      <div className="flex gap-1.5">
        {(['LADDER', 'VENTILATED_THROUGH'] as const).map((s) => (
          <button key={s} type="button" className="btn flex-1 justify-center" data-active={(params.trayStyle ?? 'LADDER') === s} onClick={() => setParam('trayStyle', s)}>
            {s === 'LADDER' ? '梯型 Ladder' : '沖底型 Ventilated'}
          </button>
        ))}
      </div>
      {family === 'REDUCER' ? (
        <>
          <Field label="W1 入口寬">
            <SliderField value={Number(params.inletWidth)} min={150} max={1200} step={50} onChange={(v) => setParam('inletWidth', v)} />
          </Field>
          <Field label="W2 出口寬">
            <SliderField value={Number(params.outletWidth)} min={100} max={Math.max(100, Number(params.inletWidth) - 50)} step={50} onChange={(v) => setParam('outletWidth', v)} />
          </Field>
          <Field label="L 全長">
            <SliderField value={Number(params.length)} min={300} max={1200} step={50} onChange={(v) => setParam('length', v)} />
          </Field>
          <Field label="端部直段 Tangent">
            <SliderField value={Number(params.tangentLength)} min={0} max={Math.floor(Number(params.length) / 2 - 50)} step={25} onChange={(v) => setParam('tangentLength', v)} />
          </Field>
        </>
      ) : (
        <Field label="W 寬度">
          <SliderField value={Number(params.width)} min={100} max={1200} step={50} onChange={(v) => setParam('width', v)} />
        </Field>
      )}
      <Field label="H 邊高">
        <SliderField value={Number(params.depth)} min={50} max={200} step={25} onChange={(v) => setParam('depth', v)} />
      </Field>
      {hasRadius && (
        <Field label="R 內側彎曲半徑 (catalog R)">
          <SliderField value={Number(params.radius)} min={100} max={1200} step={50} onChange={(v) => setParam('radius', v)} />
        </Field>
      )}
      {isBend && (
        <Field label="角度 Angle">
          <SliderField value={Number(params.angleDeg)} min={15} max={90} step={7.5} onChange={(v) => setParam('angleDeg', v)} unit="°" />
        </Field>
      )}
      {hasRadius && (
        <Field label="端部直段 Tangent">
          <SliderField value={Number(params.tangentLength)} min={0} max={300} step={25} onChange={(v) => setParam('tangentLength', v)} />
        </Field>
      )}
      {family === 'STRAIGHT' && (
        <Field label="L 長度">
          <SliderField value={Number(params.length)} min={500} max={6000} step={250} onChange={(v) => setParam('length', v)} />
        </Field>
      )}
      <div className="flex items-start gap-1.5 text-[11px] t3">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        通用參數非型錄值；請選擇型錄規格集以取得型錄尺寸。
      </div>
    </Section>
  );
}

// =============================================================================== Assembly panels

function AssemblyLeftPanel({
  profileKey,
  mode,
  setMode,
  demoKey,
  setDemoKey,
  custom,
  setCustom,
}: {
  profileKey: ProfileKey;
  mode: 'DEMO' | 'CUSTOM';
  setMode: (m: 'DEMO' | 'CUSTOM') => void;
  demoKey: string;
  setDemoKey: (k: string) => void;
  custom: { aId: string; aPort: string; bId: string; bPort: string };
  setCustom: (c: { aId: string; aPort: string; bId: string; bPort: string }) => void;
}) {
  const options = componentGroupsFor(profileKey)
    .flatMap((g) => g.items)
    .filter((d) => trayFamilyOf(d.id) !== 'OTHER');
  const portsOf = (id: string) => ComponentRegistry.get(id)?.getLocalPorts(initialParams(id, profileKey)) ?? [];
  const pick = (which: 'a' | 'b', id: string) => {
    const ports = portsOf(id);
    if (which === 'a') setCustom({ ...custom, aId: id, aPort: ports[ports.length - 1]?.id ?? 'PORT_B' });
    else setCustom({ ...custom, bId: id, bPort: ports[0]?.id ?? 'PORT_A' });
  };
  return (
    <div className="flex-1 overflow-y-auto scroll-thin p-3 space-y-3">
      <div className="flex gap-1.5">
        <button type="button" className="btn flex-1 justify-center" data-active={mode === 'DEMO'} onClick={() => setMode('DEMO')}>
          裝配示範 Demos
        </button>
        <button type="button" className="btn flex-1 justify-center" data-active={mode === 'CUSTOM'} onClick={() => setMode('CUSTOM')}>
          自選對接 Custom
        </button>
      </div>
      {mode === 'DEMO' &&
        Object.entries(ASSEMBLY_DEMOS).map(([k, d]) => {
          const a = demoApplicable(k, profileKey);
          return (
            <button key={k} type="button" disabled={!a.ok} className="pick-item" data-active={demoKey === k} onClick={() => setDemoKey(k)} style={a.ok ? undefined : { opacity: 0.5 }}>
              <div className="text-[12.5px] font-semibold t1">{d.nameZh}</div>
              <div className="text-[10.5px] t3">{d.name}</div>
              {!a.ok && <div className="text-[10.5px]" style={{ color: '#dc2626' }}>此系列型錄無 {a.missing.join(', ')}</div>}
            </button>
          );
        })}
      {mode === 'CUSTOM' && (
        <div className="space-y-3">
          {(['a', 'b'] as const).map((w) => {
            const id = w === 'a' ? custom.aId : custom.bId;
            const port = w === 'a' ? custom.aPort : custom.bPort;
            return (
              <div key={w} className="card-muted p-2.5 space-y-2">
                <div className="section-title">{w === 'a' ? '構件 A (固定)' : '構件 B (自動對接到 A)'}</div>
                <select className="field" value={id} onChange={(e) => pick(w, e.target.value)}>
                  {options.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameZh} ({d.id})
                    </option>
                  ))}
                </select>
                <select
                  className="field mono"
                  value={port}
                  onChange={(e) => setCustom(w === 'a' ? { ...custom, aPort: e.target.value } : { ...custom, bPort: e.target.value })}
                >
                  {portsOf(id).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} — {p.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
          <p className="text-[11px] t3">兩構件皆採用目前規格集參數；對接由 MateEngine 計算，並以實際網格檢查穿模、間隙與連接面。</p>
        </div>
      )}
    </div>
  );
}

function AssemblyResultPanel({
  joints,
  passed,
  issues,
  instances,
}: {
  joints: ReturnType<typeof buildMatedAssembly>['joints'];
  passed: boolean;
  issues: string[];
  instances: ComponentInstance[];
}) {
  const f = (v: number, d = 3) => (Number.isFinite(v) ? (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d) : '—');
  const label = (id: string) => {
    const i = instances.findIndex((x) => x.instanceId === id);
    return i >= 0 ? `#${i + 1} ${instances[i].definition.nameZh}` : id;
  };
  return (
    <>
      <Section title="裝配結果 Mate Result" right={<Badge tone={passed ? 'ok' : 'bad'}>{passed ? 'PASS' : 'FAIL'}</Badge>}>
        <p className="text-[11.5px] t2">
          每個接頭以兩構件的實際網格檢查：接合平面兩側無穿越 (penetration ≤ 0.05 mm)、無間隙、連接面輪廓一致、方向相反、上方向一致、中心線連續。
        </p>
        {issues.length > 0 && (
          <ul className="text-[11px] space-y-0.5" style={{ color: '#dc2626' }}>
            {issues.map((i) => (
              <li key={i}>• {i}</li>
            ))}
          </ul>
        )}
      </Section>
      {joints.map((j, idx) => (
        <Section key={idx} title={`Joint ${idx + 1}`} right={<Badge tone={j.passed ? 'ok' : 'bad'}>{j.passed ? 'OK' : 'FAIL'}</Badge>}>
          <div className="text-[11.5px] t1 leading-snug">
            {label(j.instanceA)} <span className="mono t3">{j.portA}</span>
            <br />↔ {label(j.instanceB)} <span className="mono t3">{j.portB}</span>
          </div>
          <KV label="Connection" value={j.connection.code} />
          <KV label="Port gap" value={`${f(j.portGapMm, 4)} mm`} />
          <KV label="Direction dot" value={f(j.directionDot, 6)} hint="−1" />
          <KV label="Up dot" value={f(j.upDot, 6)} hint="+1" />
          <KV label="A past plane" value={`${f(j.planeOffsetAMm)} mm`} hint="≤ 0" />
          <KV label="B past plane" value={`${f(j.planeOffsetBMm)} mm`} hint="≤ 0" />
          <KV label="Face Δ" value={`${f(j.faceMismatchMm)} mm`} />
          <KV label="Centerline gap" value={`${f(j.centerlineGapMm, 4)} mm`} />
          {j.connection.error && <div className="text-[11px]" style={{ color: '#dc2626' }}>{j.connection.error}</div>}
          {j.connection.recommendation && <div className="text-[11px] t2">{j.connection.recommendation}</div>}
        </Section>
      ))}
    </>
  );
}
