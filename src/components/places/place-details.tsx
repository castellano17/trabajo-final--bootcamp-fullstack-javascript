import { MapPin } from "lucide-react";

import { RatingStars } from "@/components/places/rating-stars";
import { Badge } from "@/components/ui/badge";
import { placeCategoryLabels } from "@/lib/places/categories";
import { formatRating, formatReviewCount } from "@/lib/places/format";
import type { PlaceDetail } from "@/lib/places/queries";

export function PlaceDetails({ place }: { place: PlaceDetail }) {
  return (
    <header className="grid gap-3">
      <Badge variant="secondary">{placeCategoryLabels[place.category]}</Badge>
      <h1 className="font-heading text-3xl font-bold">{place.name}</h1>
      <p className="flex items-center gap-2 text-muted-foreground">
        <MapPin aria-hidden="true" className="size-4 shrink-0" />
        {place.address}
      </p>
      <div className="flex items-center gap-2">
        <RatingStars rating={place.average_rating} />
        <span className="font-medium">
          {formatRating(place.average_rating)}
        </span>
        <span className="text-muted-foreground">
          ({formatReviewCount(place.review_count)})
        </span>
      </div>
      {place.description && (
        <p className="max-w-prose leading-relaxed">{place.description}</p>
      )}
    </header>
  );
}
