"use client";
import { useEffect, useRef, useState } from "react";
import { useDataset } from "@/lib/store";

export function ShareButton() {
  const ds = useDataset();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!ds) return null;

  async function create() {
    setOpen(true);
    setBusy(true);
    setError("");
    setUrl("");
    setCopied(false);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: ds!.fileName, deals: ds!.deals }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't create share link.");
      setUrl(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create share link.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={create}
        className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-deep"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" />
        </svg>
        Share
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-3 w-[min(92vw,380px)] rounded-2xl border border-line-strong bg-surface p-5 shadow-2xl shadow-black/60">
          <h3 className="text-sm font-semibold">Share this snapshot</h3>
          <p className="mt-1 text-xs leading-relaxed text-mute">
            Saves the current data ({ds.deals.length.toLocaleString()} deals) so anyone with the link and the team
            password sees these exact insights.
          </p>

          {busy && <p className="mt-4 text-sm text-mute">Creating link…</p>}
          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-bad/30 bg-bad/10 p-3 text-sm text-bad">
              {error}
            </p>
          )}
          {url && (
            <div className="mt-4 flex items-center gap-2">
              <input
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-xs text-ink outline-none"
              />
              <button
                onClick={copy}
                className="shrink-0 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-canvas hover:bg-white"
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
