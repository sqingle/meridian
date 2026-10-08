import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";
import { PageHeader } from "@/components/InsightsView";
import { loadSnapshot } from "@/lib/snapshots";

export const metadata = { title: "Shared insights — Meridian", robots: { index: false, follow: false } };

export default function SharedPage({ params }: PageProps<"/s/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-surface" />}>
      <Snapshot params={params} />
    </Suspense>
  );
}

async function Snapshot({ params }: { params: PageProps<"/s/[id]">["params"] }) {
  const { id } = await params;
  const snap = await loadSnapshot(id);
  if (!snap) notFound();
  return (
    <div className="space-y-6">
      <PageHeader title="Insights" meta={`${snap.fileName} · snapshot shared ${new Date(snap.createdAt).toUTCString().slice(0, 16)}`} />
      <Dashboard deals={snap.deals} />
    </div>
  );
}
