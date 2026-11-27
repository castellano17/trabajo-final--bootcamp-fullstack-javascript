import { RatingStars } from "@/components/places/rating-stars";
import { RatingSummary } from "@/components/places/rating-summary";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { formatReviewDate } from "@/lib/places/format";
import { listPlaceReviews, type PlaceReview } from "@/lib/places/queries";
import { buildRatingDistribution } from "@/lib/places/rating-distribution";

const skeletonReviewCount = 3;

type PlaceReviewsProps = {
  placeId: string;
  averageRating: number;
  reviewCount: number;
};

function ReviewItem({ review }: { review: PlaceReview }) {
  return (
    <article className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <p className="p-5 leading-relaxed">{review.body}</p>
      <footer className="flex items-center justify-between gap-3 border-t bg-muted/50 px-5 py-3 max-sm:flex-col max-sm:items-start">
        <div className="flex items-center gap-3">
          <UserAvatar
            displayName={review.author.displayName}
            avatarUrl={review.author.avatarUrl}
            className="ring-2 ring-primary/20"
          />
          <div className="grid">
            <span className="font-medium">{review.author.displayName}</span>
            <time
              dateTime={review.createdAt}
              className="text-xs text-muted-foreground"
            >
              {formatReviewDate(review.createdAt)}
            </time>
          </div>
        </div>
        <RatingStars rating={review.rating} />
      </footer>
    </article>
  );
}

export async function PlaceReviews({
  placeId,
  averageRating,
  reviewCount,
}: PlaceReviewsProps) {
  const reviews = await listPlaceReviews(placeId);
  const distribution = buildRatingDistribution(
    reviews.map((review) => review.rating),
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[18rem_1fr]">
      <RatingSummary
        averageRating={averageRating}
        reviewCount={reviewCount}
        distribution={distribution}
      />
      {reviews.length === 0 ? (
        <p className="rounded-2xl border border-dashed bg-card px-4 py-10 text-center text-muted-foreground">
          Todavía no hay reseñas.
        </p>
      ) : (
        <ul className="grid gap-4">
          {reviews.map((review) => (
            <li key={review.id}>
              <ReviewItem review={review} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PlaceReviewsSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid items-start gap-6 lg:grid-cols-[18rem_1fr]"
    >
      <Skeleton className="h-56 rounded-2xl" />
      <div className="grid gap-4">
        {Array.from({ length: skeletonReviewCount }, (_, index) => (
          <div key={index} className="grid gap-3 rounded-xl border p-5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex items-center gap-3 pt-2">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
