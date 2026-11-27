"use client";

import { Check, Copy, Download, Share2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CopyStatus = "idle" | "copied" | "failed";

const copyStatusMessages: Record<CopyStatus, string> = {
  idle: "",
  copied: "Enlace copiado.",
  failed: "No pudimos copiar el enlace.",
};

type SharePlaceDialogProps = {
  placeName: string;
  placeUrl: string;
  qrPath: string;
  qrFileName: string;
};

function subscribeToNothing() {
  return () => {};
}

function browserCanShare() {
  return typeof navigator.share === "function";
}

function serverCannotShare() {
  return false;
}

async function fetchQrFile(qrPath: string, qrFileName: string) {
  try {
    const response = await fetch(qrPath);
    return response.ok
      ? new File([await response.blob()], qrFileName, { type: "image/png" })
      : null;
  } catch {
    return null;
  }
}

export function SharePlaceDialog({
  placeName,
  placeUrl,
  qrPath,
  qrFileName,
}: SharePlaceDialogProps) {
  const canShare = useSyncExternalStore(
    subscribeToNothing,
    browserCanShare,
    serverCannotShare,
  );
  const qrFileRef = useRef<Promise<File | null> | null>(null);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  function handleOpenChange(open: boolean) {
    setCopyStatus("idle");
    if (open && canShare) {
      qrFileRef.current ??= fetchQrFile(qrPath, qrFileName);
    }
  }

  async function sharePlace() {
    const qrFile = await qrFileRef.current;
    const shareData =
      qrFile && navigator.canShare?.({ files: [qrFile] })
        ? {
            title: placeName,
            text: `${placeName} en ReseñIt: ${placeUrl}`,
            files: [qrFile],
          }
        : { title: placeName, url: placeUrl };
    await navigator.share(shareData).catch(() => undefined);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(placeUrl);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 data-icon="inline-start" aria-hidden="true" />
          Compartir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Compartir {placeName}</DialogTitle>
          <DialogDescription>
            Escanea el código o comparte el enlace.
          </DialogDescription>
        </DialogHeader>
        <div className="mx-auto rounded-xl bg-white p-2 ring-1 ring-foreground/10">
          <Image
            src={qrPath}
            alt={`Código QR de ${placeName}`}
            width={224}
            height={224}
            unoptimized
            className="size-56"
          />
        </div>
        <p className="rounded-lg bg-muted px-3 py-2 text-center text-sm break-all">
          {placeUrl}
        </p>
        <div className="grid gap-2">
          <Button asChild>
            <a href={qrPath} download={qrFileName}>
              <Download data-icon="inline-start" aria-hidden="true" />
              Descargar QR
            </a>
          </Button>
          {canShare && (
            <Button variant="outline" onClick={sharePlace}>
              <Share2 data-icon="inline-start" aria-hidden="true" />
              Compartir
            </Button>
          )}
          <Button variant="outline" onClick={copyLink}>
            {copyStatus === "copied" ? (
              <Check data-icon="inline-start" aria-hidden="true" />
            ) : (
              <Copy data-icon="inline-start" aria-hidden="true" />
            )}
            Copiar enlace
          </Button>
        </div>
        <p
          role="status"
          className="min-h-5 text-center text-sm text-muted-foreground"
        >
          {copyStatusMessages[copyStatus]}
        </p>
      </DialogContent>
    </Dialog>
  );
}
