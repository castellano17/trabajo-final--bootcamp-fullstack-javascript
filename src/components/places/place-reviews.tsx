import { RatingStars } from "@/components/places/rating-stars";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { formatReviewDate } from "@/lib/places/format";
import { listPlaceReviews, type PlaceReview } from "@/lib/places/queries";

const skeletonReviewCount = 3;

function ReviewItem({ review }: { review: PlaceReview }) {
  return (
    <article className="grid gap-3 rounded-xl border p-4">
      <header className="flex items-center gap-3">
        <UserAvatar
          displayName={review.author.displayName}
          avatarUrl={review.author.avatarUrl}
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
      </header>
      <RatingStars rating={review.rating} />
      <p className="leading-relaxed">{review.body}</p>
    </article>
  );
}

export async function PlaceReviews({ placeId }: { placeId: string }) {
  const reviews = await listPlaceReviews(placeId);

  if (reviews.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-4 py-8 text-center text-muted-foreground">
        Todavía no hay reseñas.
      </p>
    );
  }

  return (
    <ul className="grid gap-4">
      {reviews.map((review) => (
        <li key={review.id}>
          <ReviewItem review={review} />
        </li>
      ))}
    </ul>
  );
}

export function PlaceReviewsSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-4">
      {Array.from({ length: skeletonReviewCount }, (_, index) => (
        <div key={index} className="grid gap-3 rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}
