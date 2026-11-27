import Link from "next/link";

import { signOut } from "@/app/(auth)/actions";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";

export async function HeaderAccount() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <>
        <Button asChild variant="ghost" size="sm">
          <Link href="/iniciar-sesion">Iniciar sesión</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/registro">Registrarse</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <span className="max-w-40 truncate text-sm font-medium">
        {currentUser.displayName}
      </span>
      <form action={signOut}>
        <SignOutButton />
      </form>
    </>
  );
}
