import type { Metadata } from "next";

import { updatePlace } from "@/app/lugares/actions";
import { PlaceForm } from "@/components/places/place-form";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { placeEditPath } from "@/lib/places/paths";
import { findPlaceForRoute } from "@/lib/places/place-route";

export const metadata: Metadata = {
  title: "Editar lugar · ReseñIt",
};

export default async function EditPlacePage({
  params,
}: PageProps<"/lugares/[slug]/editar">) {
  const place = await findPlaceForRoute((await params).slug, placeEditPath);
  await requireAdminPage(placeEditPath(place.slug));

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
