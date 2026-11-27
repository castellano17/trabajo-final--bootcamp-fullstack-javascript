import { cache } from "react";

import { avatarPublicUrl } from "@/lib/profile/avatar-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type CurrentUser = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: Database["public"]["Enums"]["user_role"];
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, role")
    .eq("id", userId)
    .single();
  if (!profile) {
    return null;
  }

  return {
    id: userId,
    displayName: profile.display_name,
    avatarUrl: avatarPublicUrl(supabase, profile.avatar_url),
    role: profile.role,
  };
});
