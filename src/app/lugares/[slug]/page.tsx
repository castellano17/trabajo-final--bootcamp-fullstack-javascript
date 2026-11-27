import type { Metadata } from "next";
import { Suspense } from "react";

import { PlaceAdminActions } from "@/components/places/place-admin-actions";
import { PlaceDetails } from "@/components/places/place-details";
import {
  PlaceReviews,
  PlaceReviewsSkeleton,
} from "@/components/places/place-reviews";
import { SharePlaceDialog } from "@/components/places/share-place-dialog";
import { HiddenReviewNotice } from "@/components/reviews/hidden-review-notice";
import { PlaceReviewActions } from "@/components/reviews/place-review-actions";
import { getCurrentUser, isAdmin } from "@/lib/auth/session";
import { placePath, placeQrPath, placeUrl } from "@/lib/places/paths";
import { findPlaceForRoute } from "@/lib/places/place-route";
import { getPlaceBySlug } from "@/lib/places/queries";
import { placeSlugSchema } from "@/lib/places/schemas";
import { getOwnReview } from "@/lib/reviews/queries";
import { currentSiteOrigin } from "@/lib/site-origin";

export async function generateMetadata({
  params,
}: PageProps<"/lugares/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const place = placeSlugSchema.safeParse(slug).success
    ? await getPlaceBySlug(slug)
    : null;
  if (!place) {
    return {};
  }

  const url = placeUrl(await currentSiteOrigin(), place.slug);
  const description = place.description || place.address;
  return {
    title: `${place.name} · ReseñIt`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "ReseñIt",
      locale: "es_MX",
      title: place.name,
      description,
      url,
    },
  };
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
        shareAction={
          <SharePlaceDialog
            placeName={place.name}
            placeUrl={placeUrl(await currentSiteOrigin(), place.slug)}
            qrPath={placeQrPath(place.slug)}
            qrFileName={`qr-${place.slug}.png`}
          />
        }
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
