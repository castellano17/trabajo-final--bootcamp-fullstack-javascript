import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { placeCategories, placeCategoryLabels } from "@/lib/places/categories";
import { placeSearchMaxLength } from "@/lib/places/config";
import type { PlaceFilters as PlaceFiltersValues } from "@/lib/places/schemas";

export function PlaceFilters({ filters }: { filters: PlaceFiltersValues }) {
  return (
    <form
      action="/lugares"
      method="get"
      role="search"
      aria-label="Filtrar taquerías"
      className="grid gap-3 rounded-2xl border bg-card p-4 shadow-xs sm:grid-cols-[1fr_auto_auto] sm:items-end"
    >
      <div className="grid gap-2">
        <Label htmlFor="place-search">Buscar por nombre</Label>
        <Input
          id="place-search"
          name="q"
          type="search"
          maxLength={placeSearchMaxLength}
          defaultValue={filters.search ?? ""}
          placeholder="Por ejemplo, Güero"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="place-category">Categoría</Label>
        <NativeSelect
          id="place-category"
          name="categoria"
          defaultValue={filters.category ?? ""}
        >
          <NativeSelectOption value="">Todas</NativeSelectOption>
          {placeCategories.map((category) => (
            <NativeSelectOption key={category} value={category}>
              {placeCategoryLabels[category]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <Button type="submit">Filtrar</Button>
    </form>
  );
}
