# MCR-Studio 接入 3D Component Library：注意事項

> MCR-Studio 接入本 library 時的參考文件，2026-09-24 經你同意放進 library repo（`docs/integration/mcr-studio/`），方便在其他電腦查看。
> 注意：本 repo 是 public，這份文件描述了 MCR-Studio 的內部結構。
> 依據：library `feature/tray-network-resolver` 分支（PR #2）與 MCR-Studio `main`（`ec36943`）的唯讀檢查；這次沒有修改 MCR-Studio repo。

---

## 0. 已確認的決策（你 2026-09-24 的回覆）

| # | 項目 | 決定 |
| :-: | :--- | :--- |
| 1 | 報表長度 | 改用**配件中心線**，這才是真實模型；MCR 原本的轉折線長度不再作為工程長度 |
| 2 | 縮徑三通 | 照型錄做：三通 + 異徑，多出的長度是正確的 |
| 3 | 垂直三通 | 用型錄有的東西接出合理配置，不必保留原設計 |
| 4 | 非型錄寬度 | 同上 |
| 5 | 配件放不下的短段 | 同上，可以改 demo |
| 6 | 斜向 / 非型錄角度 | 設計時只能產生型錄有的東西 |
| 7 | 發佈方式 | library 要能在簡單的公司環境直接用，不用 npm |
| — | 座標 | 從根源處理正確，避免撿料出來現場接不上 |
| — | 重複功能 | 兩邊同一套邏輯：新 model 只在 library 新增，MCR 只來抓 |
| — | 材質 | 以目的為導向選最佳解（見 §5） |
| — | 彎頭縮徑位置 | 加成選項：`bendWidth`（預設彎頭用寬的；`NARROWEST_LEG` = 先縮徑、彎頭用窄的） |
| — | 人工修改配件 | MCR 規劃讓人工修改配件，3D 等相關結果一起更新（見 §4.2） |

---

## 1. 一句話總結

MCR 以後**只負責「畫路網」**（節點 + 直線段，就是現在的 `routeNodes` / `traySegments`）。
**「實際要裝什麼、多長、怎麼接、要買什麼」全部交給 library**：`normalizeTrayNetwork` → `resolveTrayNetwork`。
3D、報表長度、撿料都從同一份 `layout` 推導，MCR 不自己再算。

---

## 2. 放進 MCR 的方式（不用 npm）

1. 從 library repo 複製 `lib/index.iife.js` → MCR 的 `vendor/mcr-parametric-3d.js`。
   - 它會定義全域變數 `McrParametric3D`，讀取全域的 `THREE`。
   - 已驗證可在 MCR 內建的 **three r128**（`vendor/three.min.js`）上執行：43/43 驗收測試通過，幾何與新版 three 完全相同。
2. `build.ps1` 的 `$files` 陣列：把 `'vendor/mcr-parametric-3d.js'` 放在 `'vendor/OrbitControls.js'` **之後**、`'src/domain.js'` **之前**。
3. `THIRD_PARTY_NOTICES.md` 補上 library（Apache-2.0）；`build.ps1` 會把 `vendor/*LICENSE*` 複製進 release，可以另外放一份 `vendor/MCR-PARAMETRIC-3D-LICENSE`。
4. **更新 library**：之後只要重新複製 `lib/index.iife.js`。library 的 CI 會確保 commit 進 repo 的 `lib/` 跟原始碼同步，不會拿到舊檔。
5. 想單獨看模型：library repo 的 `standalone/MCR-3D-Component-Library.html`，雙擊就能開（離線可用）。

---

## 3. 座標：為什麼 MCR 要轉換、根源怎麼處理

- MCR 的專案座標是 `(x, y, z)` 公尺：x 往右，**y 沿 PDF 頁面往下**，z 是高程（`ASSUMPTIONS.md` 有寫）。
- 這個組合是**左手座標系**。three.js 是右手、Y 朝上，所以 MCR 在 `render3d.js` 用 `vector(p) = (x, z, y)` 轉換。這個轉換**本身是對的**，畫面沒有鏡像。
- **危險在於**：任何「左 / 右」判斷（外積、左偏/右偏異徑、轉向、旋轉角）如果直接在專案座標裡算，**結果會左右顛倒**。例如 `scene-objects.js` 的 `rotation.y = -rotation_deg` 就是手動補償過的例子。
- **根源處理**：所有方向判斷都在 library 的單一右手世界座標系裡做。MCR 只透過一個轉換交資料：

```js
const L = McrParametric3D;
const net = L.trayNetworkFromPlan(
  project.routeNodes,                                   // {id, x, y, z}（公尺）
  project.traySegments.map(t => ({ id: t.id, from: t.from, to: t.to, width: t.width_mm, height: t.height_mm })),
  L.PlanFrames.PAGE_Y_DOWN_METRES                       // MCR 的座標約定
);
```

- library 的 3D 網格**已經是公尺、Y 朝上**，而且 `PAGE_Y_DOWN_METRES` 對應的世界座標剛好等於 MCR 的 `vector(p)`（×1000 mm）。所以網格**直接 `scene.add()`，不用任何轉換或縮放**，已經用 Demo02 / North-Process 實測過。
- 世界座標 (mm) 轉回 MCR 專案座標：`L.PlanFrames.PAGE_Y_DOWN_METRES.toPlan([x, y, z])`。
- library 有測試（Case AL）證明：左偏異徑在「圖面的左側」，而用錯座標轉換時一定會被抓到。
- **規則**：MCR 以後不要在專案座標裡自己算左右或轉向，一律交給 library。

---

## 4. 同一套邏輯：資料流

```
app.project（routeNodes / traySegments / cables）   ← MCR 唯一的工程資料
   │ trayNetworkFromPlan(…, PAGE_Y_DOWN_METRES)
   ▼
normalizeTrayNetwork(net, profile)  → { network, changes, issues }
   │ changes 要「套用回 app.project」（見 §4.1），讓專案本身就是型錄可施作的設計
   ▼
resolveTrayNetwork(network, profile) → layout
   ├─ layout.fittings / straights / instances()   → 3D
   ├─ layout.pathCenterline(route)                → 電纜長度（報表）
   ├─ layout.pathPoints(route)                    → 3D 電纜管線沿實際托架中心線
   ├─ layout.bom()                                → 撿料
   └─ layout.issues                               → 設計檢查（ERROR 必須處理）
```

- `profile = L.TraySystemProfiles.get('LADDER_PROFILE_STANDARD')`（梯型 H150、R300、T125）。
- `layout` 是**衍生狀態**：每次 `M.recalculate` 重算一次，不存進 `.crproj`。這符合 MCR 的「One engineering state」規則。
- 效能（Node 實測）：Demo02（60 段、2.6 km）的正規化加解析約 **36 ms**，產生 120 個網格約 **0.24 s**（226k 三角形）。North-Process 約 9 ms / 27 ms。

### 4.1 套用 `changes` 回專案（重要）

`normalizeTrayNetwork` 回傳的 `changes`：

| kind | MCR 要做的事 |
| :--- | :--- |
| `SEGMENT_WIDTH` | 更新 `traySegments[i].width_mm` |
| `SEGMENT_HEIGHT` | 更新 `height_mm` |
| `NODE_ADDED` | 新增 routeNode（位置用 `toPlan()` 轉回），ID 預設 `<原節點>~VT`，可以改成 MCR 的命名規則 |
| `SEGMENT_ADDED` | 新增 traySegment（水平分支，ID 預設 `<原段>~STUB`） |
| `SEGMENT_RECONNECTED` | 垂直段改接到新節點 |
| `NODE_MOVED` | 垂直段的末端節點（通常是 JB 端）**水平移動**。**JB 本身的 `position` 也要一起移**，否則 JB 會跟托架脫開 |

- 電纜路徑用 `L.updateRouteForChanges(cable.routeSegmentIds, normalized)` 補上新的分支段。沒有補的話，那條電纜的長度會量不到（`ok:false`）。
- 建議做法：讓設計者看過這些變更再按「套用」，而不是背景靜默修改（因為 JB 位置會變）。
- 垂直三通的分支方向預設選「離其他托架較遠的一側」，可以用 `options.verticalTeeSide(nodeId) => 1 | -1` 指定。

---

### 4.2 人工修改配件（MCR 規劃）

原則：**MCR 只存「設計者的選擇」，其他全部由 library 重新推導**。人工改完之後重新呼叫一次 normalize + resolve，3D、直槽長度、中心線長度、撿料全部自動更新，不需要 MCR 自己修改任何網格或長度。

```js
const options = {
  bendWidth: 'WIDEST_LEG',            // 專案預設；'NARROWEST_LEG' = 先縮徑再轉彎（彎頭較小）
  nodeOverrides: {                     // MCR 存在自己的專案資料裡，例如 routeNodes[i].fitting
    'N-0005': { radius: 600 },         // 這個四通改用 R600
    'N-0014': { width: 300 },          // 這個下降彎頭用 W300（600 那側自動先縮徑）
  },
};
const normalized = L.normalizeTrayNetwork(net, profile, options);
const layout = L.resolveTrayNetwork(normalized.network, profile, options);
```

- **可以改的項目**：
  - `width`：配件寬度。只能選介於該節點最窄和最寬的腿之間的型錄寬度。比配件窄的腿，異徑放在配件**後**；比配件寬的腿，異徑放在配件**前**。
  - `radius`：彎曲半徑，型錄 300 / 600 / 900。會改變配件佔用長度，兩側直槽自動跟著縮短。
  - 垂直三通的分支方向：`verticalTeeSide(nodeId)`（§4.1）。
- **UI 可選的選項**：`layout.fittingChoices(nodeId)` 回傳 `{ definitionId, width, widthChoices, radius, radiusChoices, override }`。直接用它產生下拉選單，就不會出現無效的選擇。
- **無效或無用的選擇**：不合法的 `width` / `radius` 會回報 ERROR `OVERRIDE_INVALID`，並且忽略、改用規則值；設在沒有配件的節點上會回報 WARNING `OVERRIDE_UNUSED`。
- **改大半徑可能讓段變得太短**：會照常回報 `SEGMENT_TOO_SHORT`，UI 應該把錯誤顯示給設計者。
- **垂直三通節點**：節點上的選擇也會套用到替換用的分支，分支長度會跟著重算（例如 R600 → 2.125 m）。
- **還不能人工改的**：
  - 配件種類。這由路網幾何決定：要把 90° 改成兩個 45°，就要在 MCR 畫成兩個轉折點。
  - 左偏 / 右偏異徑。需要邊軌對齊的路網資訊，之後再加。
- 截圖：`screenshots/05-north-riser-N-0014-reduce-first.png`（先縮徑）、`screenshots/06-north-cross-N-0005-R600.png`（四通 R600）。

---

## 5. 材質：選擇與理由

**選擇：library 只提供幾何，材質由 MCR 提供。**

```js
for (const f of layout.fittings) group.add(f.instance.getThreeMesh({ materials: { body: this.material(color, opacity, active) } }));
for (const s of layout.straights) group.add(s.instance.getThreeMesh({ materials: { body: this.material(color, opacity, active) } }));
```

理由：
1. MCR 用顏色表示工程狀態：選取白色、`fillStatus === 'FAIL'` 紅色、目前路徑青色、Main / Branch 不同色，並用透明度淡化。這些必須由 MCR 決定。
2. MCR 的 `disposeGroup()` 會 dispose 群組內**所有**材質。如果用 library 的共用材質，每次重建都會被 dispose 再重新編譯，也可能影響 library 其他使用者。帶入 MCR 自己的材質後，材質就歸 MCR 管理，dispose 完全安全。
3. 色彩空間：MCR 用 r128 的 `outputEncoding = sRGBEncoding`，並在 `material()` 裡做 `convertSRGBToLinear()`。沿用 MCR 自己的 `material()` 函式，顏色就跟現在的畫面一致。library 預設材質是針對新版 three 的色彩管理調的，在 r128 上顏色會偏。
4. 幾何每次呼叫都是新建的（`getThreeMesh(options)` 不快取），MCR dispose 幾何也安全。
5. 如果不帶材質，library 會回傳快取的共用材質物件，並標記 `userData.sharedMaterial = true`。MCR **不應**走這條路。

每個托架段對應的顏色：
- 直槽：`straight.segmentId` → 對應的 `traySegments` 項目。
- 配件：`fitting.legs[]` 列出連接的 segmentId，可以取其中狀態最嚴重者（例如任一段 FAIL 就顯示紅色），或依 `activeRoute` 判斷。

---

## 6. 3D 要改的地方（`src/render3d.js` → `build()`）

- **取代**現在的 `for (const t of p.traySegments)` 迴圈（兩根邊軌方塊 + InstancedMesh 橫擋），改成 `layout.instances()` 的網格（§5）。
- **點選**：MCR 的點選只往上找一層 parent（`hits[0].object.userData.selection || hits[0].object.parent.userData.selection`），但 library 網格是 `Container → Group → Mesh` 三層。要在每個子 mesh 設定 `userData.selection = { type: 'tray', id: segmentId }`，或保留現在每段的透明 hit box。
- **陰影**：library mesh 預設 `castShadow / receiveShadow = true`。
- **電纜管線**：`M.cableDisplayPoints` + `curve()` 是沿「節點折線 + 0.28 m 圓角」畫的，換成實際配件後會穿出托架。建議改用 `layout.pathPoints(updateRouteForChanges(cable.routeSegmentIds, normalized))`（mm，÷1000 就是 MCR 的 three 座標）。多電纜分道的 lane offset 需要沿這條路徑的側向另外計算（目前 library 沒有提供 lane）。已實測：沿 `pathPoints` 畫的電纜會跟著四通、垂直三通的曲線走。
- **Cable Flow**（發光粒子、流動貼圖）不受影響，只要換掉路徑曲線即可。
- **支架** `M.supportRuns`：仍依 traySegments 計算，不受影響。但支架可能落在配件上，之後可以考慮避開配件範圍（`layout.segmentEnds[seg@node].reachMm`）。

---

## 7. 報表與撿料

### 電纜長度（決策 #1）
```js
const route = L.updateRouteForChanges(cable.routeSegmentIds, normalized);
const r = layout.pathCenterline(route);   // { lengthMm, polylineMm, ok, issues }
cable.geometryLength_m = r.lengthMm / 1000;  // 取代轉折線長度；allowance 照舊加在後面
```
- 範例專案的差異：Demo02 −0.30%（8804.4 → 8777.8 m），North-Process −0.76%，Demo03 −1.98%。Demo03 有 7 條電纜因為 TR-006 太短量不到（見 §8）。
- `ASSUMPTIONS.md` 第 35 行（「Engineering lengths remain piecewise centerlines…」）要改寫，這是工程規則變更。`VALIDATION.md` 也要記錄新的證據。
- 一個 90° 彎（W600、R300）比轉折線短 257.5 mm = Rc × (2 − π/2)，library Case AO 有驗證。

### 托架報表 / 撿料
- `layout.bom()` → `{ fittings: [...依規格分列], straights: [{ spec, totalLengthMm, pieces, runs }] }`。
- 直槽支數：每一段連續的直線（經過直通節點相連的段）以 3 m 定尺切料，`pieces = Σ ⌈run / 3000⌉`。
- 異徑目前**只用 CENTER（中間異徑）**，因為 MCR 的節點模型是中心線共線。LEFT / RIGHT 需要邊軌對齊的設計資訊，目前不會自動選用。
- 小配件（接續板、螺栓、蓋板夾）還沒有 BOM 規則；蓋板依你的決定**不建模**。
- 填充率（OD²）計算用的 W / H 不受影響。

---

## 8. Demo 需要改的地方（決策 #5）

| 專案 | 問題 | 建議 |
| :--- | :--- | :--- |
| Demo03-ProcessScene | `TR-006` 只有 1.000 m，兩端配件需要 **1.450 m** | 移動節點，讓這段 ≥ 1.45 m（再加上直槽也可以）。修正後 7 條電纜就量得到 |
| Demo02-KeyPlotPlan | `N-0035` 是垂直三通 | 套用 normalize：水平三通 + 1.075 m 分支 + 下降彎頭；`A-JB-111` 水平移動 1.075 m（JB 也要移） |
| North-Process / Legacy | 無 | 已可完全解析 |

檢查結果（MCR 的 r128，實際載入 IIFE）：

| 專案 | 正規化 | 解析 | 配件 |
| :--- | :--- | :--- | :--- |
| Demo02 | 1 個垂直三通替換 | OK | 三通 18、異徑 18、90° 彎 5、下降彎 19 |
| Demo03 | — | 1 個 ERROR（TR-006） | 四通 2、三通 8、異徑 13、下降彎 13 |
| North-Process | — | OK | 三通 3、四通 1、異徑 7、下降彎 7 |

---

## 9. 路網設計端要配合的規則（決策 #3、#4、#6）

- **只產生型錄角度**：水平 30 / 45 / 60 / 90°；分岔只能直角（三通）或十字（四通）。`backbone.js` / `routing.js` 的斜向分支要限制在這些角度，Y 形分岔不行。
- **寬度**：`defaults.trayStandards` 目前是 150 / 300 / 450 / 600 / 750 / 900。建議改成型錄寬度 100–1000（每 100 一級）。否則 normalize 會把 150→200、450→500、750→800 自動加寬。
- **最短段長**：兩端都有配件的段必須 ≥ 兩端佔用長度的總和（W600、R300、T125）：

| 配件 | 從節點往外佔用 |
| :--- | :--- |
| 90° 水平彎 | Rc·tan45° + T = (R + W/2) + 125 → W600：725 mm；W300：575 mm |
| 45° 水平彎 | (R + W/2)·tan22.5° + 125 → W600：373.5 mm |
| 三通 / 四通 | W/2 + R + T → W600：725 mm（窄的那側再加異徑 600 mm） |
| 90° 垂直彎 | (R + H/2) + T = 500 mm |
| 直線異徑 | 600 mm（在較窄的那段） |

  佔用長度直接從 `layout.segmentEnds['<segId>@<nodeId>'].reachMm` 取得，不要在 MCR 自己寫公式。
- **垂直分岔**：主線上直接往下的分岔，由 normalize 自動轉換。若垂直段的另一端還連著其他托架（不是末端），會回報 ERROR，要重新設計。
- **異徑位置規則**：用 `options.bendWidth` 選擇。預設 `WIDEST_LEG`：彎頭用寬的，異徑放在窄的那側，例如 `N-0014` 是 W600 下降彎、異徑在垂直段。`NARROWEST_LEG`：先在寬的那側縮徑，彎頭用窄的（較小、較便宜）。個別節點可以再用 `nodeOverrides` 指定。三通、四通預設用最寬的腿。新的規則一律加在 library，**不要在 MCR 自己改**。

---

## 10. 測試建議（MCR 端）

- MCR 的 `tests/*.cjs` 可以像我的檢查腳本一樣，用 `vm` 先載入 `vendor/three.min.js` 再載入 `vendor/mcr-parametric-3d.js`（見 `harness/check-mcr-samples.cjs`）。
- 建議至少檢查：
  1. 每個 sample：`resolveTrayNetwork(...).issues` 沒有 ERROR（修好 Demo03 後）。
  2. 每條電纜 `pathCenterline(...).ok === true`，而且報表長度等於 `lengthMm / 1000 + allowances`。
  3. 套用 normalize changes 後，存檔再讀檔，結果一致。
  4. 3D 截圖檢查：配件位置、電纜沿托架走。
- 視覺對照：`screenshots/`（r128 實際渲染；橘色 = 配件、綠色 = 異徑、灰色 = 直槽、紅點 = MCR 節點）。
- `harness/`：模擬 MCR 載入方式的測試頁。把 MCR 的 `three.min.js`、`OrbitControls.js` 和本 library 的 `lib/index.iife.js`（改名為 `mcr-parametric-3d.js`）複製到同一個資料夾，再用 `node harness/make-data.cjs <專案.crproj> north` 產生資料檔，然後在瀏覽器打開 `north.html`。URL 參數：`?focus=<節點>&bend=narrow&ovr=<JSON>`。

---

## 11. 容易踩到的坑

1. **不要在專案座標裡算左右**（§3）。
2. **不要把 library 的共用材質交給 MCR 的 `disposeGroup`**（§5）：一律帶入 MCR 自己的材質。
3. **全域名稱**：`McrParametric3D`，不會跟 `globalThis.MCR` 衝突。
4. **單位**：library 的工程資料是 mm（ports、`pathPoints`、`reachMm`），網格是公尺。MCR 的報表用公尺，記得 ÷1000。
5. **套用 normalize changes 時 JB 也要跟著移**（§4.1）。
6. **電纜路徑要先 `updateRouteForChanges`**，否則經過垂直三通的電纜量不到。
7. **不要在 MCR 複製 library 的判斷邏輯**：佔用長度、配件選擇、長度計算都從 `layout` 取，新的 model / 規則只在 library 新增。
8. **發佈 ZIP**：`build.ps1` 會把 `vendor/*` 打包進 HTML，不需要額外處理；授權檔記得加。
9. MCR `AGENTS.md` 的規定（不准 npm、PowerShell 串接、`MCR` global）都跟這個接法相容。它要求工程規則變更記錄在 `ASSUMPTIONS.md` / `VALIDATION.md` / `TASKS.md`，接入時要一起更新。
