import type { Metadata } from "next";
import { Suspense } from "react";

import { PlaceAdminActions } from "@/components/places/place-admin-actions";
import { PlaceDetails } from "@/components/places/place-details";
import {
  PlaceReviews,
  PlaceReviewsSkeleton,
} from "@/components/places/place-reviews";
import { HiddenReviewNotice } from "@/components/reviews/hidden-review-notice";
import { PlaceReviewActions } from "@/components/reviews/place-review-actions";
import { getCurrentUser, isAdmin } from "@/lib/auth/session";
import { placePath } from "@/lib/places/paths";
import { findPlaceForRoute } from "@/lib/places/place-route";
import { getPlaceBySlug } from "@/lib/places/queries";
import { placeSlugSchema } from "@/lib/places/schemas";
import { getOwnReview } from "@/lib/reviews/queries";

export async function generateMetadata({
  params,
}: PageProps<"/lugares/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const place = placeSlugSchema.safeParse(slug).success
    ? await getPlaceBySlug(slug)
    : null;
  return place ? { title: `${place.name} · ReseñIt` } : {};
}

export default async function PlacePage({
  params,
}: PageProps<"/lugares/[slug]">) {
  const place = await findPlaceForRoute((await params).slug, placePath);
  const currentUser = await getCurrentUser();
  const ownReview = currentUser ? await getOwnReview(place.id) : null;

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 content-start gap-10 px-4 py-10">
      <PlaceDetails
        place={place}
        adminActions={
          isAdmin(currentUser) ? <PlaceAdminActions place={place} /> : null
        }
      />
      <section aria-labelledby="place-reviews-heading" className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="place-reviews-heading"
            className="font-heading text-2xl font-bold"
          >
            Reseñas
          </h2>
          <PlaceReviewActions
            placeId={place.id}
            placeSlug={place.slug}
            ownReview={ownReview}
          />
        </div>
        {ownReview?.isHidden && <HiddenReviewNotice />}
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
