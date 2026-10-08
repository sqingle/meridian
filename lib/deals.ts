// Isomorphic: shared by the browser (CSV parsing) and the server (validating share payloads).

export const STAGES = [
  "Prospecting",
  "Qualified",
  "Demo Scheduled",
  "Proposal Sent",
  "Negotiation",
] as const;

export type Stage = (typeof STAGES)[number] | "Closed Won" | "Closed Lost";

export type Deal = {
  id: string;
  company: string;
  industry: string;
  rep: string;
  leadSource: string;
  product: string;
  stage: Stage;
  value: number;
  created: string; // ISO yyyy-mm-dd
  close: string; // ISO yyyy-mm-dd (actual for closed deals, expected for open)
  daysInStage: number;
  lastActivityDays: number;
  probability: number;
  competitor: string;
  stakeholders: number;
  nextAction: string;
};

export const REQUIRED_COLUMNS = [
  "deal_id",
  "company_name",
  "industry",
  "rep_name",
  "lead_source",
  "product_line",
  "deal_stage",
  "deal_value",
  "created_date",
  "close_date",
  "days_in_stage",
  "last_activity_days_ago",
  "probability_pct",
  "competitor_mentioned",
  "num_stakeholders",
  "next_action",
] as const;

export const MAX_DEALS = 20000;

const VALID_STAGES = new Set<string>([...STAGES, "Closed Won", "Closed Lost"]);

export function parseDate(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const s = input.trim();
  let y: number, m: number, d: number;
  let match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (match) {
    m = +match[1];
    d = +match[2];
    y = +match[3];
  } else if ((match = /^(\d{4})-(\d{2})-(\d{2})/.exec(s))) {
    y = +match[1];
    m = +match[2];
    d = +match[3];
  } else return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
};

/** Coerce a raw record (CSV row or JSON object keyed by CSV headers or Deal keys) into a Deal. */
export function toDeal(r: Record<string, unknown>): Deal | null {
  const g = (csv: string, key: keyof Deal) => (r[csv] !== undefined ? r[csv] : r[key]);
  const id = str(g("deal_id", "id"));
  const stage = str(g("deal_stage", "stage"));
  const value = num(g("deal_value", "value"));
  const created = parseDate(g("created_date", "created"));
  const close = parseDate(g("close_date", "close"));
  if (!id || !VALID_STAGES.has(stage) || value === null || value < 0 || !created || !close) return null;
  return {
    id,
    company: str(g("company_name", "company")) || "Unknown",
    industry: str(g("industry", "industry")) || "Unknown",
    rep: str(g("rep_name", "rep")) || "Unassigned",
    leadSource: str(g("lead_source", "leadSource")) || "Unknown",
    product: str(g("product_line", "product")) || "Unknown",
    stage: stage as Stage,
    value,
    created,
    close,
    daysInStage: num(g("days_in_stage", "daysInStage")) ?? 0,
    lastActivityDays: num(g("last_activity_days_ago", "lastActivityDays")) ?? 0,
    probability: num(g("probability_pct", "probability")) ?? 0,
    competitor: str(g("competitor_mentioned", "competitor")) || "None",
    stakeholders: num(g("num_stakeholders", "stakeholders")) ?? 0,
    nextAction: str(g("next_action", "nextAction")),
  };
}

/** Server-side guard for untrusted share payloads. Returns null if anything is malformed. */
export function sanitizeDeals(input: unknown): Deal[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_DEALS) return null;
  const out: Deal[] = [];
  for (const r of input) {
    if (!r || typeof r !== "object") return null;
    const d = toDeal(r as Record<string, unknown>);
    if (!d) return null;
    out.push(d);
  }
  return out;
}

export const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
