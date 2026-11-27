import type { Metadata } from "next";
import Link from "next/link";

import { PlaceCard } from "@/components/places/place-card";
import { PlaceFilters } from "@/components/places/place-filters";
import { PlacePagination } from "@/components/places/place-pagination";
import { PlacesEmptyState } from "@/components/places/places-empty-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser, isAdmin } from "@/lib/auth/session";
import { placesPerPage } from "@/lib/places/config";
import { listPlaces } from "@/lib/places/queries";
import { placeFiltersSchema } from "@/lib/places/schemas";

export const metadata: Metadata = {
  title: "Taquerías · ReseñIt",
};

export default async function PlacesPage({
  searchParams,
}: PageProps<"/lugares">) {
  const filters = placeFiltersSchema.parse(await searchParams);
  const { places, totalCount } = await listPlaces(filters);
  const totalPages = Math.ceil(totalCount / placesPerPage);
  const currentUser = await getCurrentUser();

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 content-start gap-8 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            Taquerías
          </h1>
          <p className="text-muted-foreground">
            Encuentra tu próxima taquería favorita y lee lo que opinan otros.
          </p>
        </div>
        {isAdmin(currentUser) && (
          <Button asChild>
            <Link href="/lugares/nuevo">Nuevo lugar</Link>
          </Button>
        )}
      </div>
      <PlaceFilters filters={filters} />
      {places.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <li key={place.id}>
              <PlaceCard place={place} />
            </li>
          ))}
        </ul>
      ) : (
        <PlacesEmptyState />
      )}
      {totalPages > 1 && (
        <PlacePagination filters={filters} totalPages={totalPages} />
      )}
    </main>
  );
}
