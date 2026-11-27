import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { saveReview } from "@/app/lugares/[id]/resena/actions";
import { ReviewForm } from "@/components/reviews/review-form";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { getPlace } from "@/lib/places/queries";
import { placeIdSchema } from "@/lib/places/schemas";
import { getOwnReview } from "@/lib/reviews/queries";

export const metadata: Metadata = {
  title: "Tu reseña · ReseñIt",
};

export default async function ReviewPage({
  params,
}: PageProps<"/lugares/[id]/resena">) {
  const { id } = await params;
  const place = placeIdSchema.safeParse(id).success ? await getPlace(id) : null;
  if (!place) {
    notFound();
  }
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect(
      `/iniciar-sesion?next=${encodeURIComponent(`/lugares/${place.id}/resena`)}`,
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
      {ownReview?.isHidden && (
        <p
          role="status"
          className="rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground"
        >
          Un moderador ocultó tu reseña. Puedes editarla o borrarla, pero
          seguirá oculta.
        </p>
      )}
      <Card>
        <CardContent>
          <ReviewForm
            action={saveReview.bind(null, place.id, ownReview?.id ?? null)}
            cancelHref={`/lugares/${place.id}`}
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
