import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type CurrentUser = {
  id: string;
  displayName: string;
  role: Database["public"]["Enums"]["user_role"];
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", userId)
    .single();
  if (!profile) {
    return null;
  }

  return { id: userId, displayName: profile.display_name, role: profile.role };
}
