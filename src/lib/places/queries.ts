import { cache } from "react";

import { placesPerPage } from "@/lib/places/config";
import type { PlaceFilters } from "@/lib/places/schemas";
import { escapeLikePattern } from "@/lib/places/search-pattern";
import { avatarPublicUrl } from "@/lib/profile/avatar-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const rangeNotSatisfiableCode = "PGRST103";

export async function listPlaces(filters: PlaceFilters) {
  const supabase = await createSupabaseServerClient();
  const firstRow = (filters.page - 1) * placesPerPage;

  let query = supabase
    .from("places")
    .select("id, name, category, address, average_rating, review_count", {
      count: "exact",
    })
    .order("average_rating", { ascending: false })
    .order("review_count", { ascending: false })
    .order("name", { ascending: true })
    .range(firstRow, firstRow + placesPerPage - 1);
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
      "id, rating, body, created_at, author:profiles!reviews_user_id_fkey(display_name, avatar_url)",
    )
    .eq("place_id", placeId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });
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
      avatarUrl: avatarPublicUrl(supabase, review.author.avatar_url),
    },
  }));
}

export type PlaceReview = Awaited<ReturnType<typeof listPlaceReviews>>[number];
