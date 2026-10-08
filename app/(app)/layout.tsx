import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={<div className="h-16 border-b border-line" />}>
        <Navbar />
      </Suspense>
      <main className="mx-auto w-full min-w-0 max-w-[1400px] flex-1 px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
