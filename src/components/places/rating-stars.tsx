import { Star } from "lucide-react";

import { formatRating } from "@/lib/places/format";

const starPositions = [1, 2, 3, 4, 5];

export function RatingStars({ rating }: { rating: number }) {
  const filledStars = Math.round(rating);

  return (
    <span
      role="img"
      aria-label={`${formatRating(rating)} de 5 estrellas`}
      className="flex items-center gap-0.5"
    >
      {starPositions.map((position) => (
        <Star
          key={position}
          aria-hidden="true"
          className={
            position <= filledStars
              ? "size-4 fill-rating text-rating"
              : "size-4 text-muted-foreground/40"
          }
        />
      ))}
    </span>
  );
}
