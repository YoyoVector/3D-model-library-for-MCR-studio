# 專案檢查報告：錯誤 / Bug / 可完善的測試

> 檢查日期：2026-09-25　檢查對象：`main` @ `a1ed616`（分支 `claude/project-review-bugs-tests-mmiyij`）
> 本報告**只記錄問題，沒有修改任何程式碼**。每一項都附上位置、重現方式或證據，以及建議的修正方向，方便之後逐項確認再實作。

---

## 0. 檢查範圍與方法

1. **逐檔閱讀**：`src/` 全部（core / geometry / registry / ports / centerline / validation / network / bom / export / tests / app）、`scripts/`、`.github/workflows/`、`docs/`（含 harness）、`package.json` 與各 config。
2. **執行專案既有檢查**（Node 22.22.2、npm 10.9.7、three 0.186.0）：

   | 指令 | 結果 |
   | :--- | :--- |
   | `npm ci` | OK |
   | `npm run lint`（tsc） | OK |
   | `npm run test` | 44/44 PASS，README 片段 OK（約 0.7 秒） |
   | `npm run build` | OK；重建後 `lib/`、`standalone/` 與 commit **完全一致** |
   | `npm run test:contract` / `test:script` / `test:smoke` | 全部 PASS |
   | `npm audit` | 0 vulnerabilities |

3. **撰寫驗證腳本**，針對可疑處實際重現（結果寫在各項的「證據」欄）。
4. **以 headless Chromium 開啟 `standalone/MCR-3D-Component-Library.html`**，巡覽 Viewer / Assembly / Plant / Tests / BOM 分頁並收集 console 訊息。
5. **TypeScript 消費端型別測試**：`npm pack` 後安裝到乾淨專案，用 TS 5.4 / 6.0 × `bundler` / `nodenext` 型別檢查。

**整體評價**：線槽幾何（TrayLayouts）、型錄黃金樣本、實體對接驗證與路網主流程的測試相當扎實。問題主要集中在：非線槽（legacy）元件的資料一致性、BOM 的組合件判定、路網的輸入驗證與邊界情況、宿主整合的細節、測試本身的缺口，以及發佈流程。

**嚴重度定義**

| 等級 | 意義 |
| :-: | :--- |
| 高 | 會**靜默地**產生錯誤的工程 / 採購結果（沒有錯誤訊息），或違反函式庫主打的核心不變量 |
| 中 | 特定輸入下結果錯誤或當機、與文件承諾不符、使用者看得到的錯誤，或會影響發佈的流程問題 |
| 低 | 邊界情況、資源釋放、程式碼品質、文件落差、維護性 |

---

## 1. 總表

| ID | 等級 | 標題 | 主要位置 |
| :-- | :-: | :--- | :--- |
| A-1 | 高 | BOM 以 instanceId **前綴**判定組合件子件，獨立構件（甚至另一組合件）被排除 | `src/bom/BomManager.ts:98-103` |
| A-2 | 中 | BOM 忽略 `isPurchasedSeparately: true` | `src/bom/BomManager.ts:99` |
| A-3 | 低 | 組合件 BOM 規格字串寫死且有誤（支管廊寫 4 橫樑，實際 1 根） | `src/bom/BomManager.ts:137-145` |
| A-4 | 低 | 異徑 BOM 規格不含 T；直槽規格長度未四捨五入 | `src/bom/BomManager.ts:124-136` |
| B-1 | 高 | 8 個非線槽元件 `getBounds()` 與實際網格不符（最大差 2.75 m），另 6 個在非預設參數下不符 | `src/registry/ComponentRegistry.ts` 多處 |
| B-2 | 中 | 非線槽元件忽略宿主材質，也沒有 `userData.sharedMaterial` 旗標 | `ComponentRegistry.ts`、`Generators.ts` |
| B-3 | 中 | 控制櫃 `TRAY_END` 埠沒有 `connectionFace` → Viewer 顯示「連接面檢查 未通過」 | `ComponentRegistry.ts:405-416`、`AssemblyValidator.ts:271-301` |
| B-4 | 中 | 參數缺乏驗證：NaN / 負值 / 0 產生 NaN 幾何；異徑可「反向」；`rungSpacing`、`angleDeg` 無界 | `Generators.ts`、`TrayLayouts.ts`、`App.tsx:653` |
| B-5 | 低 | 小角度彎頭（< ~10°、無直段）橫擋突出埠位平面 | `src/geometry/TrayLayouts.ts:326-342` |
| B-6 | 低 | `STRUCT_BRANCH_BAY` 的 subComponents 與自身幾何不符 | `ComponentRegistry.ts:874-899` |
| B-7 | 低 | `CatalogStandards` 與廠商型錄衝突；`length` 參數從未檢查 | `src/registry/CatalogStandards.ts:11-45` |
| B-8 | 低 | `getComponentSystemCategories` 對 5 個元件回傳 `[]`，與子分類不一致 | `src/registry/SystemClassification.ts:112,134` |
| C-1 | 中 | `createComponentFromProfile` 自動 ID 高機率重複（1000 次中約 3 成重複） | `src/registry/TraySystemProfile.ts:385` |
| C-2 | 中 | `AssemblyValidator` 依賴場景圖的 `matrixWorld`，網格放進有變換的群組後誤判 | `src/validation/AssemblyValidator.ts:72-89` |
| C-3 | 中 | 明確傳入 `undefined` 的覆寫值會蓋掉規格集數值 | `TraySystemProfile.ts:364`、`Instance.ts:46-49` |
| C-4 | 低 | `updateParameters` 丟棄快取網格但不 dispose、也不通知宿主 | `src/core/Instance.ts:71-77,111-116` |
| C-5 | 低 | 註解與實作不符 / 死碼 / 內部快取外洩 | `Instance.ts`、`JsonExporter.ts` |
| C-6 | 低 | `Transforms.fromBasis` 退化輸入回傳非單位四元數；`setPlacement` 不正規化 | `src/core/Transforms.ts:139-151` |
| C-7 | 低 | `buildMatedAssembly` 的 `attachTo` 越界直接 TypeError | `src/validation/AssemblyChain.ts:63-69` |
| C-8 | 低 | `MateEngine` 註解 −0.999 與程式 −0.99 不符；`success` 條件實際上恆真 | `src/ports/MateEngine.ts:113-116` |
| C-9 | 低 | 公開 API 小問題：`WORLD_UP` 可變且被別名引用、部分 d.ts 未匯出、legacy helper 慣例不一致 | `PlanFrames.ts:75`、`TrayNetwork.ts:204-209` |
| D-1 | 高 | 無配件決定方向的直線段，只要不是「完全水平」托架就**側躺或上下顛倒**，且 `ok = true` | `src/network/TrayNetwork.ts:204-209,721` |
| D-2 | 中 | 路網重複 node id 不會被偵測，幾何錯誤但 `ok = true` | `src/network/TrayNetwork.ts:235-238` |
| D-3 | 中 | 路網輸入值未驗證：寬度 0 / 負值被靜默加寬、NaN 訊息誤導、NaN 座標 `ok = true` | `TrayNetwork.ts:252-257,997-1007` |
| D-4 | 中 | `pathCenterline` 遇無效段丟 TypeError；`pathPoints` 不連續時靜默截斷 | `TrayNetwork.ts:806-807,864-865` |
| D-5 | 低 | 系列不提供的配件節點上有 override 時，出現誤導的 `OVERRIDE_UNUSED` | `TrayNetwork.ts:670,696-700` |
| D-6 | 低 | 配件擺放失敗時 `fittingChoices()` 仍回傳選項 | `TrayNetwork.ts:672-677` |
| D-7 | 低 | normalize 產生的 ID 未檢查衝突；多個垂直三通時 clearance 看不到先前新增的 stub | `TrayNetwork.ts:1051-1071` |
| D-8 | 低 | 可能產生極短直槽（例如 3 mm）而無警告 | `TrayNetwork.ts:762` |
| E-1 | 低 | Viewer 參數輸入：可輸入 NaN、長度欄無法清空、滑桿互相不夾限、顏色以十進位編輯 | `src/App.tsx:653,699,727-738` |
| E-2 | 低 | 自選對接：切換規格集後選單與實際元件不一致；「帶入對接」不帶參數 | `src/App.tsx:160,514-521,795-803` |
| E-3 | 低 | 資源釋放（材質、幾何、ObjectURL、Plant 場景重建） | `src/app/viewport.ts`、`sceneHelpers.ts`、`App.tsx` |
| E-4 | 低 | three r186 已移除 `PCFSoftShadowMap`（console 警告） | `src/app/viewport.ts:96` |
| E-5 | 低 | `applyTheme` 直接修改共用材質 `Materials.Tray` | `src/app/viewport.ts:197-200` |
| E-6 | 低 | 過時文字、CSV 未完整跳脫、React key 可能重複 | `ReportViews.tsx:20,72-76`、`App.tsx:593,617,886` |
| F-1 | 中 | Case AL 的「負向對照組」是恆真式，什麼也沒驗證 | `src/tests/TestSuite.ts:1631-1637` |
| F-2 | 中 | Case R 只涵蓋線槽 + 4 個鋼構 → B-1 沒被抓到 | `src/tests/TestSuite.ts:751-755` |
| F-3 | 中 | 契約 / 煙霧測試用了不存在的參數 `height`；契約只驗 15 個匯出；沒有型別層測試 | `packageContractTest.ts:98`、`packSmokeTest.ts:116` |
| F-4 | 中 | BOM、宿主材質、路網、驗證器的測試缺口（對應 A、B、C、D 各項） | `src/tests/TestSuite.ts` |
| F-5 | 低 | README 測試並未讀取 README.md（手抄片段，改文件不會被發現） | `src/tests/readmeCompilationTest.ts` |
| F-6 | 低 | 測試框架與涵蓋率：自製 runner、例外時失去 case id、無 coverage、無 UI/E2E 測試 | `TestSuite.ts:275-287` |
| F-7 | 低 | 視覺基準只涵蓋 8 個模型；Case O 幾何斷言過弱 | `TestSuite.ts:576-669` |
| G-1 | 中 | `release.yml` 手動觸發時 tag 永遠是分支名（`release_tag` 被忽略） | `.github/workflows/release.yml:79-80` |
| G-2 | 中 | 含破壞性變更但版本仍 1.0.0；發佈時未檢查 tag 與版本一致 | `package.json`、`src/index.ts:17` |
| G-3 | 中 | `LICENSE` 不是 Apache-2.0 原文（刪節版） | `LICENSE` |
| G-4 | 低 | `npm run clean` 會刪除 git 追蹤的 `lib/`，且不跨平台 | `package.json:44` |
| G-5 | 低 | 未使用的依賴與 AI Studio 殘留設定 | `package.json`、`.env.example`、`metadata.json`、`vite.config.ts:16` |
| G-6 | 低 | `peerDependencies` 與 README 支援版本不一致；CJS 版依賴已棄用的 `require('three')` | `package.json:56` |
| G-7 | 低 | 測試與 fixtures 打包進主入口，且未宣告 `sideEffects` | `vite.lib.config.ts`、`src/index.ts:47` |
| G-8 | 低 | 文件落差（CHANGELOG 1.0.0、整合文件 43/43、案例範圍文字） | 多處 |
| G-9 | 低 | 沒有 `.gitattributes`（CI 逐位元比對 commit 的產物） | repo 根目錄 |
| G-10 | 低 | Lint 只有 tsc；tsconfig 無 include/exclude（掃到 lib/、dist/）；7 個未使用的 import / 欄位 | `package.json`、`tsconfig.json` |
| G-11 | 低 | release 流程缺 smoke / 產物檢查；`dist/*` 不含 assets | `.github/workflows/release.yml` |
| G-12 | 低 | integration harness 腳本缺錯誤處理 | `docs/integration/mcr-studio/harness/` |

合計：**高 3、中 17、低 34（共 54 項）**。

---

## 2. 函式庫：BOM（`src/bom/`）

### A-1【高】BOM 以 instanceId 前綴判定組合件子件，會漏掉獨立構件

- **位置**：`src/bom/BomManager.ts:98-103`
  ```ts
  Array.from(activeAssemblyInstanceIds).some(
    (parentInstId) => inst.instanceId.startsWith(parentInstId) && inst.instanceId !== parentInstId
  );
  ```
- **現象**：只要場景中有一個組合件（如 `STRUCT_MAIN_BAY`），任何 ID 以它的 ID **開頭**的 instance 都被當成內含子件而排除，不看它是否真的屬於該組合件。
- **證據**：`bay_1`（STRUCT_MAIN_BAY）＋ `bay_10`（另一個 STRUCT_MAIN_BAY）＋ `bay_1_extra_column_bought_separately`（STRUCT_COLUMN，無 parent）
  → `excludedBundledItems = ['bay_10', 'bay_1_extra_column_bought_separately']`，BOM 只剩 `STRUCT_MAIN_BAY x1`。
- **影響**：`bay_1` / `bay_10` 這種命名非常常見，採購清單會**靜默少料**，而且 `hasDoubleCounting` 仍顯示正常。
- **建議**：移除前綴規則，只以 `parentAssemblyInstanceId` 加上 subComponents 的 `definitionId` / `instanceSuffix` 判定。若需要相容舊資料，至少要求完整比對 `${parent}_${sub.instanceSuffix}`。
- **建議測試**：Case M 加入上述前綴誤判的負向案例。

### A-2【中】`isPurchasedSeparately: true` 被忽略

- **位置**：`src/bom/BomManager.ts:99`（`isBundledChild` 的第一個條件）。
- **現象**：子件只要帶 `parentAssemblyInstanceId`，而且該組合件在場，就一律排除，沒有查該子件在 `subComponents` 裡的 `isPurchasedSeparately`。`SubComponentReference` 的註解（`src/core/Schema.ts`）說 `false` 才代表內含於套件。
- **證據**：自訂組合件，subComponents 中的 `STRUCT_COLUMN` 設 `isPurchasedSeparately: true`；子件 `child_col` 帶 parent → 被排除。
- **說明**：目前 registry 的兩個組合件都是 `false`，所以現在看不出來；但這個 API 契約是錯的。
- **建議**：依 `(parent, definitionId, instanceSuffix)` 找到對應的 subComponent，再看它的旗標。

### A-3【低】組合件 BOM 規格字串寫死且有誤

- **位置**：`src/bom/BomManager.ts:137-145`
- `STRUCT_BRANCH_BAY` 規格寫「含 2 柱、**4 橫樑**、2 縱樑」，但 geometry 與 subComponents 都只有 **1** 根橫樑。
- `STRUCT_MAIN_BAY` 規格固定為「Span=7.8m, EL +8.0m」，不隨 `widthSpanMm` / `heightMm` 變動。`PENETRATION_MCT` 固定寫特定廠牌型號「RG M6x1 A-60」。
- **建議**：規格由 subComponents 與參數產生。

### A-4【低】BOM 規格欄位的細節

- 異徑規格（`BomManager.ts:134-136`）沒有 T（端部直段）：兩個只差 T 的異徑會併成同一行。
- 直槽規格 `L=${length/1000}m`（`BomManager.ts:124-126`）沒有四捨五入，任意長度會出現 `L=2.3456789m`，每個長度各成一行。

---

## 3. 函式庫：元件定義與幾何（`src/registry/`、`src/geometry/`）

### B-1【高】非線槽元件 `getBounds()` 與實際網格不一致

- **背景**：函式庫主打「Single Source of Truth：ports / bounds / mesh 不會不一致」。線槽類確實如此（Case R 覆蓋），但**非線槽元件的 `getBounds()` 是手寫常數或公式，與 `buildGeometry()` 不一致**。
- **證據**（`computeGeometryBounds` 對 `def.getBounds`，預設參數，單位 mm）：

  | 元件 | getBounds | 實際網格 | 最大差 |
  | :--- | :--- | :--- | --: |
  | `CONTEXT_BUILDING` | y `[0, 5500]` | y `[-2750, 2750]`（box 置中） | **2750** |
  | `VISUAL_CABLE_GENERATOR` | `[-50,-50,-50]..[5000,5000,50]` | `[-395,0,-25]..[5000,5395,25]` | 395 |
  | `SUPPORT_CANTILEVER` | `[0,-60,-25]..[750,60,25]` | `[-370,-295,-30]..[400,-40,30]` | 370 |
  | `FITTING_SPLICE_PLATE` | `[-310,-50,-100]..[310,50,100]` | `[-27.5,-40,-60]..[27.5,40,60]` | 282.5 |
  | `EQUIP_JUNCTION_BOX` | `[-275,-375,-175]..[275,375,175]` | `[-275,-435,-175]..[275,425,255]` | 80 |
  | `EQUIP_CONTROL_CABINET` | x min −500 | x min −520（前方色條） | 20 |
  | `PENETRATION_MCT` | x ±200 | x ±210（內嵌模組 t+20） | 10 |
  | `MOUNT_UNISTRUT` | ±21 | ±20.5 | 0.5 |

  非預設參數時，getBounds 根本沒有讀參數：`STRUCT_COLUMN {widthMm:500}` 差 75、`STRUCT_PIER {widthMm:900}` 差 100、`CONDUIT_RISER {diameterMm:100}` 差 25、`STRUCT_CROSS_BEAM {heightMm:400, depthMm:300}` 差 75、`OBSTACLE_BRANCH_PIPE_N {diameterMm:800}` 差 200、`VISUAL_CABLE_GENERATOR`（自訂 pathPoints）差 15000。
- **連帶問題**：
  - `SUPPORT_CANTILEVER` 的 `PORT_TRAY_SEAT` 在 `[375, 60, 0]`，但臂的頂面在 y ≈ −50 mm，**埠位不在幾何上**（`ComponentRegistry.ts:153-162`）。
  - `FITTING_SPLICE_PLATE` 的埠位在 x = ±300，但板寬只有 55 mm；`length`、`boltCount` 參數沒有被幾何使用（固定 120 mm）。
  - 基準檔 `src/tests/baselines/legacyFittingBaselines.ts:55-61` 其實已記錄了 cantilever 的真實範圍 `[-0.37,-0.295,…]`，與 getBounds 不同，但沒有測試比對兩者。
- **影響**：Viewer 的「包絡」框畫錯；宿主若用 `getBounds()` 做淨空 / 碰撞 / 擺放判斷，最多會差 2.75 m。
- **建議**：非線槽元件的 bounds 與 geometry 改成讀同一組參數（或共用一個 layout 函式），並擴充 Case R（見 F-2）。

### B-2【中】非線槽元件忽略宿主材質，也沒有 `sharedMaterial` 旗標

- **位置**：所有非線槽元件的 `buildGeometry: (params) => GeometryGenerators.xxx(params)`（例如 `ComponentRegistry.ts:117,169,230,379,422,680,711`）都沒有傳遞第二個參數 `options`。
- **文件承諾**（README「Materials」段、`src/core/Schema.ts:281-298`）：預設網格帶 `userData.sharedMaterial = true`；`getThreeMesh({ materials })` 回傳用宿主材質的新物件，歸宿主所有。
- **證據**：

  | 元件 | 使用宿主材質的網格 | 帶 sharedMaterial 旗標 |
  | :--- | :-: | :-: |
  | TRAY_STRAIGHT | 2/2 | 2/2 |
  | EQUIP_JUNCTION_BOX | 0/5 | 0/5 |
  | STRUCT_COLUMN | 0/1 | 0/1 |
  | EQUIP_CONTROL_CABINET | 0/2 | 0/2 |
  | SUPPORT_CANTILEVER | 0/4 | 0/4 |

- **影響**：宿主（如 MCR）無法用材質表示工程狀態；若照文件把「非共用」的網格材質 dispose，會 dispose 到共用的 `Materials.Support / Bolt / JbIS…`，造成重新編譯，並影響同頁其他使用者。
- 另外有些 builder 每次呼叫都新建材質，沒有擁有權標記，也沒有人釋放：`Generators.ts:287`（MCT 內嵌模組）、`:315`（機櫃色條）、`:429`（`BoxHelper`）、`:474`（電纜材質）。
- **建議**：所有 builder 經過同一個材質解析函式（宿主 → 共用），並統一設定 `userData.sharedMaterial`。

### B-3【中】控制櫃的 `TRAY_END` 埠沒有 `connectionFace`，Viewer 顯示「未通過」

- **位置**：`ComponentRegistry.ts:405-416`（`EQUIP_CONTROL_CABINET.PORT_BOTTOM_ENTRY`，`connectionType: 'TRAY_END'`，沒有 `connectionFace`）；`AssemblyValidator.ts:284-298`（沒有 face 時 `mismatch = Infinity` → `passed = false`）；`App.tsx:146,279`。
- **證據**：`checkPortTermination` 回傳 `[{ port: 'PORT_BOTTOM_ENTRY', passed: false, face: null }]`。headless Chromium 開 `?tab=viewer&profile=GENERIC&comp=EQUIP_CONTROL_CABINET`，資訊卡顯示紅色「連接面檢查 未通過」，Ports 區顯示「FACE ✗」。
- **建議**：改用非 `TRAY_END` 的 connectionType（例如 `GLAND`，或新增 `CABLE_ENTRY`），或讓 `checkPortTermination` 對沒有 face 的埠回傳「不適用」，而不是失敗。

### B-4【中】參數缺乏驗證

- **NaN**：`EQUIP_JUNCTION_BOX { width: NaN }` → `BoxGeometry(NaN, …)`，three 報「Computed min/max have NaN values」，網格範圍是 NaN；但 `getBounds()` 因為用 `params.width || 550` 靜默回到 550，兩者不一致。Viewer 的通用參數欄清空時就是 `parseFloat('') = NaN`（`App.tsx:653`），NaN 會讓鏡頭取景失效。
- **負值 / 0**：非線槽 builder 直接使用，會得到反向或退化的 box。
- **異徑反向**：`reducerLayout` 接受 `outletWidth > inletWidth`（`TrayLayouts.ts:864-866`），port 名稱仍是「Wide Inlet」，沒有任何提示。
- **`rungSpacing` 沒有下限**（`TrayLayouts.ts:233`，迴圈在 `:466`）：0.5 mm → 6000 根橫擋；更小的值會產生數百萬個 box，實質上當掉。
- **`angleDeg`**（`TrayLayouts.ts:498,552`）：接受 0、負值、> 180° 等任意有限值。
- **建議**：集中的參數驗證 / 夾限，把無效值回報出來（而不是靜默 fallback），bounds 與 geometry 使用同一份已驗證的參數。

### B-5【低】小角度彎頭的橫擋突出埠位平面

- **位置**：`TrayLayouts.ts:326-342`（`evenStations` 在區間過短時仍放一根在中間；`rungEndMargin`）。
- **證據**（通用參數，`tangentLength: 0`）：水平 5° → 兩個埠位都突出 **11.72 mm**；垂直上升 5° → **8.79 mm**。10° 以上正常。
- **說明**：型錄角度（30/45/60/90）不受影響，Viewer 滑桿下限是 15°；但定義的 provenance 寫「any angle supported」，Case O 也測非型錄角度。
- **建議**：放不下時不要放橫擋，並把小角度加進 Case AH。

### B-6【低】`STRUCT_BRANCH_BAY` 的 subComponents 與自身幾何不符

- **位置**：`ComponentRegistry.ts:874-880`（subComponents）與 `:881-899`（buildGeometry）。
- geometry 的柱寬是 300，但 subComponents 沒有 `parameterOverrides`，所以用預設 350（x `[-1375,-1025]` 與幾何 `[-1350,-1050]` 不符）。
- `B_BEAM_TOP` 在幾何中是 2.7 m、繞 Y 轉 90° 沿 X；subComponent 則是預設 7.8 m、沒有旋轉、沿 Z（z ±3900）。
- **影響**：任何依 subComponents 展開組合件的程式（BOM 明細、碰撞、匯出）都會拿到與畫面不同的零件。

### B-7【低】`CatalogStandards` 與廠商型錄衝突

- **位置**：`src/registry/CatalogStandards.ts:11-15,26,30-45`
- 資料是 NEMA 通用值（寬 150/200/300/450/600/750/900、角度 45/90），會把型錄有的 W100 / 400 / 500 / 700 / 800 / 1000、30° / 60° 判為「非標準」。
- `checkConformance` 宣告了 `length` 參數，但從未檢查（`length: 1234` 回傳 `isStandard: true`）。
- 目前只有 Case K / O 使用，但它是公開 API。**建議**：改由 `TraySystemProfile` 推導，或標為 deprecated。

### B-8【低】系統分類與子分類不一致

- `getComponentSubCategory` 把 `CONDUIT*` 歸 EQUIPMENT（`SystemClassification.ts:112`），但 `getComponentSystemCategories`（`:134-146`）對 `CONDUIT_RISER`、`MOUNT_UNISTRUT`、`SUPPORT_CANTILEVER`、`FITTING_SPLICE_PLATE`、`VISUAL_CABLE_GENERATOR` 都回傳 `[]`，這些元件不屬於任何系統篩選。

---

## 4. 函式庫：Instance / Transforms / Mate / Validation

### C-1【中】`createComponentFromProfile` 自動產生的 instanceId 高機率重複

- **位置**：`src/registry/TraySystemProfile.ts:385`：`${id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`
- **證據**：迴圈建立 1000 個（沒有給 instanceId）→ **約 290 個重複**（兩次實測 293、294）。
- **影響**：BOM、場景查找、`AssemblyValidator` 的 instanceId、匯出都以 ID 區分 instance。
- **建議**：模組層級計數器或 `crypto.randomUUID()`（IIFE / r128 環境要有 fallback）。

### C-2【中】`AssemblyValidator` 依賴場景圖的 `matrixWorld`

- **位置**：`src/validation/AssemblyValidator.ts:72-89`（`bodyVerticesWorldMm` 用 `inst.getThreeMesh()` 的快取網格與 `mesh.matrixWorld`）。
- **現象**：快取網格若被宿主放進**有變換的群組**，且 renderer 已更新 world matrix（`WebGLRenderer.render()` 每幀都會更新），頂點就包含父層變換，但埠位（`getWorldPorts()`）不包含 → 判斷錯誤。
- **證據**：兩段正確對接的直槽，放進 `position.x = 10` 的群組並 `scene.updateMatrixWorld(true)` 之後：
  `checkJoint` → `passed=false`（「Connection faces differ by **10000.00 mm**」），`checkPortTermination` → `[false, false]`。放進群組前是 `passed=true`。
- **說明**：Viewer 的內容群組在原點，所以看不出來；宿主（例如以群組做原點平移）會遇到。
- **建議**：頂點由「本地幾何 × instance placement」計算，不依賴場景圖；或量測時另建一個脫離場景的網格。

### C-3【中】明確傳入 `undefined` 的覆寫值會蓋掉規格集數值

- **位置**：`TraySystemProfile.ts:364`（`{ ...params, ...overrides }`）、`Instance.ts:46-49,72-75`。
- **證據**：`createComponentFromProfile('TRAY_STRAIGHT', VENTILATED_PROFILE_A, { width: undefined })` → `width` 參數是 `undefined`，layout 退回**通用預設 600**，不是規格集的 100。
- **影響**：宿主以 `{ width: state.width }` 傳值、而 state 尚未設定時，會靜默得到錯誤尺寸。
- **建議**：合併前濾掉 `undefined`。

### C-4【低】`updateParameters()` 丟棄快取網格但不 dispose，也不通知宿主

- **位置**：`src/core/Instance.ts:71-77,111-116`
- **證據**：`updateParameters({ length: 2000 })` 之後 `getThreeMesh()` 回傳新物件，舊網格的 geometry 沒有被 dispose（dispose 事件 0 次）。宿主場景裡的舊網格也不會更新。
- **建議**：在文件寫清楚擁有權與「需重新取得網格」，或提供 `dispose()` / 事件。

### C-5【低】註解與實作不符 / 死碼 / 內部快取外洩

- `Instance.getCenterlines()` 的註解說「with local and world coordinates」（`Instance.ts:160`），實際只回傳本地座標。
- `_cachedBounds` 宣告後沒有使用（`Instance.ts:33`）；`getBounds()` 每次都重算整個 layout。
- `getWorldPorts()` 回傳內部快取陣列本身；`JsonExporter.exportScene()` 也直接放入（`JsonExporter.ts:100`）。呼叫端一改就會污染 instance 的快取。

### C-6【低】`Transforms.fromBasis` 退化輸入

- **位置**：`src/core/Transforms.ts:139-151`
- **證據**：`fromBasis([0,1,0], [0,1,0])` → `[0, 0.5, 0.5, 0]`，長度約 0.707，不是單位四元數，也沒有錯誤。
- `setPlacement` / `setQuaternion` 也不正規化四元數；非單位四元數會讓 `transformPoint` 縮放座標。

### C-7【低】`buildMatedAssembly` 的 `attachTo` 越界直接 TypeError

- **位置**：`src/validation/AssemblyChain.ts:63-69`
- **證據**：`attachTo: 5`（或指向後面的步驟）→ `TypeError: Cannot read properties of undefined (reading 'getWorldPorts')`。
- **建議**：驗證 `0 ≤ attachTo < i`，回傳 issue。

### C-8【低】`MateEngine` 的成功條件

- `src/ports/MateEngine.ts:113` 註解寫 `<= -0.999`，`:116` 程式用 `-0.99` / `0.99`。
- 由建構方式，方向與 up 在數學上一定對齊，所以 `success` 只有在 NaN（退化埠位）時才會是 false，名稱容易讓人誤以為做了實質檢查。

### C-9【低】公開 API 的小問題

- `WORLD_UP`（`src/network/PlanFrames.ts:75`）是可變的匯出陣列；`defaultUp()`（`TrayNetwork.ts:206`）直接回傳它，所以水平直槽的 `PlacedStraight.up === WORLD_UP`（已驗證）。宿主改 `up[1]` 就會污染整個函式庫。建議 `Object.freeze` 或回傳副本。
- `DefinitionValidator`、`PortFrame` 有產生 `.d.ts`，但沒有從根入口匯出（`src/validation/index.ts`、`src/ports/index.ts`）。
- `RouteGenerator.createVerticalRiser`（`src/centerline/Route.ts:193` 起）起點切線是垂直的，與 `TrayLayouts` 的慣例（入口水平）相反。內部沒有使用，建議標示 legacy / deprecated。

---

## 5. 函式庫：路網（`src/network/`）

### D-1【高】無配件決定方向的直線段，托架會側躺或上下顛倒

- **位置**：`src/network/TrayNetwork.ts:204-209`（`defaultUp`）、`:721`（`upOfSegment`）。
  ```ts
  if (Math.abs(dir[1]) < 1e-6) return WORLD_UP;
  const cand = Math.abs(dir[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1];
  return normalize(cand - dir * (cand · dir));   // 用 X/Z 投影，不是 WORLD_UP 投影
  ```
- **何時發生**：直線段所在的共線鏈（經 PASS / 直線異徑節點相連）兩端都**沒有配件**提供 up，例如 END–END 的單段、經直通節點的一整段，或兩端配件都無法施作。
- **證據**（單段 END–END）：

  | 段 | 得到的 up | 結果 |
  | :--- | :--- | :--- |
  | 完全水平 | `[0, 1, 0]` | 正確（但與 `WORLD_UP` 是同一個物件，見 C-9） |
  | 10 m 升 1 mm（0.006°） | `[0, 0, 1]` | **托架側躺 90°** |
  | 45° 斜段 | `[0.707, −0.707, 0]` | **托架上下顛倒**（開口朝下） |
  | 鉛直 | `[1, 0, 0]` | 可接受 |

  三種情況 `layout.ok` 都是 `true`，沒有任何 issue。
- **另外**：這裡的「水平」門檻（`1e-6`）與 `buildGraph` 的 `level` 判定（`angleToleranceDeg`，預設 0.5°）不一致：同一段在分類時算水平，在定方向時又不算。
- **建議**：非鉛直段用 WORLD_UP 投影到垂直於 dir 的平面（正立）；只有鉛直段才用固定的水平參考；門檻與 `level` 使用同一個容許值；回傳副本。
- **建議測試**：END–END 的水平、微斜、斜段、鉛直段，斷言 `up·Y > 0`（非鉛直時）。

### D-2【中】重複的 node id 不會被偵測

- **位置**：`TrayNetwork.ts:235-238`（`new Map(network.nodes.map(...))` 以最後一個為準），`normalizeTrayNetwork` 也一樣。
- **證據**：nodes `a (0,0,0)`、`b (5000,0,0)`、`b (5000,0,5000)`，segment `a→b` → **沒有 issue、`ok = true`**，直槽終點在 `(5000, 0, 5000)`。
- **建議**：與重複 segment id 一樣回報 `INVALID_NETWORK`。

### D-3【中】路網輸入值未驗證

- **位置**：`TrayNetwork.ts:252-257`（buildGraph）、`:997-1007`（normalize 寬度）。
- **證據**：
  - `width: 0` 或 `-300` → normalize 以 **WARNING** `WIDTH_ADJUSTED`「widened from -300 to catalog W=100」，靜默改成 100。
  - `width: NaN` / `undefined` → ERROR，但訊息是「exceeds the widest catalog tray (1000); split it into parallel trays」，誤導使用者。
  - node 座標有 NaN → **`ok = true`、沒有 issue**，直槽長度是 `NaN`（`NaN < 1` 為 false，所以沒被當成零長度）。
- **建議**：寬度、高度、座標要是有限值，寬度要大於 0，否則回報 `INVALID_NETWORK`。

### D-4【中】`pathCenterline` 當掉；`pathPoints` 靜默截斷

- **位置**：`TrayNetwork.ts:806-807`（`graph.nodes.get(s!.from)!.position`）、`:864-865`（`if (!next) break;`）。
- **證據**：
  - 路網含一段端點不存在的 segment（已回報 `INVALID_NETWORK`），`pathCenterline(['s', 'x'])` → **`TypeError: Cannot read properties of undefined (reading 'position')`**，而不是 `ok:false`。
  - 路徑不連續時，`pathCenterline` 正確回報 `ok:false`，但 `pathPoints` 只回傳前半段的 21 個點，沒有任何錯誤通道；宿主會畫出一半的電纜。
- **建議**：`pathCenterline` 對 `graph.nodes` 查不到的段回報 issue；`pathPoints` 回傳 `{ points, ok, issues }`，或在文件寫明要先檢查 `pathCenterline().ok`。

### D-5【低】誤導的 `OVERRIDE_UNUSED`

- **位置**：`TrayNetwork.ts:670`（配件不提供時直接 `continue`，沒有寫入 `choices`）、`:696-700`。
- **證據**（通風型 B 系列不提供三通，節點 `o` 有 override）：同時出現 `ERROR FITTING_NOT_OFFERED` 與 `WARNING OVERRIDE_UNUSED "there is no bend, tee or cross on that node"`，後者與事實不符。

### D-6【低】配件擺放失敗時 `fittingChoices()` 仍回傳選項

- **位置**：`TrayNetwork.ts:672-677`：`fittingParams()`（會寫入 `choices`）在 `placeFittingOnNode()` 之前執行；擺放失敗（`JUNCTION_NOT_IN_CATALOG`）後，`fittingChoices(nodeId)` 仍回傳可選的寬度 / 半徑。

### D-7【低】normalize 產生的 ID 與 clearance

- **位置**：`TrayNetwork.ts:1051`（`${nodeId}~VT`）、`:1071`（`${segId}~STUB`）。沒有檢查是否與既有 ID 衝突。
- `:1055-1068` 的 clearance 用的是修改前的 `graph.nodes`：有多個垂直三通時，後面的三通看不到前面新增的 stub 節點 / 段，可能選到與新 stub 相撞的那一側。

### D-8【低】可能產生極短直槽

- **位置**：`TrayNetwork.ts:762`：只有剩餘長度 ≤ 0.5 mm 才不放直槽；剩 3 mm、20 mm 也會產生一支直槽並計入 BOM，但沒有 WARNING。建議設定最短可施作長度，低於時回報。

---

## 6. Viewer App（`src/App.tsx`、`src/app/`）

### E-1【低】參數輸入

- 通用參數欄 `parseFloat(e.target.value)`（`App.tsx:653`）：清空時是 NaN，會產生 NaN 幾何（見 B-4）；開發模式下 React 也會警告 `value` 為 NaN。
- 型錄模式直槽長度 `Math.max(100, parseFloat(v) || 3000)`（`App.tsx:699`）：清空欄位會立刻跳回 3000，無法清空後再輸入。
- 通用模式異徑（`App.tsx:727-738`）：調 W1 時不會把 W2 夾到 ≤ W1−50；調 L 時不會把 T 夾到 ≤ L/2−50，顯示值會超出滑桿範圍。
- `stripeColorHex` 以十進位數字顯示與編輯（`App.tsx:648-655`，畫面上顯示 165063）。

### E-2【低】自選對接

- 切換規格集後，`custom.aId` / `bId` 可能不在新的選項中（例如 B 系列沒有三通）：下拉選單顯示第一個選項，但實際組裝的是舊元件，而且因為 `supports()` 失敗，**兩個元件都改用通用參數**（`App.tsx:160,795-803`）。
- 「帶入對接」（`App.tsx:514-521`）只帶入元件 ID 與埠位，不帶 Viewer 裡已修改的參數；對接畫面看到的是另一個尺寸。

### E-3【低】資源釋放

- `rebuildEdges()` 每次都 `new LineBasicMaterial`，從未 dispose（`viewport.ts:324`）；主題、內容、輪廓切換都會觸發。
- `setContent()` 只 dispose 幾何、不 dispose 材質（`viewport.ts:211`）。Plant 場景每次重建都會新建電纜與 MCT 的材質，Viewer 切到機櫃 / 熱區元件也會新建材質（見 B-2），這些都會洩漏。
- `boundsBoxes()` 的 `BoxGeometry` 只被 `EdgesGeometry` 使用，本身沒有 dispose（`sceneHelpers.ts:81`）。
- `ViewportController.dispose()`（`viewport.ts:336-342`）沒有釋放 scene 內容、ground、grid、edges、helpers。
- `URL.createObjectURL` 沒有 `revokeObjectURL`（`App.tsx:271`、`ReportViews.tsx:78`）。
- Plant 分頁在任何 effect 依賴改變時（主題、輪廓等）都整個重建場景（`App.tsx:204-232`；`buildPlantScene` 沒有 memo）。

### E-4【低】`PCFSoftShadowMap` 已被移除

- headless Chromium 每個分頁都出現：`THREE.WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`（`viewport.ts:96`）

### E-5【低】`applyTheme` 修改共用材質

- `viewport.ts:197-200` 直接改 `Materials.Tray` 的 color / metalness / roughness。類別註解說 Viewer「never modifies」，README 也要求不要動共用材質。同一頁面若有其他使用函式庫的元件，會一起被改色。

### E-6【低】文字、CSV、React key

- `ReportViews.tsx:20`「Case A–V … Case W–AK」已過時（目前到 AR）；`TestSuite.ts:222` 註解同樣過時。
- CSV 匯出只替 spec 加引號，沒有跳脫內含的雙引號，其他欄位也沒有加引號（`ReportViews.tsx:72-76`）。
- 以字串內容當 React key（`App.tsx:593,617,886`），內容重複時會出現 key 警告。

---

## 7. 測試：缺口與測試本身的問題

### F-1【中】Case AL 的負向對照組是恆真式

- **位置**：`src/tests/TestSuite.ts:1631-1637`
  ```ts
  const northShift = narrowShift(north);
  ...
  const mirrored = narrowShift(north);                       // 與 northShift 完全相同的計算
  const controlCaught = Math.abs(mirrored - -0.15) > 1e-6;   // 永遠成立
  ```
- 這個「對照組」並沒有把 page 座標資料用錯誤的 frame 解讀，所以無法證明「用錯座標轉換一定會被抓到」。README 與整合文件 §3 都引用了這個保證。
- **建議**：用 `PAGE_Y_DOWN_METRES` 的資料經 `NORTH_UP_METRES` 解讀（鏡像），斷言「左偏在圖面左側」的檢查**會失敗**。

### F-2【中】Case R 沒有涵蓋非線槽元件

- `TestSuite.ts:751-755` 只檢查線槽類與 `STRUCT_COLUMN / PIER / MAIN_BAY / BRANCH_BAY`，而且只用預設參數，所以 B-1 的 8 + 6 個不一致完全沒被抓到。
- **建議**：對**全部元件** × 預設參數與至少一組非預設參數比對；同時檢查埠位是否落在幾何表面附近（可抓到 cantilever / splice plate 的埠位問題）。

### F-3【中】套件契約 / 煙霧測試

- `packageContractTest.ts:98` 與 `packSmokeTest.ts:116` 用 `{ height: 8000 }` 建 `STRUCT_COLUMN`，但參數名稱是 `heightMm`。斷言 `max[1] >= 8000` 只是因為預設值剛好是 8000 才通過。
- 契約測試只檢查 15 個匯出，沒有 README 列出的主要 API：`TraySystemProfiles`、`createComponentFromProfile`、`resolveProfileParameters`、`buildMatedAssembly`、`AssemblyValidator`、`ConnectionValidator`、`GeometryGenerators`、layout 函式、`leftOfTravel`、`AssemblyRegistry`、`ASSEMBLY_DEMOS`…
- 沒有 **TypeScript 型別層**的消費者測試。本次手動驗證：`lib/*.d.ts` 裡帶 `.ts` 副檔名的 re-export，在 TS 5.4 / 6.0 × `bundler` / `nodenext`（`skipLibCheck` 開 / 關）都能正確解析；建議自動化，避免之後 d.ts 產生方式改變時壞掉。
- smoke test 安裝**沒鎖版本**的 `three`，three 發佈破壞性版本時結果會不穩定。

### F-4【中】各模組的測試缺口（建議新增的案例）

| 對應問題 | 建議新增的測試 |
| :--- | :--- |
| A-1、A-2 | BOM：前綴相同的獨立構件與組合件；`isPurchasedSeparately: true` 的子件 |
| B-2 | 宿主材質（Case AQ 目前只測 `FITTING_TEE`）：全部元件的宿主材質與 `sharedMaterial` 旗標 |
| B-3 | 全部元件的 `TRAY_END` 埠都必須有 `connectionFace`（或改用其他類型） |
| B-4、B-5 | NaN / 負值 / 0 / 極小 `rungSpacing` / 極端角度 / 異徑反向；小角度彎頭的終止面 |
| C-1、C-3 | 自動 ID 唯一性；`undefined` 覆寫不應蓋掉規格集數值 |
| C-2 | 網格放進有變換的群組後，`checkJoint` / `checkPortTermination` 結果不變 |
| C-6、C-7 | `fromBasis` 退化輸入；`buildMatedAssembly` 非法 `attachTo` |
| D-1 | 無配件的水平 / 微斜 / 斜向 / 鉛直直線段的 up 方向 |
| D-2、D-3 | 重複 node id；寬度 0 / 負值 / NaN；NaN 座標 |
| D-4 | `pathCenterline` 含無效段；`pathPoints` 不連續 |
| 路網未覆蓋的功能 | `VERTICAL_RUN_TWISTED`、`FITTING_MISALIGNED`、`NORTH_UP_METRES` 路網、`verticalTeeSide`、`angleToleranceDeg`、`idPrefix`、通風型系列遇到寬度變化（異徑不提供） |
| 已驗證正常、建議鎖成回歸 | 四通 + 異徑、鉛直段上的直線異徑、30° 斜向垂直彎頭、0.3° 微斜轉彎（容許值內）都能正確解析 |

### F-5【低】README 測試並未讀取 README.md

- `src/tests/readmeCompilationTest.ts` 是手抄的程式片段，不是從 README.md 抽出來的。README 改了（例如 API 名稱或數值）不會被發現。
- **建議**：從 README 抽出 ```typescript 區塊，編譯並執行；或至少比對關鍵數值。

### F-6【低】測試框架與涵蓋率

- 自製 runner：測試丟出例外時，case id 被換成 `#n`、名稱變成「Test threw an exception」（`TestSuite.ts:275-287`），看不出是哪個 Case 壞掉。
- 沒有 coverage、沒有逐案計時。`runAll()` 會呼叫 `ComponentRegistry.initAll()`（`TestSuite.ts:226`），在 App 內執行時會替換全部定義物件（副作用）。
- 沒有 React 元件測試與 E2E。建議用 Vitest（保留 `AcceptanceTestSuite` 供瀏覽器 Tests 分頁）＋ coverage，並用 Playwright 對 standalone 做煙霧測試：各分頁沒有 console error、Tests 分頁 44/44、連接面檢查文字、BOM 列數。本次已手動跑過，腳本可以直接改成 CI 測試。

### F-7【低】視覺基準與弱斷言

- Case N 只為 8 個 legacy 模型建立幾何簽章（`legacyFittingBaselines.ts`），另外 31 個元件沒有幾何回歸基準。
- Case O 的幾何斷言只有 `box.min.z < -0.2 && box.max.z <= 0.001`（`TestSuite.ts:656`），幾乎任何形狀都會通過。

---

## 8. 建置 / CI / 發佈 / 文件

### G-1【中】`release.yml` 手動觸發時 tag 錯誤

- **位置**：`.github/workflows/release.yml:79-80`
  ```yaml
  tag_name: ${{ github.ref_name || inputs.release_tag }}
  ```
- `workflow_dispatch` 時 `github.ref_name` 是執行的分支名（例如 `main`），一定為真，所以輸入的 `release_tag` 永遠不會被使用，會建立名為 `main` 的 tag / release（與分支同名）。
- **建議**：`${{ inputs.release_tag || github.ref_name }}`，或依 `github.event_name` 判斷。

### G-2【中】版本與破壞性變更

- CHANGELOG「Unreleased」有破壞性變更（`radius` 改為型錄內側 R、tangent 生效、LEFT/RIGHT 異徑手性、BOM key 等），但 `package.json` 與 `src/index.ts:17` 的 `VERSION` 仍是 `1.0.0`。依 semver 應升主版號。
- `VERSION` 常數與 `package.json` 分開維護，容易不同步。
- release 流程沒有檢查「tag 版本 = package.json 版本」。

### G-3【中】`LICENSE` 不是 Apache-2.0 原文

- 檔案只有第 1–8 條：缺第 9 條（Accepting Warranty or Additional Liability）；第 3 條缺專利訴訟終止條款；第 4 條缺「(d) NOTICE 的完整內容」與「可加入自己的著作權聲明」段落；第 6、8 條被截短；沒有 APPENDIX。第 1 條本身還寫著「Sections 1 through 9」。
- `package.json` 宣告 `"license": "Apache-2.0"`，整合文件也建議把授權檔複製進 MCR 發佈包。
- **建議**：換成 apache.org 的官方全文（修改成本極低，法遵上建議優先處理）。

### G-4【低】`npm run clean`

- `package.json:44`：`rm -rf dist lib server.js`。會刪除 **git 追蹤中的 `lib/`**（沒有 npm 的電腦依賴它）；`server.js` 不存在（AI Studio 殘留）；`rm -rf` 在 Windows 不可用。

### G-5【低】未使用的依賴與殘留設定

- 程式碼沒有用到的 devDependencies：`@google/genai`、`express`、`@types/express`、`dotenv`、`motion`、`autoprefixer`（Tailwind v4 不需要）。
- AI Studio 殘留：`.env.example`（`GEMINI_API_KEY`、`APP_URL`）、`metadata.json`（`MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`）、`vite.config.ts` 的 HMR 註解（`:16` 有亂碼「modifyâfile」）。

### G-6【低】three 版本相容性宣告

- `peerDependencies.three: ">=0.160.0"`（`package.json:56`），但 README 徽章與 IIFE 宣稱支援 r128+。IIFE 不受 npm 限制，但用 npm 安裝 r128 會出現 peer 警告，兩邊說法不一致。
- CJS 版 `require('three')` 在 three r186 已出現 `THREE_CJS_DEPRECATED` 警告（contract / smoke 測試輸出可見），three 移除 CJS 版之後 `lib/index.cjs` 就會壞。

### G-7【低】測試程式打包進主入口

- `AcceptanceTestSuite`、黃金樣本 fixtures、視覺基準都從根入口匯出（`src/index.ts:47`），`lib/index.js` 約 242 KB；`package.json` 沒有 `"sideEffects"`，消費端無法 tree-shake。
- **建議**：拆成 `./tests` 子路徑（IIFE 可保留全部），並宣告 `sideEffects`（注意 `Materials` 在載入時就建立材質）。

### G-8【低】文件落差

- CHANGELOG `[1.0.0]` 宣稱有子路徑匯出（`/core`、`/registry`…）與一些不存在的元件（Perforated、Wire Mesh、Grounding Lug…）；實際只有 `.` 與 `./iife`。
- `docs/integration/mcr-studio/MCR-Studio-整合注意事項.md` §2 寫「43/43 驗收測試通過」，目前是 44。
- `release.yml:43` 的步驟名稱「(Case A ~ V)」、`ReportViews.tsx:20`、`TestSuite.ts:222` 的案例範圍都過時。

### G-9【低】沒有 `.gitattributes`

- CI 會逐位元比對 commit 的 `lib/` 與 `standalone/`（`ci.yml` 的「Verify Committed Build Artifacts」），專案也明確支援 Windows（`inline-standalone.mjs` 已處理 CRLF）。建議加 `* text=auto eol=lf`，把行尾固定下來。

### G-10【低】Lint 與型別設定

- `npm run lint` 只有 `tsc --noEmit`，沒有 ESLint / Prettier。
- 開 `noUnusedLocals / noUnusedParameters` 有 7 處：`ReportViews.tsx:6`、`main.tsx:1`（React）、`BomManager.ts:6`（ComponentRegistry）、`Instance.ts:33`（_cachedBounds）、`MateEngine.ts:9`、`AssemblyRegistry.ts:7`、`TestSuite.ts:24`。
- `tsconfig.json` 沒有 `include` / `exclude`，又開了 `allowJs`，所以 lint 的程式範圍（109 個檔）除了 `src/`，還包含建置產物 `lib/*.js`、`lib/**/*.d.ts`、build 之後的 `dist/assets/*.js`（約 1 MB）、`docs/.../harness/*.js`、`scripts/*.mjs`（`tsc --listFilesOnly` 可見）。建議 `include: ["src", "*.config.ts"]` 並排除 `lib`、`dist`、`dist-standalone`、`docs`。
- `tsconfig.json` 沒有明確設定 `"strict"`。目前使用的 TypeScript 6 預設就是 strict（實測 implicit any 與 null 指派都會報錯），但換成 TS 5 或其他工具就不是了，建議明確寫出來。

### G-11【低】release 流程其他細節

- 沒有跑 `test:smoke` 與「commit 的建置產物是否最新」檢查（CI 有，release 沒有）。
- `files: dist/*` 不包含 `dist/assets/`，附加到 Release 的 `index.html` 會缺資源；`lib/*` 也不含 d.ts 子目錄。
- `body_path: CHANGELOG.md` 會把整份 CHANGELOG 當成每一次 release 的說明。

### G-12【低】integration harness 腳本

- `harness.js:34`：`?focus=` 指定不存在的節點會 TypeError；`ovr` 的 `JSON.parse` 沒有 try/catch。
- `check-mcr-samples.cjs:22`：沒有可量測電纜時 `sumNew / sumOld - 1` 會變成 NaN。

---

## 9. 已確認沒有問題的項目（避免重工）

- 所有既有檢查通過；重建後產物與 commit 一致；`npm audit` 0 個漏洞。
- 型別消費端：TS 5.4 / 6.0 × `bundler` / `nodenext` 都能解析 `lib/*.d.ts`（含 `.ts` 副檔名的 re-export）。
- 路網：四通 + 異徑、鉛直直線異徑、30° 斜向垂直彎頭都能正確解析；在容許值內的 0.3° 微斜轉彎不會誤報 `FITTING_MISALIGNED`。
- 驗收測試總時間約 0.7 秒（最慢 Case AI 約 114 ms），瀏覽器 Tests 分頁不會卡住。
- standalone 在 headless Chromium 各分頁沒有 JS 錯誤（只有 E-4 的警告），Tests 分頁 44/44，Assembly CROSS_CHAIN 為 MATE PASS，BOM 正常。

---

## 10. 建議處理順序

1. **先修（影響工程 / 採購資料正確性，或修正成本極低）**：A-1、D-1、B-1 + F-2、G-3、G-1。
2. **其次**：B-2、B-3、C-1、C-2、C-3、D-2、D-3、D-4、A-2、F-1、F-3，以及 F-4 對應的測試。
3. **最後**：其餘低優先項目（資源釋放、文件、清理、工具鏈）。

每修一項時，建議**先補上會失敗的測試**（F 區塊已列出對應關係），再修程式，最後確認 `npm run test`、`test:contract`、`test:script`、`test:smoke` 以及 CI 的產物一致性檢查都通過（`lib/`、`standalone/` 要一起重建並 commit）。

---

## 附錄：重現片段

以下片段在 repo 根目錄用 `npx tsx <檔案>.ts` 執行（import 路徑用 `./src/index.ts`）。

```ts
import * as THREE from 'three';
import {
  ComponentRegistry, ComponentInstance, computeGeometryBounds, BomManager, TraySystemProfiles,
  createComponentFromProfile, MateEngine, AssemblyValidator, resolveTrayNetwork,
} from './src/index.ts';

// B-1：bounds 與網格
for (const def of ComponentRegistry.getAll()) {
  const b = def.getBounds(def.defaultParameters), g = computeGeometryBounds(def, def.defaultParameters);
  const e = Math.max(...[0, 1, 2].flatMap((k) => [Math.abs(b.min[k] - g.min[k]), Math.abs(b.max[k] - g.max[k])]));
  if (e > 0.05) console.log(def.id, e);
}

// A-1：前綴誤判
const bay = (id: string) => new ComponentInstance(id, ComponentRegistry.get('STRUCT_MAIN_BAY')!);
console.log(BomManager.generateBom([bay('bay_1'), bay('bay_10')]).excludedBundledItems); // ['bay_10']

// C-1：自動 ID 重複
const ladder = TraySystemProfiles.get('LADDER_PROFILE_STANDARD')!;
const ids = Array.from({ length: 1000 }, () => createComponentFromProfile('TRAY_STRAIGHT', ladder).instanceId);
console.log(1000 - new Set(ids).size); // 約 300

// C-2：放進有變換的群組
const a = createComponentFromProfile('TRAY_STRAIGHT', ladder, {}, 'a');
const b = createComponentFromProfile('TRAY_STRAIGHT', ladder, {}, 'b');
MateEngine.placeComponentByPort(a, 'PORT_B', b, 'PORT_A');
const scene = new THREE.Scene(), grp = new THREE.Group();
grp.position.x = 10; scene.add(grp); grp.add(a.getThreeMesh(), b.getThreeMesh()); scene.updateMatrixWorld(true);
console.log(AssemblyValidator.checkJoint(a, 'PORT_B', b, 'PORT_A').passed); // false

// D-1：微斜 / 斜向直線段
const one = (end: [number, number, number]) => resolveTrayNetwork(
  { nodes: [{ id: 'a', position: [0, 0, 0] }, { id: 'b', position: end }], segments: [{ id: 's', from: 'a', to: 'b', width: 600 }] },
  ladder,
).straights[0].up;
console.log(one([10000, 1, 0]), one([5000, 5000, 0])); // [0,0,1]（側躺）、[0.707,-0.707,0]（顛倒）

// D-4：無效段讓 pathCenterline 當掉
const lay = resolveTrayNetwork({
  nodes: [{ id: 'a', position: [0, 0, 0] }, { id: 'b', position: [5000, 0, 0] }],
  segments: [{ id: 's', from: 'a', to: 'b', width: 600 }, { id: 'x', from: 'b', to: 'MISSING', width: 600 }],
}, ladder);
lay.pathCenterline(['s', 'x']); // TypeError
```
