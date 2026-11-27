import { Star } from "lucide-react";

import { RatingStars } from "@/components/places/rating-stars";
import { Progress } from "@/components/ui/progress";
import {
  formatRating,
  formatReviewCount,
  formatStarCount,
} from "@/lib/places/format";
import type { RatingDistributionRow } from "@/lib/places/rating-distribution";

type RatingSummaryProps = {
  averageRating: number;
  reviewCount: number;
  distribution: RatingDistributionRow[];
};

export function RatingSummary({
  averageRating,
  reviewCount,
  distribution,
}: RatingSummaryProps) {
  return (
    <aside
      aria-label="Resumen de calificaciones"
      className="grid gap-5 rounded-2xl border bg-card p-5 shadow-xs lg:sticky lg:top-24"
    >
      <div className="flex items-center gap-4">
        <span className="font-heading text-5xl font-bold">
          {formatRating(averageRating)}
        </span>
        <div className="grid gap-1">
          <RatingStars rating={averageRating} />
          <span className="text-sm text-muted-foreground">
            {formatReviewCount(reviewCount)}
          </span>
        </div>
      </div>
      <ul aria-label="Calificaciones por puntaje" className="grid gap-2.5">
        {distribution.map((row) => (
          <li
            key={row.rating}
            className="grid grid-cols-[2.25rem_1fr_1.5rem] items-center gap-3 text-sm"
          >
            <span className="flex items-center gap-1 font-medium">
              {row.rating}
              <Star
                aria-hidden="true"
                className="size-3.5 fill-rating text-rating"
              />
            </span>
            <Progress
              value={row.percentage}
              aria-label={formatStarCount(row.rating)}
              className="h-2 [&_[data-slot=progress-indicator]]:bg-rating"
            />
            <span className="text-right text-muted-foreground tabular-nums">
              {row.count}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
