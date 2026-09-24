/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export function Badge({ tone, children, title }: { tone: 'ok' | 'info' | 'warn' | 'bad' | 'neutral'; children: React.ReactNode; title?: string }) {
  return (
    <span className={`badge badge-${tone}`} title={title}>
      {children}
    </span>
  );
}

export function Section({ title, right, children, className = '' }: { title: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card p-3 space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="section-title">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

export function KV({ label, value, hint, mono = true }: { label: string; value: React.ReactNode; hint?: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[12px] leading-5">
      <span className="t2 shrink-0">{label}</span>
      <span className={`t1 text-right ${mono ? 'mono' : ''}`}>
        {value}
        {hint && <span className="t3 ml-1.5 text-[10.5px]">{hint}</span>}
      </span>
    </div>
  );
}

export function Field({ label, children, note }: { label: string; children: React.ReactNode; note?: string }) {
  return (
    <label className="block space-y-1">
      <div className="flex items-center justify-between text-[11.5px]">
        <span className="t2 font-medium">{label}</span>
        {note && <span className="t3 text-[10.5px]">{note}</span>}
      </div>
      {children}
    </label>
  );
}

export function SelectField<T extends string | number>({
  value,
  options,
  onChange,
  format,
}: {
  value: T;
  options: T[];
  onChange: (v: T) => void;
  format?: (v: T) => string;
}) {
  return (
    <select
      className="field mono"
      value={String(value)}
      onChange={(e) => {
        const raw = e.target.value;
        const found = options.find((o) => String(o) === raw);
        if (found !== undefined) onChange(found);
      }}
    >
      {options.map((o) => (
        <option key={String(o)} value={String(o)}>
          {format ? format(o) : String(o)}
        </option>
      ))}
    </select>
  );
}

export function SliderField({
  value,
  min,
  max,
  step,
  onChange,
  unit = 'mm',
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input type="range" className="flex-1 accent-[var(--accent)]" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
      <span className="mono t1 text-[12px] w-[72px] text-right">
        {value}
        {unit && <span className="t3"> {unit}</span>}
      </span>
    </div>
  );
}

export function ToggleButton({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button type="button" className="btn" data-active={active} onClick={onClick} title={title}>
      {children}
    </button>
  );
}

/** Green / red / grey status dot. */
export function Dot({ tone }: { tone: 'ok' | 'bad' | 'warn' | 'info' | 'neutral' }) {
  const color = { ok: '#16a34a', bad: '#dc2626', warn: '#d97706', info: '#2563eb', neutral: '#94a3b8' }[tone];
  return <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: color }} />;
}
