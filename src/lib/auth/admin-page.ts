import { notFound, redirect } from "next/navigation";

import { type CurrentUser, getCurrentUser, isAdmin } from "@/lib/auth/session";

export async function requireAdminPage(
  currentPath: string,
): Promise<CurrentUser> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect(`/iniciar-sesion?next=${encodeURIComponent(currentPath)}`);
  }
  if (!isAdmin(currentUser)) {
    notFound();
  }
  return currentUser;
}
