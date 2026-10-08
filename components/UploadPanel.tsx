"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { parseDealsCsv } from "@/lib/csv";
import { REQUIRED_COLUMNS } from "@/lib/deals";
import { money, summary } from "@/lib/analytics";
import { clearDataset, saveDataset, useDataset } from "@/lib/store";

const MAX_BYTES = 10 * 1024 * 1024;

export function UploadPanel() {
  const ds = useDataset();
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function handle(file: File | undefined) {
    setError("");
    setNote("");
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") return setError("Please choose a .csv file.");
    if (file.size > MAX_BYTES) return setError("File is larger than 10 MB.");
    const res = parseDealsCsv(await file.text());
    if (!res.ok) return setError(res.error);
    saveDataset({ fileName: file.name, uploadedAt: new Date().toISOString(), deals: res.deals });
    if (res.skipped) setNote(`${res.skipped} row${res.skipped > 1 ? "s" : ""} skipped (missing or invalid values).`);
  }

  const s = ds ? summary(ds.deals) : null;

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handle(e.dataTransfer.files[0]);
        }}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        role="button"
        tabIndex={0}
        className={`group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed px-6 py-16 text-center transition ${
          drag ? "border-accent bg-accent/10" : "border-line-strong bg-surface hover:border-accent/60 hover:bg-surface-2"
        }`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface-3 text-accent transition group-hover:scale-105">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 16V4m0 0L7 9m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-medium">Drop your CSV here, or click to browse</p>
          <p className="mt-1 text-sm text-mute">.csv up to 10 MB · same columns as meridian_sales.csv</p>
        </div>
        <input
          ref={input}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            handle(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-2xl border border-bad/30 bg-bad/10 p-4 text-sm text-bad">
          {error}
        </p>
      )}

      {ds && s && (
        <div className="rounded-3xl border border-line bg-surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-good">
                <span className="h-1.5 w-1.5 rounded-full bg-good" /> Data loaded
              </p>
              <p className="mt-1 truncate text-lg font-semibold">{ds.fileName}</p>
              <p className="mt-0.5 text-sm text-mute">
                {s.totalDeals.toLocaleString()} deals · {money(s.wonRevenue, true)} won · {money(s.openValue, true)} open pipeline
              </p>
              {note && <p className="mt-2 text-sm text-warn">{note}</p>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearDataset}
                className="rounded-full border border-line px-4 py-2 text-sm text-mute transition hover:border-line-strong hover:text-ink"
              >
                Remove
              </button>
              <Link
                href="/insights"
                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent-deep"
              >
                View insights →
              </Link>
            </div>
          </div>
        </div>
      )}

      <details className="rounded-2xl border border-line bg-surface px-5 py-4 text-sm text-mute">
        <summary className="cursor-pointer select-none font-medium text-ink">Expected columns</summary>
        <p className="mt-3 font-mono text-xs leading-relaxed">{REQUIRED_COLUMNS.join(", ")}</p>
        <p className="mt-2 text-xs">Dates as M/D/YYYY. Stages: Prospecting → Qualified → Demo Scheduled → Proposal Sent → Negotiation → Closed Won / Closed Lost.</p>
      </details>
    </div>
  );
}
