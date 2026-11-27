import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { CategoryLinks } from "@/components/home/category-links";
import { HeroPhotoMosaic } from "@/components/home/hero-photo-mosaic";
import { HomeSearchForm } from "@/components/home/home-search-form";
import { PlaceCard } from "@/components/places/place-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { heroPhotos } from "@/lib/home/hero-photos";
import { listTopRatedPlaces } from "@/lib/places/queries";

export default async function HomePage() {
  const topRatedPlaces = await listTopRatedPlaces();

  return (
    <main className="flex flex-1 flex-col">
      <section className="border-b bg-muted/40">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col items-start gap-5">
            <Badge variant="outline" className="h-auto px-3 py-1 text-sm">
              Reseñas reales de taquerías
            </Badge>
            <h1 className="font-heading text-5xl font-bold tracking-tight sm:text-6xl">
              ReseñIt
            </h1>
            <p className="max-w-lg text-xl text-balance text-muted-foreground">
              Descubre las mejores taquerías, califícalas y comparte tus
              reseñas.
            </p>
            <HomeSearchForm />
            <Button asChild variant="link" className="h-auto px-0">
              <Link href="/lugares">
                Explorar taquerías
                <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <HeroPhotoMosaic photos={heroPhotos} />
        </div>
      </section>

      {topRatedPlaces.length > 0 && (
        <section
          aria-labelledby="top-rated-heading"
          className="mx-auto grid w-full max-w-6xl gap-6 px-4 pt-14"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2
              id="top-rated-heading"
              className="font-heading text-2xl font-bold sm:text-3xl"
            >
              Las mejor calificadas
            </h2>
            <Link
              href="/lugares"
              className="text-sm font-medium text-primary hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topRatedPlaces.map((place) => (
              <li key={place.id}>
                <PlaceCard place={place} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section
        aria-labelledby="categories-heading"
        className="mx-auto grid w-full max-w-6xl gap-6 px-4 pt-14 pb-16"
      >
        <h2
          id="categories-heading"
          className="font-heading text-2xl font-bold sm:text-3xl"
        >
          Explora por categoría
        </h2>
        <CategoryLinks />
      </section>
    </main>
  );
}
