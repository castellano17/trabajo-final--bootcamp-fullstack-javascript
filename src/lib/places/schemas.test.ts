import { describe, expect, it } from "vitest";

import {
  placeFiltersSchema,
  placeFormSchema,
  placeIdSchema,
  placeSlugSchema,
} from "@/lib/places/schemas";

const validPlace = {
  name: "  Tacos El Güero  ",
  category: "pastor",
  address: "  Av. Insurgentes Sur 1234  ",
  description: "  Pastor al trompo.  ",
};

function failedFieldsOf(result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[] }[] };
}) {
  return result.error?.issues.map((issue) => issue.path.join(".")) ?? [];
}

describe("placeFormSchema", () => {
  it("trims the fields and rejects an empty name or address, an unknown category and a long description", () => {
    expect(placeFormSchema.parse(validPlace)).toEqual({
      name: "Tacos El Güero",
      category: "pastor",
      address: "Av. Insurgentes Sur 1234",
      description: "Pastor al trompo.",
    });
    expect(placeFormSchema.parse({ ...validPlace, description: "" })).toEqual(
      expect.objectContaining({ description: "" }),
    );

    const invalidResult = placeFormSchema.safeParse({
      name: "   ",
      category: "sushi",
      address: "",
      description: "a".repeat(1001),
    });

    expect(failedFieldsOf(invalidResult).sort()).toEqual([
      "address",
      "category",
      "description",
      "name",
    ]);
  });
});

describe("placeIdSchema", () => {
  it("accepts a place id and rejects anything that is not a UUID", () => {
    expect(
      placeIdSchema.safeParse("b0000000-0000-0000-0000-000000000001").success,
    ).toBe(true);
    expect(placeIdSchema.safeParse("tacos-el-guero").success).toBe(false);
  });
});

describe("placeFiltersSchema", () => {
  it("reads the category, search and page from the URL", () => {
    expect(
      placeFiltersSchema.parse({
        categoria: "birria",
        q: "  don  ",
        pagina: "2",
      }),
    ).toEqual({ category: "birria", search: "don", page: 2 });
  });

  it("ignores an invalid category or page instead of failing", () => {
    expect(
      placeFiltersSchema.parse({ categoria: "sushi", q: "   ", pagina: "-3" }),
    ).toEqual({ category: undefined, search: undefined, page: 1 });
    expect(
      placeFiltersSchema.parse({
        categoria: ["birria", "pastor"],
        pagina: "abc",
      }),
    ).toEqual({ category: "birria", search: undefined, page: 1 });
    expect(placeFiltersSchema.parse({})).toEqual({
      category: undefined,
      search: undefined,
      page: 1,
    });
    expect(
      placeFiltersSchema.parse({ q: "a".repeat(150) }).search,
    ).toHaveLength(100);
  });
});

describe("placeSlugSchema", () => {
  it("accepts only the slug format the database generates", () => {
    expect(placeSlugSchema.safeParse("tacos-el-guero").success).toBe(true);
    expect(placeSlugSchema.safeParse("nuevo-2").success).toBe(true);
    for (const invalidSlug of [
      "",
      "Tacos-El-Guero",
      "tacos--guero",
      "-tacos",
      "tacos_guero",
      "a".repeat(65),
    ]) {
      expect(placeSlugSchema.safeParse(invalidSlug).success).toBe(false);
    }
  });
});
