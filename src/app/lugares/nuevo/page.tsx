import type { Metadata } from "next";

import { createPlace } from "@/app/lugares/actions";
import { PlaceForm } from "@/components/places/place-form";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/auth/admin-page";

export const metadata: Metadata = {
  title: "Nuevo lugar · ReseñIt",
};

export default async function NewPlacePage() {
  await requireAdminPage("/lugares/nuevo");

  return (
    <main className="mx-auto grid w-full max-w-xl flex-1 content-start gap-6 px-4 py-10">
      <h1 className="font-heading text-3xl font-bold">Nuevo lugar</h1>
      <Card>
        <CardContent>
          <PlaceForm action={createPlace} submitLabel="Crear lugar" />
        </CardContent>
      </Card>
    </main>
  );
}
