import Link from "next/link";

import { placeCategories, placeCategoryLabels } from "@/lib/places/categories";
import { categoryAppearance } from "@/lib/places/category-appearance";

export function CategoryLinks() {
  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
      {placeCategories.map((category) => {
        const {
          icon: CategoryIcon,
          tileClassName,
          iconClassName,
        } = categoryAppearance[category];
        return (
          <li key={category}>
            <Link
              href={`/lugares?categoria=${category}`}
              className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span
                className={`flex size-11 items-center justify-center rounded-full ${tileClassName}`}
              >
                <CategoryIcon
                  aria-hidden="true"
                  className={`size-5 ${iconClassName}`}
                />
              </span>
              {placeCategoryLabels[category]}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
