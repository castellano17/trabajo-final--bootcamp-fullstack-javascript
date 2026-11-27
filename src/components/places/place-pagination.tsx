import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { PlaceFilters } from "@/lib/places/schemas";

type PlacePaginationProps = {
  filters: PlaceFilters;
  totalPages: number;
};

function placesPageHref(filters: PlaceFilters, page: number) {
  const searchParams = new URLSearchParams();
  if (filters.search) {
    searchParams.set("q", filters.search);
  }
  if (filters.category) {
    searchParams.set("categoria", filters.category);
  }
  if (page > 1) {
    searchParams.set("pagina", String(page));
  }
  const query = searchParams.toString();
  return query ? `/lugares?${query}` : "/lugares";
}

export function PlacePagination({ filters, totalPages }: PlacePaginationProps) {
  const previousPage = filters.page > 1 ? filters.page - 1 : null;
  const nextPage = filters.page < totalPages ? filters.page + 1 : null;

  return (
    <nav
      aria-label="Paginación"
      className="flex items-center justify-between gap-4"
    >
      {previousPage ? (
        <Button asChild variant="outline">
          <Link href={placesPageHref(filters, previousPage)}>Anterior</Link>
        </Button>
      ) : (
        <span />
      )}
      <p className="text-sm text-muted-foreground">
        Página {filters.page} de {totalPages}
      </p>
      {nextPage ? (
        <Button asChild variant="outline">
          <Link href={placesPageHref(filters, nextPage)}>Siguiente</Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  );
}
