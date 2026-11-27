import Image from "next/image";

import type { HeroPhoto } from "@/lib/home/hero-photos";

const tileClassNames = ["row-span-2", "aspect-[4/3]", "aspect-[4/3]"];

export function HeroPhotoMosaic({ photos }: { photos: HeroPhoto[] }) {
  if (photos.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {photos.map((photo, index) => (
        <div
          key={photo.src}
          className={`relative overflow-hidden rounded-2xl bg-muted shadow-sm ${tileClassNames[index] ?? "aspect-[4/3]"}`}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 28rem, 50vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
