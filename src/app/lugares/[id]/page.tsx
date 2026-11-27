import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PlaceAdminActions } from "@/components/places/place-admin-actions";
import { PlaceDetails } from "@/components/places/place-details";
import {
  PlaceReviews,
  PlaceReviewsSkeleton,
} from "@/components/places/place-reviews";
import { getCurrentUser, isAdmin } from "@/lib/auth/session";
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
  const currentUser = await getCurrentUser();

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 content-start gap-10 px-4 py-10">
      <PlaceDetails
        place={place}
        adminActions={
          isAdmin(currentUser) ? <PlaceAdminActions place={place} /> : null
        }
      />
      <section aria-labelledby="place-reviews-heading" className="grid gap-4">
        <h2
          id="place-reviews-heading"
          className="font-heading text-2xl font-bold"
        >
          Reseñas
        </h2>
        <Suspense fallback={<PlaceReviewsSkeleton />}>
          <PlaceReviews
            placeId={place.id}
            averageRating={place.average_rating}
            reviewCount={place.review_count}
          />
        </Suspense>
      </section>
    </main>
  );
}
