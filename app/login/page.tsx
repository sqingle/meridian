import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in — Meridian" };

export default function LoginPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]"
      />
      <div className="relative w-full max-w-sm rounded-3xl border border-line bg-surface p-8 shadow-2xl shadow-black/50">
        <div className="mb-8 flex items-center gap-3">
          <Logo size={32} />
          <span className="text-lg font-semibold tracking-tight">Meridian</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-sm text-mute">Enter the team password to view sales insights.</p>
        <LoginForm />
      </div>
    </main>
  );
}
