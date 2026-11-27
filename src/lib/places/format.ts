const ratingFormatter = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const reviewDateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "long",
});

export function formatRating(rating: number): string {
  return ratingFormatter.format(rating);
}

export function formatReviewCount(reviewCount: number): string {
  return reviewCount === 1 ? "1 reseña" : `${reviewCount} reseñas`;
}

export function formatReviewDate(isoDate: string): string {
  return reviewDateFormatter.format(new Date(isoDate));
}
