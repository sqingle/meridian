import { NextResponse } from "next/server";
import { sanitizeDeals } from "@/lib/deals";
import { ShareConfigError, saveSnapshot } from "@/lib/snapshots";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { fileName?: unknown; deals?: unknown } | null;
  const deals = sanitizeDeals(body?.deals);
  if (!deals) return NextResponse.json({ error: "Invalid or empty dataset." }, { status: 400 });
  const fileName = typeof body?.fileName === "string" ? body.fileName.slice(0, 200) : "upload.csv";

  try {
    const id = await saveSnapshot(fileName, deals);
    return NextResponse.json({ id, url: `${new URL(req.url).origin}/s/${id}` });
  } catch (e) {
    if (e instanceof ShareConfigError) return NextResponse.json({ error: e.message }, { status: 503 });
    console.error(e);
    return NextResponse.json({ error: "Couldn't save the snapshot. Please try again." }, { status: 500 });
  }
}
