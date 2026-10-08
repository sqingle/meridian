"use client";
import { useMemo, useState } from "react";
import type { Deal } from "@/lib/deals";
import {
  cycleDays,
  isLost,
  isOpen,
  isWon,
  money,
  pct,
  pipelineByStage,
  repPerformance,
  revenueBy,
  revenueSeries,
  summary,
  winRateBy,
  type Granularity,
  type WinRateDim,
} from "@/lib/analytics";
import { BarChart, Donut, HBar, PALETTE } from "./charts";

function Card({ title, subtitle, action, className = "", children }: { title: string; subtitle?: string; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={`min-w-0 rounded-3xl border border-line bg-surface p-4 sm:p-6 ${className}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-mute">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-full border border-line bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={o.value === value}
          className={`rounded-full px-3.5 py-1 text-xs font-medium transition ${o.value === value ? "bg-ink text-canvas" : "text-mute hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Kpi({ label, value, hint, tone, wide }: { wide?: boolean; label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className={`min-w-0 rounded-2xl border border-line bg-surface px-5 py-4 ${wide ? "col-span-2 lg:col-span-1" : ""}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-mute">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className={`mt-0.5 text-xs ${tone ?? "text-faint"}`}>{hint}</p>}
    </div>
  );
}

const STAGE_STYLE: Record<string, string> = {
  "Closed Won": "bg-good/15 text-good",
  "Closed Lost": "bg-bad/15 text-bad",
  Negotiation: "bg-warn/15 text-warn",
  "Proposal Sent": "bg-gold/15 text-gold",
  "Demo Scheduled": "bg-violet/15 text-violet",
  Qualified: "bg-accent/15 text-accent",
  Prospecting: "bg-surface-3 text-mute",
};

type SortKey = "company" | "rep" | "stage" | "value" | "days";

export function Dashboard({ deals }: { deals: Deal[] }) {
  const [gran, setGran] = useState<Granularity>("month");
  const [dim, setDim] = useState<WinRateDim>("leadSource");
  const [filter, setFilter] = useState<"all" | "won" | "lost" | "open">("won");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "days", dir: -1 });
  const [limit, setLimit] = useState(10);
  const [allReps, setAllReps] = useState(false);

  const s = useMemo(() => summary(deals), [deals]);
  const series = useMemo(() => revenueSeries(deals, gran), [deals, gran]);
  const products = useMemo(() => revenueBy(deals, "product"), [deals]);
  const reps = useMemo(() => repPerformance(deals), [deals]);
  const stages = useMemo(() => pipelineByStage(deals), [deals]);
  const rates = useMemo(() => winRateBy(deals, dim), [deals, dim]);

  const lostAvg = useMemo(() => {
    const l = deals.filter(isLost).map(cycleDays);
    return l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0;
  }, [deals]);

  const rows = useMemo(() => {
    const f = deals.filter((d) => (filter === "all" ? true : filter === "won" ? isWon(d) : filter === "lost" ? isLost(d) : isOpen(d)));
    const val = (d: Deal) =>
      sort.key === "company" ? d.company : sort.key === "rep" ? d.rep : sort.key === "stage" ? d.stage : sort.key === "value" ? d.value : cycleDays(d);
    return [...f].sort((a, b) => {
      const x = val(a), y = val(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  }, [deals, filter, sort]);

  const dates = deals.map((d) => d.created).sort();
  const range = `${dates[0]} → ${deals.map((d) => d.close).sort().at(-1)}`;
  const maxRep = Math.max(...reps.map((r) => r.won), 1);
  const maxStage = Math.max(...stages.map((x) => x.value), 1);
  const th = (key: SortKey, label: string, right = false) => (
    <th className={`pb-3 font-medium ${right ? "text-right" : "text-left"}`}>
      <button
        onClick={() => setSort((p) => ({ key, dir: p.key === key ? (-p.dir as 1 | -1) : key === "company" || key === "rep" ? 1 : -1 }))}
        className={`inline-flex items-center gap-1 transition hover:text-ink ${sort.key === key ? "text-ink" : ""}`}
      >
        {label}
        <span className="text-[10px]">{sort.key === key ? (sort.dir === 1 ? "▲" : "▼") : ""}</span>
      </button>
    </th>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Won revenue" value={money(s.wonRevenue, true)} hint={`${s.wonCount} deals closed won`} />
        <Kpi label="Win rate" value={pct(s.winRate)} hint={`${s.wonCount} won · ${s.lostCount} lost`} tone={s.winRate >= 0.5 ? "text-good" : "text-warn"} />
        <Kpi label="Avg deal size" value={money(s.avgDealSize, true)} hint="closed won" />
        <Kpi label="Avg time to close" value={`${Math.round(s.avgDaysToClose)} days`} hint="closed won" />
        <Kpi wide label="Open pipeline" value={money(s.openValue, true)} hint={`${money(s.weightedPipeline, true)} weighted · ${s.openCount} deals`} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Card
          className="lg:col-span-8"
          title="Revenue over time"
          subtitle={`Closed-won revenue by close date · ${money(s.wonRevenue)} total`}
          action={<Segmented value={gran} onChange={setGran} options={[{ value: "month", label: "Monthly" }, { value: "quarter", label: "Quarterly" }]} />}
        >
          <BarChart key={gran} points={series} />
        </Card>

        <Card className="lg:col-span-4" title="Revenue by product" subtitle="Closed-won">
          <Donut data={products} centerLabel="Total won" />
        </Card>

        <Card className="lg:col-span-7" title="Sales rep performance" subtitle="Ranked by closed-won revenue">
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-xs uppercase tracking-wider text-mute">
                <tr>
                  <th className="pb-3 text-left font-medium">Rep</th>
                  <th className="pb-3 pr-6 text-left font-medium">Won revenue</th>
                  <th className="pb-3 text-right font-medium">Win rate</th>
                  <th className="pb-3 text-right font-medium">Avg days</th>
                  <th className="pb-3 text-right font-medium">Open</th>
                </tr>
              </thead>
              <tbody>
                {(allReps ? reps : reps.slice(0, 8)).map((r, i) => (
                  <tr key={r.rep} className="border-t border-line">
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span className="mr-2 inline-block w-4 text-xs text-faint tabular-nums">{i + 1}</span>
                      {r.rep}
                    </td>
                    <td className="py-3 pr-6">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-28 shrink-0 overflow-hidden rounded-full bg-surface-3">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${(r.won / maxRep) * 100}%` }} />
                        </div>
                        <span className="tabular-nums">{money(r.won, true)}</span>
                        <span className="text-xs text-faint">({r.wonCount})</span>
                      </div>
                    </td>
                    <td className={`py-3 text-right tabular-nums ${r.winRate >= 0.7 ? "text-good" : r.winRate < 0.4 ? "text-bad" : ""}`}>{pct(r.winRate)}</td>
                    <td className="py-3 text-right tabular-nums text-mute">{r.avgDays ? Math.round(r.avgDays) : "—"}</td>
                    <td className="py-3 text-right tabular-nums text-mute">{money(r.openValue, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {reps.length > 8 && (
            <button onClick={() => setAllReps((v) => !v)} className="mt-4 rounded-full border border-line px-3 py-1.5 text-xs text-mute transition hover:border-line-strong hover:text-ink">
              {allReps ? "Show top 8" : `Show all ${reps.length} reps`}
            </button>
          )}
        </Card>

        <Card className="lg:col-span-5" title="Open pipeline by stage" subtitle={`${money(s.openValue, true)} total · ${money(s.weightedPipeline, true)} probability-weighted`}>
          <div className="space-y-4">
            {stages.map((st, i) => (
              <HBar key={st.stage} label={st.stage} sub={`${st.count} deals`} value={st.value} max={maxStage} right={`${money(st.value, true)}`} color={PALETTE[i % 5]} />
            ))}
          </div>
        </Card>

        <Card
          className="lg:col-span-7"
          title="Time to close"
          subtitle={`Won avg ${Math.round(s.avgDaysToClose)}d · Lost avg ${Math.round(lostAvg)}d · open deals show planned days`}
          action={
            <Segmented
              value={filter}
              onChange={(v) => {
                setFilter(v);
                setLimit(10);
              }}
              options={[{ value: "all", label: "All" }, { value: "won", label: "Won" }, { value: "lost", label: "Lost" }, { value: "open", label: "Open" }]}
            />
          }
        >
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-xs uppercase tracking-wider text-mute">
                <tr>{th("company", "Customer")}{th("rep", "Rep")}{th("stage", "Stage")}{th("value", "Value", true)}{th("days", "Days to close", true)}</tr>
              </thead>
              <tbody>
                {rows.slice(0, limit).map((d) => (
                  <tr key={d.id} className="border-t border-line">
                    <td className="max-w-[220px] truncate py-2.5 pr-3">{d.company}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-mute">{d.rep}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_STYLE[d.stage]}`}>{d.stage}</span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{money(d.value, true)}</td>
                    <td className={`py-2.5 text-right tabular-nums ${isOpen(d) ? "text-faint" : ""}`}>
                      {isOpen(d) ? "~" : ""}
                      {cycleDays(d)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-mute">
            <span>
              Showing {Math.min(limit, rows.length)} of {rows.length}
            </span>
            {limit < rows.length && (
              <button onClick={() => setLimit((l) => l + 15)} className="rounded-full border border-line px-3 py-1.5 transition hover:border-line-strong hover:text-ink">
                Show more
              </button>
            )}
          </div>
        </Card>

        <Card
          className="lg:col-span-5"
          title="Win rate"
          subtitle="Closed deals only"
          action={<Segmented value={dim} onChange={setDim} options={[{ value: "leadSource", label: "Source" }, { value: "competitor", label: "Competitor" }, { value: "industry", label: "Industry" }]} />}
        >
          <div className="space-y-4">
            {rates.map((r) => (
              <HBar
                key={r.label}
                label={r.label}
                sub={`${r.won}/${r.total}`}
                value={r.rate}
                max={1}
                right={pct(r.rate)}
                color={r.rate >= 0.7 ? "var(--color-good)" : r.rate >= 0.5 ? "var(--color-accent)" : "var(--color-warn)"}
              />
            ))}
          </div>
        </Card>
      </div>
      <p className="pt-1 text-center text-xs text-faint">
        {s.totalDeals.toLocaleString()} deals · created → close range {range}
      </p>
    </div>
  );
}
