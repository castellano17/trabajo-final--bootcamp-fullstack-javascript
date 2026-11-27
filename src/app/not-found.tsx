import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="font-heading text-3xl font-bold">
        No encontramos esta página
      </h1>
      <p className="text-muted-foreground">
        Puede que el enlace esté mal escrito o que el contenido ya no exista.
      </p>
      <Button asChild>
        <Link href="/lugares">Ver taquerías</Link>
      </Button>
    </main>
  );
}
