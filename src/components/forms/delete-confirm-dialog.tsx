"use client";

import { FormStatusMessage } from "@/components/forms/form-status-message";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  type FormAction,
  useFormAction,
} from "@/components/forms/use-form-action";
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

type DeleteConfirmDialogProps = {
  action: FormAction;
  triggerAccessibleLabel?: string;
  title: string;
  description: string;
  confirmLabel: string;
};

export function DeleteConfirmDialog({
  action,
  triggerAccessibleLabel,
  title,
  description,
  confirmLabel,
}: DeleteConfirmDialogProps) {
  const { state, handleSubmit, isPending } = useFormAction(action);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" aria-label={triggerAccessibleLabel}>
          Borrar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <FormStatusMessage state={state} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <form onSubmit={handleSubmit} className="max-sm:w-full">
            <SubmitButton
              variant="destructive"
              className="w-full"
              isPending={isPending}
              pendingLabel="Borrando…"
            >
              {confirmLabel}
            </SubmitButton>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
