"use client";

import { deletePlace } from "@/app/lugares/actions";
import { DeleteConfirmDialog } from "@/components/forms/delete-confirm-dialog";
import { formatReviewCount } from "@/lib/places/format";

type DeletePlaceDialogProps = {
  placeId: string;
  placeName: string;
  reviewCount: number;
};

export function DeletePlaceDialog({
  placeId,
  placeName,
  reviewCount,
}: DeletePlaceDialogProps) {
  return (
    <DeleteConfirmDialog
      action={deletePlace.bind(null, placeId)}
      title={`¿Borrar ${placeName}?`}
      description={`Se borrarán el lugar y ${formatReviewCount(reviewCount)}. No se puede deshacer.`}
      confirmLabel="Borrar lugar"
    />
  );
}
