"use client";
import { useState } from "react";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError(res.status === 401 ? "Incorrect password. Try again." : "Something went wrong.");
        setBusy(false);
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next") ?? "/";
      // full navigation so the proxy sees the fresh cookie
      window.location.assign(next.startsWith("/") && !next.startsWith("//") ? next : "/");
    } catch {
      setError("Network error. Try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-mute">Password</span>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!error}
          className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm outline-none transition placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-accent/15 aria-[invalid=true]:border-bad"
          placeholder="••••••••"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      )}
      <button
        disabled={busy || !password}
        className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-canvas transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}
