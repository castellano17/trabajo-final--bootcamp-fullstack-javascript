import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AvatarForm } from "@/components/profile/avatar-form";
import { DisplayNameForm } from "@/components/profile/display-name-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Tu perfil · ReseñIt",
};

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/iniciar-sesion?next=/perfil");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-12">
      <h1 className="font-heading text-2xl font-bold">Tu perfil</h1>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">Foto de perfil</h2>
          </CardTitle>
          <CardDescription>
            JPEG, PNG o WebP de hasta 2 MB. La recortamos en un cuadrado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarForm
            displayName={currentUser.displayName}
            avatarUrl={currentUser.avatarUrl}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">Nombre</h2>
          </CardTitle>
          <CardDescription>Así te verán en tus reseñas.</CardDescription>
        </CardHeader>
        <CardContent>
          <DisplayNameForm displayName={currentUser.displayName} />
        </CardContent>
      </Card>
    </main>
  );
}
