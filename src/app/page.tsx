import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="text-5xl font-bold tracking-tight">ReseñIt</h1>
      <p className="max-w-md text-lg text-muted-foreground">
        Descubre las mejores taquerías, califícalas y comparte tus reseñas.
      </p>
      <Button size="lg">Explorar taquerías</Button>
    </main>
  );
}
