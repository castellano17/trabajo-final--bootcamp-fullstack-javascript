import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

type CookieStore = Awaited<ReturnType<typeof cookies>>;
type CookieToSet = {
  name: string;
  value: string;
  options: Parameters<CookieStore["set"]>[2];
};

function setCookiesIfWritable(
  cookieStore: CookieStore,
  cookiesToSet: CookieToSet[],
) {
  try {
    for (const { name, value, options } of cookiesToSet) {
      cookieStore.set(name, value, options);
    }
  } catch {
    return;
  }
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        setCookiesIfWritable(cookieStore, cookiesToSet);
      },
    },
  });
}
