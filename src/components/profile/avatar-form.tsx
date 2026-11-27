"use client";

import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";

import { removeAvatar, updateAvatar } from "@/app/perfil/actions";
import { FormField } from "@/components/forms/form-field";
import { FormStatusMessage } from "@/components/forms/form-status-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { useFormAction } from "@/components/forms/use-form-action";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/user-avatar";
import { avatarMaxBytes } from "@/lib/profile/avatar-config";
import { resizeToSquareAvatar } from "@/lib/profile/resize-image";

type AvatarFormProps = {
  displayName: string;
  avatarUrl: string | null;
};

const tooLargeMessage = "La imagen no puede superar los 2 MB.";

function replaceSelectedFile(input: HTMLInputElement, file: File) {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  input.files = dataTransfer.files;
}

function RemoveAvatarForm({ hasAvatar }: { hasAvatar: boolean }) {
  const { state, handleSubmit, isPending } = useFormAction(removeAvatar);

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4"
      aria-label="Quitar foto"
    >
      <FormStatusMessage state={state} />
      {hasAvatar && (
        <SubmitButton
          variant="outline"
          isPending={isPending}
          pendingLabel="Quitando…"
        >
          Quitar foto
        </SubmitButton>
      )}
    </form>
  );
}

export function AvatarForm({ displayName, avatarUrl }: AvatarFormProps) {
  const { state, fieldErrors, handleSubmit, isPending } =
    useFormAction(updateAvatar);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const selectedFile = input.files?.[0];
    setSelectionError(null);
    setPreviewUrl(null);
    if (!selectedFile) {
      return;
    }

    try {
      const avatarFile = await resizeToSquareAvatar(selectedFile);
      replaceSelectedFile(input, avatarFile);
      setPreviewUrl(URL.createObjectURL(avatarFile));
    } catch {
      if (selectedFile.size > avatarMaxBytes) {
        input.value = "";
        setSelectionError(tooLargeMessage);
      }
    }
  }

  function handleAvatarSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    handleSubmit(event);
    form.reset();
    setPreviewUrl(null);
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4">
        <UserAvatar
          displayName={displayName}
          avatarUrl={avatarUrl}
          size="lg"
          className="size-20"
        />
        <RemoveAvatarForm hasAvatar={Boolean(avatarUrl)} />
      </div>
      <form
        onSubmit={handleAvatarSubmit}
        className="grid gap-4"
        aria-label="Cambiar foto"
        noValidate
      >
        <FormField
          name="avatar"
          label="Elige una foto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          errors={selectionError ? [selectionError] : fieldErrors.avatar}
        />
        {previewUrl && (
          <Avatar size="lg" className="size-20">
            <AvatarImage src={previewUrl} alt="Vista previa de tu nueva foto" />
          </Avatar>
        )}
        <FormStatusMessage state={state} />
        <SubmitButton isPending={isPending} pendingLabel="Subiendo…">
          Guardar foto
        </SubmitButton>
      </form>
    </div>
  );
}
