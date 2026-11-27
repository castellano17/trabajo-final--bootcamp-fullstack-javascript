import { PenLine } from "lucide-react";
import Link from "next/link";

import { DeleteReviewDialog } from "@/components/reviews/delete-review-dialog";
import { Button } from "@/components/ui/button";
import { placeReviewPath } from "@/lib/places/paths";
import type { OwnReview } from "@/lib/reviews/queries";

type PlaceReviewActionsProps = {
  placeId: string;
  placeSlug: string;
  ownReview: OwnReview | null;
};

export function PlaceReviewActions({
  placeId,
  placeSlug,
  ownReview,
}: PlaceReviewActionsProps) {
  const reviewPagePath = placeReviewPath(placeSlug);

  if (!ownReview) {
    return (
      <Button asChild>
        <Link href={reviewPagePath}>
          <PenLine data-icon="inline-start" aria-hidden="true" />
          Escribir reseña
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline">
        <Link href={reviewPagePath}>Editar tu reseña</Link>
      </Button>
      <DeleteReviewDialog placeId={placeId} />
    </div>
  );
}
