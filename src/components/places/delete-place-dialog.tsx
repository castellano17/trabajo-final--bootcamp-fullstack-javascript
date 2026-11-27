"use client";

import { deletePlace } from "@/app/lugares/actions";
import { FormStatusMessage } from "@/components/forms/form-status-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { useFormAction } from "@/components/forms/use-form-action";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
  const { state, handleSubmit, isPending } = useFormAction(
    deletePlace.bind(null, placeId),
  );

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Borrar</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Borrar {placeName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Se borrarán el lugar y {formatReviewCount(reviewCount)}. No se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FormStatusMessage state={state} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <form onSubmit={handleSubmit}>
            <SubmitButton
              variant="destructive"
              isPending={isPending}
              pendingLabel="Borrando…"
            >
              Borrar lugar
            </SubmitButton>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
