/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Play, Download } from 'lucide-react';
import { BomManager, BomScope, type BomScopeType, type ComponentInstance, type TestSuiteReport } from '../index.ts';
import { Badge } from './ui.tsx';

export function TestsView({ report, running, onRun }: { report: TestSuiteReport | null; running: boolean; onRun: () => void }) {
  const [onlyFailed, setOnlyFailed] = useState(false);
  const cases = (report?.cases ?? []).filter((c) => !onlyFailed || !c.passed);
  return (
    <div className="absolute inset-0 z-30 flex flex-col p-5 gap-4 overflow-hidden" style={{ background: 'var(--app-bg)' }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold t1">工程驗收測試 Engineering Acceptance Suite</h2>
          <p className="text-[12px] t2">
            引擎不變量 (Case A–V) 與型錄幾何 / 實體裝配驗證 (Case W–AK)。結果為實際執行值，非預設文字。
          </p>
        </div>
        <div className="flex items-center gap-2">
          {report && (
            <Badge tone={report.allPassed ? 'ok' : 'bad'}>
              {report.totalPassed} / {report.totalCases} PASS{report.totalFailed > 0 ? ` · ${report.totalFailed} FAIL` : ''}
            </Badge>
          )}
          <button type="button" className="btn" data-active={onlyFailed} onClick={() => setOnlyFailed((v) => !v)}>
            只看失敗
          </button>
          <button type="button" className="btn btn-primary" onClick={onRun} disabled={running}>
            <Play className="w-3.5 h-3.5" />
            {running ? '執行中…' : report ? '重新執行' : '執行測試'}
          </button>
        </div>
      </div>
      {!report && <div className="t2 text-sm">{running ? 'Running…' : '尚未執行 — 按「執行測試」。'}</div>}
      {report && (
        <div className="text-[11px] t3 mono">
          Last run {new Date(report.timestamp).toLocaleString()} · {report.totalCases} cases
        </div>
      )}
      <div className="flex-1 overflow-y-auto scroll-thin grid grid-cols-1 xl:grid-cols-2 gap-2.5 content-start pr-1">
        {cases.map((c) => (
          <div key={c.id} className="card p-3 space-y-1.5" style={c.passed ? undefined : { borderColor: '#ef4444' }}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="mono text-[11px] font-bold px-1.5 py-0.5 rounded card-muted t2">{c.id}</span>
                <span className="text-[12.5px] font-semibold t1 truncate">{c.name}</span>
              </div>
              {c.passed ? <CheckCircle2 className="w-4.5 h-4.5 shrink-0" color="#16a34a" /> : <XCircle className="w-4.5 h-4.5 shrink-0" color="#dc2626" />}
            </div>
            <div className="text-[11.5px] t2">
              <span className="t3">Expected: </span>
              {c.expected}
            </div>
            <div className="text-[11.5px] mono card-muted px-2 py-1" style={{ color: c.passed ? undefined : '#dc2626' }}>
              {c.actual}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BomView({ instances, title }: { instances: ComponentInstance[]; title: string }) {
  const [scope, setScope] = useState<BomScopeType | 'ALL'>('ALL');
  const report = useMemo(() => BomManager.generateBom(instances, { scope }), [instances, scope]);
  const exportCsv = () => {
    const rows = [
      ['Item', 'Definition ID', 'Name', 'Name Zh', 'Scope', 'Specification', 'Quantity', 'Unit'],
      ...report.items.map((it) => [it.itemNumber, it.definitionId, it.name, it.nameZh, it.bomScope, `"${it.spec}"`, it.quantity, it.unit]),
    ];
    const blob = new Blob(['﻿' + rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `MCR_BOM_${Date.now()}.csv`;
    a.click();
  };
  return (
    <div className="absolute inset-0 z-30 flex flex-col p-5 gap-4 overflow-hidden" style={{ background: 'var(--app-bg)' }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold t1">採購材料清單 BOM</h2>
          <p className="text-[12px] t2">{title}。規格欄位由同一組工程尺寸公式產生；不同尺寸分列；組合件子構件不重複計價。</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="field w-56" value={scope} onChange={(e) => setScope(e.target.value as BomScopeType | 'ALL')}>
            <option value="ALL">All scopes</option>
            {Object.values(BomScope)
              .filter((s) => s !== BomScope.VISUAL_ONLY)
              .map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
          </select>
          <Badge tone={report.hasDoubleCounting ? 'bad' : 'ok'}>{report.hasDoubleCounting ? 'DOUBLE COUNTING' : 'NO DOUBLE COUNTING'}</Badge>
          <button type="button" className="btn btn-primary" onClick={exportCsv}>
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto scroll-thin card">
        <table className="w-full text-left text-[12px]">
          <thead className="sticky top-0" style={{ background: 'var(--panel-2)' }}>
            <tr className="t2">
              <th className="py-2 px-3">#</th>
              <th className="py-2 px-3">Component</th>
              <th className="py-2 px-3">Scope</th>
              <th className="py-2 px-3">Specification</th>
              <th className="py-2 px-3 text-right">Qty</th>
              <th className="py-2 px-3">Unit</th>
            </tr>
          </thead>
          <tbody>
            {report.items.map((it) => (
              <tr key={`${it.itemNumber}`} className="border-t line">
                <td className="py-2 px-3 mono t3">{it.itemNumber}</td>
                <td className="py-2 px-3">
                  <div className="t1 font-medium">{it.nameZh}</div>
                  <div className="t3 mono text-[10.5px]">{it.definitionId}</div>
                </td>
                <td className="py-2 px-3 mono text-[10.5px] t2">{it.bomScope}</td>
                <td className="py-2 px-3 mono t1">{it.spec}</td>
                <td className="py-2 px-3 mono text-right t1 font-bold">{it.quantity}</td>
                <td className="py-2 px-3 t2">{it.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-[11px] t3">
        Small accessories (splice plates, clamps, bolts, grounding pieces) are not modelled as routing geometry; they are to be derived by BOM rules from joint / support counts.
      </div>
    </div>
  );
}
