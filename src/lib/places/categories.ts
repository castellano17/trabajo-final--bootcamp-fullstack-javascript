import { Constants, type Database } from "@/types/database";

export type PlaceCategory = Database["public"]["Enums"]["place_category"];

export const placeCategories = Constants.public.Enums.place_category;

export const placeCategoryLabels: Record<PlaceCategory, string> = {
  pastor: "Pastor",
  birria: "Birria",
  suadero: "Suadero",
  carnitas: "Carnitas",
  barbacoa: "Barbacoa",
  canasta: "Canasta",
  guisado: "Guisado",
  mariscos: "Mariscos",
  other: "Otro",
};
