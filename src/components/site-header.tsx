import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-xl font-bold">
          ReseñIt
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
