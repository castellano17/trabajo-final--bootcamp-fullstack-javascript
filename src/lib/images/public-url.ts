import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export function publicStorageUrl(
  supabase: SupabaseClient<Database>,
  bucket: string,
  path: string | null,
): string | null {
  return path
    ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
    : null;
}
