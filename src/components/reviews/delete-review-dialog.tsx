"use client";

import { deleteReview } from "@/app/lugares/[id]/resena/actions";
import { DeleteConfirmDialog } from "@/components/forms/delete-confirm-dialog";

export function DeleteReviewDialog({ placeId }: { placeId: string }) {
  return (
    <DeleteConfirmDialog
      action={deleteReview.bind(null, placeId)}
      triggerAccessibleLabel="Borrar tu reseña"
      title="¿Borrar tu reseña?"
      description="Se borrarán tu reseña y sus fotos. No se puede deshacer."
      confirmLabel="Borrar reseña"
    />
  );
}
