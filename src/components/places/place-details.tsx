import { ExternalLink, MapPin } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { placeCategoryLabels } from "@/lib/places/categories";
import { categoryAppearance } from "@/lib/places/category-appearance";
import { googleMapsUrl } from "@/lib/places/paths";
import type { PlaceDetail } from "@/lib/places/queries";

type PlaceDetailsProps = {
  place: PlaceDetail;
  shareAction: ReactNode;
  adminActions?: ReactNode;
};

export function PlaceDetails({
  place,
  shareAction,
  adminActions,
}: PlaceDetailsProps) {
  const {
    icon: CategoryIcon,
    tileClassName,
    iconClassName,
  } = categoryAppearance[place.category];

  return (
    <header className="grid gap-5 rounded-3xl border bg-card p-6 shadow-xs sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            className={`flex size-16 shrink-0 items-center justify-center rounded-2xl ${tileClassName}`}
          >
            <CategoryIcon
              aria-hidden="true"
              className={`size-8 ${iconClassName}`}
            />
          </span>
          <div className="grid gap-1.5">
            <Badge variant="secondary" className="w-fit">
              {placeCategoryLabels[place.category]}
            </Badge>
            <h1 className="font-heading text-3xl font-bold sm:text-4xl">
              {place.name}
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {shareAction}
          {adminActions}
        </div>
      </div>
      <a
        href={googleMapsUrl({
          mapsUrl: place.maps_url,
          address: place.address,
        })}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-fit items-start gap-2 rounded-sm text-muted-foreground underline-offset-4 transition-colors outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>
          {place.address}
          <span className="sr-only">
            {" "}
            (abre Google Maps en una pestaña nueva)
          </span>
        </span>
        <ExternalLink aria-hidden="true" className="mt-1 size-3.5 shrink-0" />
      </a>
      {place.description && (
        <p className="max-w-prose leading-relaxed">{place.description}</p>
      )}
    </header>
  );
}
