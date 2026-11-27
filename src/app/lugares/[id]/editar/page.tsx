import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { updatePlace } from "@/app/lugares/actions";
import { PlaceForm } from "@/components/places/place-form";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { getPlace } from "@/lib/places/queries";
import { placeIdSchema } from "@/lib/places/schemas";

export const metadata: Metadata = {
  title: "Editar lugar · ReseñIt",
};

export default async function EditPlacePage({
  params,
}: PageProps<"/lugares/[id]/editar">) {
  const { id } = await params;
  await requireAdminPage(`/lugares/${id}/editar`);
  const place = placeIdSchema.safeParse(id).success ? await getPlace(id) : null;
  if (!place) {
    notFound();
  }

  return (
    <main className="mx-auto grid w-full max-w-xl flex-1 content-start gap-6 px-4 py-10">
      <h1 className="font-heading text-3xl font-bold">Editar {place.name}</h1>
      <Card>
        <CardContent>
          <PlaceForm
            action={updatePlace.bind(null, place.id)}
            submitLabel="Guardar cambios"
            place={{
              name: place.name,
              category: place.category,
              address: place.address,
              description: place.description,
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}
