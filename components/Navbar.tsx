"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { ShareButton } from "./ShareButton";

const TABS = [
  { href: "/", label: "Upload" },
  { href: "/insights", label: "Insights" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const shared = pathname.startsWith("/s/");

  async function signOut() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="hidden font-semibold tracking-tight sm:inline">Meridian</span>
        </Link>

        {shared ? (
          <span className="whitespace-nowrap rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            Shared snapshot
          </span>
        ) : (
          <nav className="flex gap-1 rounded-full border border-line bg-surface p-1">
            {TABS.map((t) => {
              const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-4 py-1.5 text-sm transition ${
                    active ? "bg-ink font-medium text-canvas" : "text-mute hover:text-ink"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          {pathname === "/insights" && <ShareButton />}
          <button
            onClick={signOut}
            className="whitespace-nowrap rounded-full border border-line px-4 py-2 text-sm text-mute transition hover:border-line-strong hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
