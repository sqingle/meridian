import { STAGES, daysBetween, type Deal } from "./deals";

export type Granularity = "month" | "quarter";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const isWon = (d: Deal) => d.stage === "Closed Won";
export const isLost = (d: Deal) => d.stage === "Closed Lost";
export const isOpen = (d: Deal) => !isWon(d) && !isLost(d);
export const cycleDays = (d: Deal) => daysBetween(d.created, d.close);

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const avg = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0);

export function summary(deals: Deal[]) {
  const won = deals.filter(isWon);
  const lost = deals.filter(isLost);
  const open = deals.filter(isOpen);
  const closed = won.length + lost.length;
  return {
    totalDeals: deals.length,
    wonRevenue: sum(won.map((d) => d.value)),
    wonCount: won.length,
    lostCount: lost.length,
    winRate: closed ? won.length / closed : 0,
    avgDealSize: avg(won.map((d) => d.value)),
    avgDaysToClose: avg(won.map(cycleDays)),
    openCount: open.length,
    openValue: sum(open.map((d) => d.value)),
    weightedPipeline: sum(open.map((d) => (d.value * d.probability) / 100)),
  };
}

export type RevenuePoint = { key: string; label: string; value: number; deals: number };

/** Closed-won revenue bucketed by close date, with empty periods filled in so gaps stay visible. */
export function revenueSeries(deals: Deal[], by: Granularity): RevenuePoint[] {
  const won = deals.filter(isWon);
  if (!won.length) return [];
  const bucket = (iso: string) => {
    const y = +iso.slice(0, 4);
    const m = +iso.slice(5, 7) - 1;
    return by === "month" ? y * 12 + m : y * 4 + Math.floor(m / 3);
  };
  const map = new Map<number, { value: number; deals: number }>();
  for (const d of won) {
    const k = bucket(d.close);
    const cur = map.get(k) ?? { value: 0, deals: 0 };
    cur.value += d.value;
    cur.deals += 1;
    map.set(k, cur);
  }
  const keys = [...map.keys()];
  const lo = Math.min(...keys);
  const hi = Math.max(...keys);
  const out: RevenuePoint[] = [];
  for (let k = lo; k <= hi; k++) {
    const v = map.get(k) ?? { value: 0, deals: 0 };
    let label: string;
    if (by === "month") {
      label = `${MONTHS[k % 12]} ’${String(Math.floor(k / 12)).slice(2)}`;
    } else {
      label = `Q${(k % 4) + 1} ’${String(Math.floor(k / 4)).slice(2)}`;
    }
    out.push({ key: String(k), label, ...v });
  }
  return out;
}

export function pipelineByStage(deals: Deal[]) {
  return STAGES.map((stage) => {
    const ds = deals.filter((d) => d.stage === stage);
    return {
      stage,
      count: ds.length,
      value: sum(ds.map((d) => d.value)),
      weighted: sum(ds.map((d) => (d.value * d.probability) / 100)),
    };
  });
}

export type RepRow = {
  rep: string;
  won: number;
  wonCount: number;
  lostCount: number;
  winRate: number;
  avgDays: number;
  openValue: number;
};

export function repPerformance(deals: Deal[]): RepRow[] {
  const reps = [...new Set(deals.map((d) => d.rep))];
  return reps
    .map((rep) => {
      const ds = deals.filter((d) => d.rep === rep);
      const w = ds.filter(isWon);
      const l = ds.filter(isLost);
      return {
        rep,
        won: sum(w.map((d) => d.value)),
        wonCount: w.length,
        lostCount: l.length,
        winRate: w.length + l.length ? w.length / (w.length + l.length) : 0,
        avgDays: avg(w.map(cycleDays)),
        openValue: sum(ds.filter(isOpen).map((d) => d.value)),
      };
    })
    .sort((a, b) => b.won - a.won);
}

export function revenueBy(deals: Deal[], key: "product" | "industry" | "leadSource") {
  const map = new Map<string, number>();
  for (const d of deals.filter(isWon)) map.set(d[key], (map.get(d[key]) ?? 0) + d.value);
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export type WinRateDim = "leadSource" | "competitor" | "industry";

export function winRateBy(deals: Deal[], dim: WinRateDim) {
  const map = new Map<string, { won: number; lost: number }>();
  for (const d of deals) {
    if (!isWon(d) && !isLost(d)) continue;
    const k = d[dim];
    const cur = map.get(k) ?? { won: 0, lost: 0 };
    if (isWon(d)) cur.won++;
    else cur.lost++;
    map.set(k, cur);
  }
  return [...map.entries()]
    .map(([label, v]) => ({ label, ...v, total: v.won + v.lost, rate: v.won / (v.won + v.lost) }))
    .sort((a, b) => b.rate - a.rate);
}

export const money = (n: number, compact = false) =>
  compact
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(n)
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const pct = (n: number, digits = 0) => `${(n * 100).toFixed(digits)}%`;
