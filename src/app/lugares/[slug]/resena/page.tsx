import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { saveReview } from "@/app/lugares/[slug]/resena/actions";
import { HiddenReviewNotice } from "@/components/reviews/hidden-review-notice";
import { ReviewForm } from "@/components/reviews/review-form";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { placePath, placeReviewPath } from "@/lib/places/paths";
import { findPlaceForRoute } from "@/lib/places/place-route";
import { getOwnReview } from "@/lib/reviews/queries";

export const metadata: Metadata = {
  title: "Tu reseña · ReseñIt",
};

export default async function ReviewPage({
  params,
}: PageProps<"/lugares/[slug]/resena">) {
  const place = await findPlaceForRoute((await params).slug, placeReviewPath);
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect(
      `/iniciar-sesion?next=${encodeURIComponent(placeReviewPath(place.slug))}`,
    );
  }
  const ownReview = await getOwnReview(place.id);

  return (
    <main className="mx-auto grid w-full max-w-xl flex-1 content-start gap-6 px-4 py-10">
      <div className="grid gap-1">
        <h1 className="font-heading text-3xl font-bold">
          {ownReview ? "Editar tu reseña" : "Escribir reseña"}
        </h1>
        <p className="text-muted-foreground">{place.name}</p>
      </div>
      {ownReview?.isHidden && <HiddenReviewNotice />}
      <Card>
        <CardContent>
          <ReviewForm
            action={saveReview.bind(null, place.id, ownReview?.id ?? null)}
            cancelHref={placePath(place.slug)}
            review={
              ownReview
                ? {
                    rating: ownReview.rating,
                    body: ownReview.body,
                    photos: ownReview.photos,
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    </main>
  );
}
