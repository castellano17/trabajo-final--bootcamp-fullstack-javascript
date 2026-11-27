import { SearchX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function PlacesEmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted">
        <SearchX aria-hidden="true" className="size-7 text-muted-foreground" />
      </span>
      <p className="font-medium">No encontramos taquerías con esos filtros.</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Prueba con otra categoría o busca por otro nombre.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href="/lugares">Ver todas las taquerías</Link>
      </Button>
    </div>
  );
}
