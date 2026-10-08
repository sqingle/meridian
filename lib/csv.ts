import Papa from "papaparse";
import { REQUIRED_COLUMNS, MAX_DEALS, toDeal, type Deal } from "./deals";

export type ParseResult =
  | { ok: true; deals: Deal[]; skipped: number }
  | { ok: false; error: string };

export function parseDealsCsv(text: string): ParseResult {
  const res = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().replace(/^﻿/, "").toLowerCase(),
  });

  const headers = res.meta.fields ?? [];
  const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length) {
    return {
      ok: false,
      error: `This doesn't look like a Meridian sales export. Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`,
    };
  }
  if (res.data.length > MAX_DEALS) {
    return { ok: false, error: `Too many rows (${res.data.length}). The limit is ${MAX_DEALS.toLocaleString()}.` };
  }

  const deals: Deal[] = [];
  let skipped = 0;
  for (const row of res.data) {
    const d = toDeal(row);
    if (d) deals.push(d);
    else skipped++;
  }
  if (!deals.length) return { ok: false, error: "No valid deal rows found in this file." };
  return { ok: true, deals, skipped };
}
