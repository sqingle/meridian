import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Deal } from "./deals";

export type Snapshot = {
  id: string;
  fileName: string;
  createdAt: string;
  deals: Deal[];
};

export class ShareConfigError extends Error {}

export const isValidSnapshotId = (id: string) => /^[A-Za-z0-9_-]{16,64}$/.test(id);

const supabaseConfigured = () => !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

function db() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Local-dev fallback so the share flow works before Supabase is wired up. Never used in production
// (Vercel's filesystem is read-only/ephemeral).
const DEV_DIR = path.join(process.cwd(), ".data", "snapshots");
const devStoreEnabled = () => !supabaseConfigured() && process.env.NODE_ENV !== "production";

export async function saveSnapshot(fileName: string, deals: Deal[]): Promise<string> {
  const id = randomBytes(18).toString("base64url"); // 24 chars, unguessable
  const createdAt = new Date().toISOString();

  if (supabaseConfigured()) {
    const { error } = await db()
      .from("snapshots")
      .insert({ id, file_name: fileName, deal_count: deals.length, deals, created_at: createdAt });
    if (error) throw new Error(`Supabase insert failed: ${error.message}`);
    return id;
  }
  if (devStoreEnabled()) {
    await mkdir(DEV_DIR, { recursive: true });
    await writeFile(path.join(DEV_DIR, `${id}.json`), JSON.stringify({ id, fileName, createdAt, deals }));
    return id;
  }
  throw new ShareConfigError("Sharing isn't configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
}

export async function loadSnapshot(id: string): Promise<Snapshot | null> {
  if (!isValidSnapshotId(id)) return null;

  if (supabaseConfigured()) {
    const { data, error } = await db()
      .from("snapshots")
      .select("id, file_name, created_at, deals")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Supabase read failed: ${error.message}`);
    if (!data) return null;
    return { id: data.id, fileName: data.file_name, createdAt: data.created_at, deals: data.deals as Deal[] };
  }
  if (devStoreEnabled()) {
    try {
      return JSON.parse(await readFile(path.join(DEV_DIR, `${id}.json`), "utf8")) as Snapshot;
    } catch {
      return null;
    }
  }
  throw new ShareConfigError("Sharing isn't configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
}
