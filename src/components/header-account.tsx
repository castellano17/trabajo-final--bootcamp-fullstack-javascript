import Link from "next/link";

import { signOut } from "@/app/(auth)/actions";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { getCurrentUser } from "@/lib/auth/session";

export async function HeaderAccount() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <>
        <Button asChild variant="ghost" size="sm">
          <Link href="/iniciar-sesion">Iniciar sesión</Link>
        </Button>
        <Button asChild size="sm" className="max-sm:hidden">
          <Link href="/registro">Registrarse</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <Link
        href="/perfil"
        className="flex items-center gap-2 rounded-lg px-1 py-0.5 text-sm font-medium hover:bg-muted"
      >
        <UserAvatar
          displayName={currentUser.displayName}
          avatarUrl={currentUser.avatarUrl}
          size="sm"
        />
        <span className="max-w-40 truncate max-sm:hidden">
          {currentUser.displayName}
        </span>
      </Link>
      <form action={signOut}>
        <SignOutButton />
      </form>
    </>
  );
}
