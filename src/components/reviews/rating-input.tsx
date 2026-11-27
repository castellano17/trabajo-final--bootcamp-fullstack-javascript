"use client";

import { Star } from "lucide-react";
import { useId, useState } from "react";

import { formatStarCount } from "@/lib/places/format";

const ratingScale = [1, 2, 3, 4, 5];

type RatingInputProps = {
  name: string;
  defaultValue?: number;
  errors?: string[];
};

export function RatingInput({
  name,
  defaultValue = 0,
  errors,
}: RatingInputProps) {
  const [rating, setRating] = useState(defaultValue);
  const errorId = useId();
  const hasErrors = Boolean(errors?.length);

  return (
    <fieldset aria-describedby={hasErrors ? errorId : undefined}>
      <legend className="mb-2 text-sm leading-none font-medium">Puntaje</legend>
      <div className="flex items-center gap-1">
        {ratingScale.map((value) => (
          <label
            key={value}
            className="cursor-pointer rounded-md p-1 transition-transform hover:scale-110 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
          >
            <input
              type="radio"
              name={name}
              value={value}
              checked={rating === value}
              onChange={() => setRating(value)}
              aria-label={formatStarCount(value)}
              className="sr-only"
            />
            <Star
              aria-hidden="true"
              className={
                value <= rating
                  ? "size-8 fill-rating text-rating"
                  : "size-8 text-muted-foreground/40"
              }
            />
          </label>
        ))}
      </div>
      {hasErrors && (
        <p id={errorId} className="mt-2 text-sm text-destructive">
          {errors?.[0]}
        </p>
      )}
    </fieldset>
  );
}
