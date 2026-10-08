"use client";
import Link from "next/link";
import { useDataset } from "@/lib/store";
import { Dashboard } from "./Dashboard";

export function InsightsView() {
  const ds = useDataset();

  if (ds === undefined) return <div className="h-96 animate-pulse rounded-3xl bg-surface" />;
  if (ds === null)
    return (
      <div className="mx-auto mt-20 max-w-md rounded-3xl border border-line bg-surface p-10 text-center">
        <h1 className="text-xl font-semibold">No data yet</h1>
        <p className="mt-2 text-sm text-mute">Upload a sales CSV to see revenue, rep and time-to-close insights.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-canvas hover:bg-accent-deep">
          Upload CSV
        </Link>
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader title="Insights" meta={`${ds.fileName} · uploaded ${new Date(ds.uploadedAt).toLocaleString()}`} />
      <Dashboard deals={ds.deals} />
    </div>
  );
}

export function PageHeader({ title, meta }: { title: string; meta: string }) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-mute">{meta}</p>
    </div>
  );
}
