import Link from "next/link";

import { DeletePlaceDialog } from "@/components/places/delete-place-dialog";
import { Button } from "@/components/ui/button";
import { placeEditPath } from "@/lib/places/paths";
import { countPlaceReviews, type PlaceDetail } from "@/lib/places/queries";

export async function PlaceAdminActions({ place }: { place: PlaceDetail }) {
  const reviewCount = await countPlaceReviews(place.id);

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline">
        <Link href={placeEditPath(place.slug)}>Editar</Link>
      </Button>
      <DeletePlaceDialog
        placeId={place.id}
        placeName={place.name}
        reviewCount={reviewCount}
      />
    </div>
  );
}
