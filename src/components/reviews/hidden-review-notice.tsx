export function HiddenReviewNotice() {
  return (
    <p
      role="status"
      className="rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground"
    >
      Un moderador ocultó tu reseña. No aparece en la lista ni cuenta en el
      promedio. Puedes editarla o borrarla, pero seguirá oculta.
    </p>
  );
}
