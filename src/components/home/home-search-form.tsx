import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { placeSearchMaxLength } from "@/lib/places/config";

export function HomeSearchForm() {
  return (
    <form
      action="/lugares"
      method="get"
      role="search"
      aria-label="Buscar taquerías"
      className="flex w-full max-w-md items-center gap-2 rounded-xl border bg-background p-1.5 shadow-sm"
    >
      <label htmlFor="home-search" className="sr-only">
        Buscar taquerías por nombre
      </label>
      <Search
        aria-hidden="true"
        className="ml-2 size-4 shrink-0 text-muted-foreground"
      />
      <Input
        id="home-search"
        name="q"
        type="search"
        maxLength={placeSearchMaxLength}
        placeholder="Busca una taquería"
        className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
      <Button type="submit" className="h-9 px-4">
        Buscar
      </Button>
    </form>
  );
}
