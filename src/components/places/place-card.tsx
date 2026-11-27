import { MapPin } from "lucide-react";
import Link from "next/link";

import { RatingStars } from "@/components/places/rating-stars";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { placeCategoryLabels } from "@/lib/places/categories";
import { categoryAppearance } from "@/lib/places/category-appearance";
import { formatRating, formatReviewCount } from "@/lib/places/format";
import { placePath } from "@/lib/places/paths";
import type { PlaceSummary } from "@/lib/places/queries";

export function PlaceCard({ place }: { place: PlaceSummary }) {
  const {
    icon: CategoryIcon,
    tileClassName,
    iconClassName,
  } = categoryAppearance[place.category];

  return (
    <Link
      href={placePath(place.slug)}
      className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full gap-0 py-0 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">
        <div
          className={`flex h-28 items-center justify-center ${tileClassName}`}
        >
          <CategoryIcon
            aria-hidden="true"
            className={`size-11 transition-transform duration-200 group-hover:scale-110 ${iconClassName}`}
          />
        </div>
        <CardContent className="grid flex-1 content-start gap-3 py-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg leading-tight font-semibold">
              {place.name}
            </h2>
            <Badge variant="secondary" className="shrink-0">
              {placeCategoryLabels[place.category]}
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center gap-2">
            <RatingStars rating={place.average_rating} />
            <span className="font-medium">
              {formatRating(place.average_rating)}
            </span>
            <span className="text-muted-foreground">
              ({formatReviewCount(place.review_count)})
            </span>
          </div>
          <p className="flex items-start gap-1.5 text-muted-foreground">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {place.address}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
