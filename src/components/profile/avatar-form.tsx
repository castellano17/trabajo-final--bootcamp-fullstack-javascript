"use client";

import { useState } from "react";

import { removeAvatar } from "@/app/perfil/actions";
import { FormStatusMessage } from "@/components/forms/form-status-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { useFormAction } from "@/components/forms/use-form-action";
import { AvatarDialog } from "@/components/profile/avatar-dialog";
import { UserAvatar } from "@/components/user-avatar";
import { type FormState, initialFormState } from "@/lib/forms/form-state";

type AvatarFormProps = {
  displayName: string;
  avatarUrl: string | null;
};

function RemoveAvatarForm({
  onRemoved,
}: {
  onRemoved: (state: FormState) => void;
}) {
  const { handleSubmit, isPending } = useFormAction(async () => {
    const result = await removeAvatar();
    onRemoved(result);
    return result;
  });

  return (
    <form onSubmit={handleSubmit} aria-label="Quitar foto">
      <SubmitButton
        variant="outline"
        isPending={isPending}
        pendingLabel="Quitando…"
      >
        Quitar foto
      </SubmitButton>
    </form>
  );
}

export function AvatarForm({ displayName, avatarUrl }: AvatarFormProps) {
  const [resultState, setResultState] = useState<FormState>(initialFormState);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <UserAvatar
          displayName={displayName}
          avatarUrl={avatarUrl}
          size="lg"
          className="size-20"
        />
        <div className="flex flex-wrap gap-2">
          <AvatarDialog onSaved={setResultState} />
          {avatarUrl && <RemoveAvatarForm onRemoved={setResultState} />}
        </div>
      </div>
      <FormStatusMessage state={resultState} />
    </div>
  );
}
