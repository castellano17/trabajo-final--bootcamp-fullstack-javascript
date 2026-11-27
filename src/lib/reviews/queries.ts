import { cache } from "react";

import { getCurrentUser } from "@/lib/auth/session";
import { publicStorageUrl } from "@/lib/images/public-url";
import { reviewPhotoBucket } from "@/lib/reviews/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const getOwnReview = cache(async (placeId: string) => {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, rating, body, is_hidden, photos:review_photos(id, storage_path, created_at)",
    )
    .eq("place_id", placeId)
    .eq("user_id", currentUser.id)
    .order("created_at", { referencedTable: "photos", ascending: true })
    .maybeSingle();
  if (error) {
    throw new Error(`Could not load own review: ${error.code}`);
  }
  if (!data) {
    return null;
  }

  return {
    id: data.id,
    rating: data.rating,
    body: data.body,
    isHidden: data.is_hidden,
    photos: data.photos.map((photo) => ({
      id: photo.id,
      storagePath: photo.storage_path,
      url: publicStorageUrl(supabase, reviewPhotoBucket, photo.storage_path),
    })),
  };
});

export type OwnReview = NonNullable<Awaited<ReturnType<typeof getOwnReview>>>;
