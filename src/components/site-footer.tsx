import Link from "next/link";

import { SiteLogo } from "@/components/site-logo";
import { Separator } from "@/components/ui/separator";
import { siteNavigation } from "@/lib/navigation";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
        <SiteLogo />
        <nav aria-label="Pie de página">
          <ul className="flex items-center gap-6 text-sm">
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
      <Separator />
      <p className="px-4 py-6 text-center text-sm text-balance text-muted-foreground">
        © {new Date().getFullYear()} ReseñIt · Trabajo final del Bootcamp
        Fullstack JavaScript
      </p>
    </footer>
  );
}
