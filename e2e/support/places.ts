export function uniquePlaceName() {
  return `Zz Prueba ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
