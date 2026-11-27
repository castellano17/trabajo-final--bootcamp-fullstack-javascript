const ratingScale = [5, 4, 3, 2, 1];

export type RatingDistributionRow = {
  rating: number;
  count: number;
  percentage: number;
};

export function buildRatingDistribution(
  ratings: number[],
): RatingDistributionRow[] {
  return ratingScale.map((rating) => {
    const count = ratings.filter((value) => value === rating).length;
    return {
      rating,
      count,
      percentage:
        ratings.length > 0 ? Math.round((count * 100) / ratings.length) : 0,
    };
  });
}
