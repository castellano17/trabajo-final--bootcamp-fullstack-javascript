import { z } from "zod";

import { placeCategories } from "@/lib/places/categories";
import {
  googleMapsUrlPrefixes,
  mapsUrlMaxLength,
  placeSearchMaxLength,
} from "@/lib/places/config";

const invalidMapsUrlMessage = "Pega un enlace de Google Maps.";

function isGoogleMapsUrl(url: string): boolean {
  return googleMapsUrlPrefixes.some((prefix) => url.startsWith(prefix));
}

function firstValueOf(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

export const placeFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingresa el nombre.")
    .max(100, "El nombre no puede superar los 100 caracteres."),
  category: z.enum(placeCategories, "Elige una categoría."),
  address: z
    .string()
    .trim()
    .min(1, "Ingresa la dirección.")
    .max(200, "La dirección no puede superar los 200 caracteres."),
  description: z
    .string()
    .trim()
    .max(1000, "La descripción no puede superar los 1000 caracteres."),
  mapsUrl: z
    .string()
    .trim()
    .max(mapsUrlMaxLength, invalidMapsUrlMessage)
    .refine((url) => url === "" || isGoogleMapsUrl(url), invalidMapsUrlMessage)
    .transform((url) => url || null),
});

export type PlaceForm = z.infer<typeof placeFormSchema>;

export const placeIdSchema = z.guid();

export const placeSlugSchema = z
  .string()
  .max(64)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export const placeFiltersSchema = z
  .object({
    categoria: z.preprocess(
      firstValueOf,
      z.enum(placeCategories).optional().catch(undefined),
    ),
    q: z.preprocess(
      firstValueOf,
      z
        .string()
        .trim()
        .transform((search) => search.slice(0, placeSearchMaxLength))
        .optional()
        .catch(undefined),
    ),
    pagina: z.preprocess(firstValueOf, z.coerce.number().int().min(1).catch(1)),
  })
  .transform(({ categoria, q, pagina }) => ({
    category: categoria,
    search: q || undefined,
    page: pagina,
  }));

export type PlaceFilters = z.infer<typeof placeFiltersSchema>;
