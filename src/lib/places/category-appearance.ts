import {
  Beef,
  CookingPot,
  Drumstick,
  Fish,
  Flame,
  Ham,
  type LucideIcon,
  ShoppingBasket,
  Soup,
  Utensils,
} from "lucide-react";

import type { PlaceCategory } from "@/lib/places/categories";

type CategoryAppearance = {
  icon: LucideIcon;
  tileClassName: string;
  iconClassName: string;
};

const chartColors = {
  orange: { tileClassName: "bg-chart-1/15", iconClassName: "text-chart-1" },
  green: { tileClassName: "bg-chart-2/15", iconClassName: "text-chart-2" },
  amber: { tileClassName: "bg-chart-3/20", iconClassName: "text-chart-3" },
  red: { tileClassName: "bg-chart-4/15", iconClassName: "text-chart-4" },
  brown: { tileClassName: "bg-chart-5/15", iconClassName: "text-chart-5" },
};

export const categoryAppearance: Record<PlaceCategory, CategoryAppearance> = {
  pastor: { icon: Flame, ...chartColors.orange },
  birria: { icon: Soup, ...chartColors.red },
  suadero: { icon: Beef, ...chartColors.brown },
  carnitas: { icon: Ham, ...chartColors.amber },
  barbacoa: { icon: Drumstick, ...chartColors.brown },
  canasta: { icon: ShoppingBasket, ...chartColors.amber },
  guisado: { icon: CookingPot, ...chartColors.green },
  mariscos: { icon: Fish, ...chartColors.green },
  other: { icon: Utensils, ...chartColors.orange },
};
