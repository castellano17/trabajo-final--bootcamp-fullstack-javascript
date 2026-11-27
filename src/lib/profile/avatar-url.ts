import type { SupabaseClient } from "@supabase/supabase-js";

import { avatarBucket } from "@/lib/profile/avatar-config";
import type { Database } from "@/types/database";

export function avatarPublicUrl(
  supabase: SupabaseClient<Database>,
  avatarPath: string | null,
): string | null {
  return avatarPath
    ? supabase.storage.from(avatarBucket).getPublicUrl(avatarPath).data
        .publicUrl
    : null;
}
