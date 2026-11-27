import { describe, expect, it } from "vitest";

import { escapeLikePattern } from "@/lib/places/search-pattern";

describe("escapeLikePattern", () => {
  it("escapes backslashes, percent signs, underscores and asterisks so they match literally", () => {
    expect(escapeLikePattern("100% taco_bar\\")).toBe("100\\% taco\\_bar\\\\");
    expect(escapeLikePattern("*")).toBe("\\*");
    expect(escapeLikePattern("Tacos El Güero")).toBe("Tacos El Güero");
  });
});
