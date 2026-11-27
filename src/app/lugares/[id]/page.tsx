import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PlaceDetails } from "@/components/places/place-details";
import {
  PlaceReviews,
  PlaceReviewsSkeleton,
} from "@/components/places/place-reviews";
import { getPlace } from "@/lib/places/queries";
import { placeIdSchema } from "@/lib/places/schemas";

async function findPlaceOrNull(id: string) {
  return placeIdSchema.safeParse(id).success ? getPlace(id) : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/lugares/[id]">): Promise<Metadata> {
  const place = await findPlaceOrNull((await params).id);
  return place ? { title: `${place.name} · ReseñIt` } : {};
}

export default async function PlacePage({
  params,
}: PageProps<"/lugares/[id]">) {
  const place = await findPlaceOrNull((await params).id);
  if (!place) {
    notFound();
  }

  return (
    <main className="mx-auto grid w-full max-w-3xl flex-1 content-start gap-10 px-4 py-10">
      <PlaceDetails place={place} />
      <section aria-labelledby="place-reviews-heading" className="grid gap-4">
        <h2 id="place-reviews-heading" className="text-xl font-semibold">
          Reseñas
        </h2>
        <Suspense fallback={<PlaceReviewsSkeleton />}>
          <PlaceReviews placeId={place.id} />
        </Suspense>
      </section>
    </main>
  );
}
