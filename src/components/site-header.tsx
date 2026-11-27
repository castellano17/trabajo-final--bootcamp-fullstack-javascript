import Link from "next/link";
import { Suspense } from "react";

import { HeaderAccount } from "@/components/header-account";
import { SiteLogo } from "@/components/site-logo";
import { SiteMobileMenu } from "@/components/site-mobile-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteNavigation } from "@/lib/navigation";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-8">
          <SiteLogo />
          <nav aria-label="Principal" className="max-md:hidden">
            <ul className="flex items-center gap-6 text-sm font-medium">
              {siteNavigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <nav aria-label="Cuenta" className="flex items-center gap-2">
            <Suspense>
              <HeaderAccount />
            </Suspense>
          </nav>
          <ThemeToggle />
          <SiteMobileMenu />
        </div>
      </div>
    </header>
  );
}
