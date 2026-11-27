import { Utensils } from "lucide-react";
import Link from "next/link";

export function SiteLogo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 font-heading text-xl font-bold"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Utensils aria-hidden="true" className="size-4" />
      </span>
      ReseñIt
    </Link>
  );
}
