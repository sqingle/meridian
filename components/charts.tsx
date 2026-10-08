"use client";
import { useState } from "react";
import { money, type RevenuePoint } from "@/lib/analytics";

export const PALETTE = ["#2fd8e8", "#c45cff", "#ff5a4d", "#3b8bff", "#ff7ab8", "#4e6c88"];

/** Round the axis so its four gridlines land on clean values ($1M, $2M, ...). */
function niceAxis(v: number) {
  if (v <= 0) return { max: 1, step: 0.25 };
  const raw = v / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
  return { max: step * 4, step };
}

/** Hatched dark bars with the active bar lit in cobalt, as in the branding. */
export function BarChart({ points }: { points: RevenuePoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const peak = points.reduce((best, p, i) => (p.value > points[best].value ? i : best), 0);
  const active = hover ?? peak;
  const { max, step } = niceAxis(Math.max(...points.map((p) => p.value), 0));
  const ticks = [0, 1, 2, 3, 4].map((i) => step * i);
  const H = 240;

  if (!points.length) return <p className="py-16 text-center text-sm text-mute">No closed-won deals yet.</p>;

  const prev = points[active - 1];
  const cur = points[active];
  const delta = prev && prev.value > 0 ? (cur.value - prev.value) / prev.value : null;

  return (
    <div className="flex gap-3 pt-8" onMouseLeave={() => setHover(null)}>
      <div className="relative w-12 shrink-0 text-right text-xs text-faint" style={{ height: H }}>
        {ticks.map((t) => (
          <span key={t} className="absolute right-0 -translate-y-1/2" style={{ bottom: `${(t / max) * 100}%` }}>
            {money(t, true).replace(".0", "")}
          </span>
        ))}
      </div>
      <div className="scroll-thin -mt-8 min-w-0 flex-1 overflow-x-auto pb-1 pt-8">
        <div className="relative flex items-end gap-2" style={{ height: H, minWidth: points.length * 34 }}>
          {ticks.slice(1).map((t) => (
            <div key={t} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line/70" style={{ bottom: `${(t / max) * 100}%` }} />
          ))}
          {points.map((p, i) => {
            const h = Math.max((p.value / max) * 100, p.value > 0 ? 2 : 0);
            const on = i === active;
            return (
              <div key={p.key} className="relative flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)}>
                <div
                  className={`relative w-full rounded-xl border transition-all duration-200 ${
                    on ? "border-accent/60 bg-gradient-to-b from-accent to-accent-deep shadow-[0_0_28px_-4px_rgb(47_216_232/0.5)]" : "hatch border-line"
                  }`}
                  style={{ height: `${h}%`, minHeight: p.value ? 8 : 0 }}
                >
                  {!on && p.value > 0 && <span className="absolute left-1/2 top-1.5 h-0.5 w-1/2 -translate-x-1/2 rounded-full bg-mute/60" />}
                  {on && p.value > 0 && (
                    <>
                      {delta !== null && (
                        <span className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-canvas">
                          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta * 100).toFixed(0)}%
                        </span>
                      )}
                      <span className="absolute inset-x-0 bottom-2 text-center text-[11px] font-semibold text-canvas">
                        {money(p.value, true)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex gap-2" style={{ minWidth: points.length * 34 }}>
          {points.map((p, i) => (
            <span key={p.key} className={`flex-1 text-center text-xs ${i === active ? "text-ink" : "text-mute"}`}>
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Donut({ data, centerLabel }: { data: { label: string; value: number }[]; centerLabel: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((a, b) => a + b.value, 0);
  const R = 74;
  const C = 2 * Math.PI * R;
  const gap = data.length > 1 ? 5 : 0;
  const offsets = data.map((_, i) => data.slice(0, i).reduce((a, b) => a + (b.value / total) * C, 0));
  const focus = hover !== null ? data[hover] : null;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative shrink-0">
        <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
          <circle cx="100" cy="100" r={R} fill="none" stroke="var(--color-surface-3)" strokeWidth="24" />
          {data.map((d, i) => {
            const len = (d.value / total) * C;
            return (
              <circle
                key={d.label}
                cx="100"
                cy="100"
                r={R}
                fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={hover === i ? 28 : 24}
                strokeDasharray={`${Math.max(len - gap, 1)} ${C}`}
                strokeDashoffset={-offsets[i]}
                strokeLinecap="round"
                opacity={hover === null || hover === i ? 1 : 0.35}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-semibold tracking-tight">{money(focus ? focus.value : total, true)}</span>
          <span className="text-xs text-mute">{focus ? `${focus.label} · ${((focus.value / total) * 100).toFixed(0)}%` : centerLabel}</span>
        </div>
      </div>
      <ul className="w-full space-y-2.5 text-sm">
        {data.map((d, i) => (
          <li
            key={d.label}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className="flex items-center justify-between gap-3"
          >
            <span className="flex items-center gap-2 text-mute">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
              {d.label}
            </span>
            <span className="tabular-nums text-ink">{money(d.value, true)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HBar({
  label,
  value,
  max,
  right,
  color = "var(--color-accent)",
  sub,
}: {
  label: string;
  value: number;
  max: number;
  right: string;
  color?: string;
  sub?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate text-ink">
          {label} {sub && <span className="text-xs text-faint">{sub}</span>}
        </span>
        <span className="tabular-nums text-mute">{right}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${max ? (value / max) * 100 : 0}%`, background: color }} />
      </div>
    </div>
  );
}
