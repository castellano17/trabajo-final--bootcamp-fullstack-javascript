"use client";

import "react-easy-crop/react-easy-crop.css";

import { Camera, ImageUp } from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";

import { updateAvatar } from "@/app/perfil/actions";
import { FormStatusMessage } from "@/components/forms/form-status-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { useFormAction } from "@/components/forms/use-form-action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { FormState } from "@/lib/forms/form-state";
import {
  avatarMaxZoom,
  avatarMinZoom,
  avatarZoomStep,
} from "@/lib/profile/avatar-config";
import { cropAvatar } from "@/lib/profile/resize-image";

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const unreadableImageMessage = "Elige una imagen JPEG, PNG o WebP.";
const initialCrop: Point = { x: 0, y: 0 };

type SelectedImage = { file: File; imageUrl: string };

type AvatarDialogProps = {
  onSaved: (state: FormState) => void;
};

function selectedFileOf(event: ChangeEvent<HTMLInputElement>) {
  const file = event.currentTarget.files?.[0];
  event.currentTarget.value = "";
  return file;
}

function AvatarDialogContent({ onSaved }: AvatarDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isTouchDevice = useMediaQuery("(pointer: coarse)");
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
    null,
  );
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [crop, setCrop] = useState<Point>(initialCrop);
  const [zoom, setZoom] = useState(avatarMinZoom);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const { state, submitFormData, isPending } = useFormAction(
    async (previousState: FormState, formData: FormData) => {
      const result = await updateAvatar(previousState, formData);
      if (result.status === "success") {
        onSaved(result);
      }
      return result;
    },
  );
  const isSaving = isCropping || isPending;

  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage.imageUrl);
      }
    };
  }, [selectedImage]);

  function selectFile(file: File | undefined) {
    setSelectionError(null);
    if (!file) {
      return;
    }
    if (!acceptedImageTypes.includes(file.type)) {
      setSelectionError(unreadableImageMessage);
      return;
    }
    setCrop(initialCrop);
    setZoom(avatarMinZoom);
    setCroppedArea(null);
    setSelectedImage({ file, imageUrl: URL.createObjectURL(file) });
  }

  function rejectUnreadableImage() {
    setSelectedImage(null);
    setSelectionError(unreadableImageMessage);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingOver(true);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    selectFile(event.dataTransfer.files[0]);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedImage || !croppedArea) {
      return;
    }
    setIsCropping(true);
    try {
      const avatarFile = await cropAvatar(selectedImage.file, croppedArea);
      const formData = new FormData();
      formData.set("avatar", avatarFile);
      submitFormData(formData);
    } catch {
      rejectUnreadableImage();
    } finally {
      setIsCropping(false);
    }
  }

  function preventCloseWhileSaving(event: Event) {
    if (isSaving) {
      event.preventDefault();
    }
  }

  return (
    <DialogContent
      className="sm:max-w-md"
      showCloseButton={!isSaving}
      onEscapeKeyDown={preventCloseWhileSaving}
      onInteractOutside={preventCloseWhileSaving}
    >
      <DialogHeader>
        <DialogTitle>Cambiar foto</DialogTitle>
        <DialogDescription>
          {selectedImage
            ? "Mueve la imagen y ajusta el zoom para encuadrarla."
            : "Arrastra una imagen, elígela o toma una foto."}
        </DialogDescription>
      </DialogHeader>

      {selectedImage ? (
        <form onSubmit={handleSave} className="grid gap-4">
          <div className="relative h-72 overflow-hidden rounded-lg bg-muted">
            <Cropper
              image={selectedImage.imageUrl}
              crop={crop}
              zoom={zoom}
              minZoom={avatarMinZoom}
              maxZoom={avatarMaxZoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              disableAutomaticStylesInjection
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_area, areaInPixels) =>
                setCroppedArea(areaInPixels)
              }
              mediaProps={{
                alt: "Imagen para recortar",
                onError: rejectUnreadableImage,
              }}
            />
          </div>
          <Slider
            thumbLabel="Zoom"
            min={avatarMinZoom}
            max={avatarMaxZoom}
            step={avatarZoomStep}
            value={[zoom]}
            onValueChange={([value]) => setZoom(value ?? avatarMinZoom)}
            disabled={isSaving}
          />
          <FormStatusMessage state={state} />
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={isSaving}
              onClick={() => setSelectedImage(null)}
            >
              Elegir otra
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                Cancelar
              </Button>
            </DialogClose>
            <SubmitButton isPending={isSaving} pendingLabel="Guardando…">
              Guardar foto
            </SubmitButton>
          </DialogFooter>
        </form>
      ) : (
        <div className="grid gap-4">
          <div
            data-dragging={isDraggingOver}
            onDragOver={handleDragOver}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDrop}
            className="rounded-xl border-2 border-dashed border-border transition-colors data-[dragging=true]:border-primary data-[dragging=true]:bg-primary/5"
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-xl px-4 py-10 text-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ImageUp
                aria-hidden="true"
                className="size-8 text-muted-foreground"
              />
              <span className="font-medium">
                Arrastra una imagen o haz clic para elegirla
              </span>
              <span className="text-xs text-muted-foreground">
                JPEG, PNG o WebP
              </span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedImageTypes.join(",")}
            hidden
            onChange={(event) => selectFile(selectedFileOf(event))}
          />
          {isTouchDevice && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera data-icon="inline-start" aria-hidden="true" />
                Tomar foto
              </Button>
              <input
                ref={cameraInputRef}
                type="file"
                accept={acceptedImageTypes.join(",")}
                capture="user"
                hidden
                onChange={(event) => selectFile(selectedFileOf(event))}
              />
            </>
          )}
          {selectionError && (
            <FormStatusMessage
              state={{ status: "error", message: selectionError }}
            />
          )}
        </div>
      )}
    </DialogContent>
  );
}

export function AvatarDialog({ onSaved }: AvatarDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setOpenCount((count) => count + 1);
    }
    setIsOpen(nextOpen);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Cambiar foto</Button>
      </DialogTrigger>
      <AvatarDialogContent
        key={openCount}
        onSaved={(state) => {
          setIsOpen(false);
          onSaved(state);
        }}
      />
    </Dialog>
  );
}
