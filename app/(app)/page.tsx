import { UploadPanel } from "@/components/UploadPanel";

export const metadata = { title: "Upload data — Meridian" };

export default function UploadPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 pt-6 sm:pt-14">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Upload sales data</h1>
        <p className="mt-2 text-mute">
          Drop in a Meridian pipeline export (CSV). We&apos;ll turn it into revenue, rep and time-to-close insights —
          your file is processed in your browser and only saved if you hit Share.
        </p>
      </div>
      <UploadPanel />
    </div>
  );
}
