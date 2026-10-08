// Shared-password gate. Works in both the proxy and route handlers (Web Crypto only).

export const SESSION_COOKIE = "meridian_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const expectedPassword = () => process.env.APP_PASSWORD || "OPS123";
const secret = () => process.env.SESSION_SECRET || "meridian-dev-secret-change-me";

const hex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function hmac(message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Token is bound to the current password, so rotating APP_PASSWORD signs everyone out. */
export const sessionToken = () => hmac(`meridian-session:${expectedPassword()}`);

export async function isValidSession(cookieValue: string | undefined) {
  if (!cookieValue) return false;
  return safeEqual(cookieValue, await sessionToken());
}

/** Only allow same-site relative redirects. */
export const safeNext = (next: unknown) =>
  typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : "/";
