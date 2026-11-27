import Link from "next/link";
import { Suspense } from "react";

import { HeaderAccount } from "@/components/header-account";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-heading text-xl font-bold">
          ReseñIt
        </Link>
        <nav aria-label="Cuenta" className="flex items-center gap-2">
          <Suspense>
            <HeaderAccount />
          </Suspense>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
