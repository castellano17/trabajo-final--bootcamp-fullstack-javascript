import Link from "next/link";

import { RatingStars } from "@/components/places/rating-stars";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { placeCategoryLabels } from "@/lib/places/categories";
import { formatRating, formatReviewCount } from "@/lib/places/format";
import type { PlaceSummary } from "@/lib/places/queries";

export function PlaceCard({ place }: { place: PlaceSummary }) {
  return (
    <Link
      href={`/lugares/${place.id}`}
      className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full transition-colors group-hover:bg-muted/40">
        <CardHeader className="gap-2">
          <Badge variant="secondary">
            {placeCategoryLabels[place.category]}
          </Badge>
          <CardTitle>
            <h2 className="text-lg font-semibold">{place.name}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <p className="text-sm text-muted-foreground">{place.address}</p>
          <div className="flex items-center gap-2 text-sm">
            <RatingStars rating={place.average_rating} />
            <span className="font-medium">
              {formatRating(place.average_rating)}
            </span>
            <span className="text-muted-foreground">
              ({formatReviewCount(place.review_count)})
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
