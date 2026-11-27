import { cache } from "react";

import { publicStorageUrl } from "@/lib/images/public-url";
import { featuredPlacesCount, placesPerPage } from "@/lib/places/config";
import type { PlaceFilters } from "@/lib/places/schemas";
import { escapeLikePattern } from "@/lib/places/search-pattern";
import { avatarBucket } from "@/lib/profile/avatar-config";
import { reviewPhotoBucket } from "@/lib/reviews/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const rangeNotSatisfiableCode = "PGRST103";

const placeSummaryColumns =
  "id, name, category, address, average_rating, review_count";

const placeRankingOrder = [
  { column: "average_rating", ascending: false },
  { column: "review_count", ascending: false },
  { column: "name", ascending: true },
  { column: "id", ascending: true },
] as const;

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

function rankedPlacesQuery(supabase: SupabaseServerClient) {
  let query = supabase
    .from("places")
    .select(placeSummaryColumns, { count: "exact" });
  for (const { column, ascending } of placeRankingOrder) {
    query = query.order(column, { ascending });
  }
  return query;
}

export async function listPlaces(filters: PlaceFilters) {
  const supabase = await createSupabaseServerClient();
  const firstRow = (filters.page - 1) * placesPerPage;

  let query = rankedPlacesQuery(supabase).range(
    firstRow,
    firstRow + placesPerPage - 1,
  );
  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.search) {
    query = query.ilike("name", `%${escapeLikePattern(filters.search)}%`);
  }

  const { data, count, error } = await query;
  if (error?.code === rangeNotSatisfiableCode) {
    return { places: [], totalCount: 0 };
  }
  if (error) {
    throw new Error(`Could not list places: ${error.code}`);
  }
  return { places: data, totalCount: count ?? 0 };
}

export type PlaceSummary = Awaited<
  ReturnType<typeof listPlaces>
>["places"][number];

export async function listTopRatedPlaces(): Promise<PlaceSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await rankedPlacesQuery(supabase)
    .gt("review_count", 0)
    .limit(featuredPlacesCount);
  if (error) {
    throw new Error(`Could not list top rated places: ${error.code}`);
  }
  return data;
}

export const getPlace = cache(async (placeId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("places")
    .select(
      "id, name, category, description, address, average_rating, review_count",
    )
    .eq("id", placeId)
    .maybeSingle();
  if (error) {
    throw new Error(`Could not load place: ${error.code}`);
  }
  return data;
});

export type PlaceDetail = NonNullable<Awaited<ReturnType<typeof getPlace>>>;

export async function listPlaceReviews(placeId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, rating, body, created_at, author:profiles!reviews_user_id_fkey(display_name, avatar_url), photos:review_photos(id, storage_path, created_at)",
    )
    .eq("place_id", placeId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .order("created_at", { referencedTable: "photos", ascending: true });
  if (error) {
    throw new Error(`Could not list reviews: ${error.code}`);
  }

  return data.map((review) => ({
    id: review.id,
    rating: review.rating,
    body: review.body,
    createdAt: review.created_at,
    author: {
      displayName: review.author.display_name,
      avatarUrl: publicStorageUrl(
        supabase,
        avatarBucket,
        review.author.avatar_url,
      ),
    },
    photos: review.photos.map((photo) => ({
      id: photo.id,
      url: publicStorageUrl(supabase, reviewPhotoBucket, photo.storage_path),
    })),
  }));
}

export type PlaceReview = Awaited<ReturnType<typeof listPlaceReviews>>[number];

export async function countPlaceReviews(placeId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("place_id", placeId);
  if (error) {
    throw new Error(`Could not count reviews: ${error.code}`);
  }
  return count ?? 0;
}
