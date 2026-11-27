import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPlace, deletePlace, updatePlace } from "@/app/lugares/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { initialFormState } from "@/lib/forms/form-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(),
  isAdmin: (user: { role: string } | null) => user?.role === "admin",
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const placeId = "b0000000-0000-0000-0000-000000000001";

function validPlaceFormData() {
  const formData = new FormData();
  formData.set("name", "Tacos Nuevos");
  formData.set("category", "pastor");
  formData.set("address", "Calle 1");
  formData.set("description", "");
  return formData;
}

const placeActions = [
  ["createPlace", () => createPlace(initialFormState, validPlaceFormData())],
  [
    "updatePlace",
    () => updatePlace(placeId, initialFormState, validPlaceFormData()),
  ],
  ["deletePlace", () => deletePlace(placeId)],
] as const;

describe("place actions", () => {
  beforeEach(() => {
    vi.mocked(createSupabaseServerClient).mockClear();
  });

  it.each(placeActions)(
    "%s rejects a signed-in user who is not an admin without touching the database",
    async (_actionName, runAction) => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "a0000000-0000-0000-0000-000000000001",
        displayName: "Usuaria Demo",
        avatarUrl: null,
        role: "user",
      });

      const result = await runAction();

      expect(result).toEqual(expect.objectContaining({ status: "error" }));
      expect(createSupabaseServerClient).not.toHaveBeenCalled();
    },
  );

  it.each(placeActions)(
    "%s rejects a visitor without a session without touching the database",
    async (_actionName, runAction) => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const result = await runAction();

      expect(result).toEqual(expect.objectContaining({ status: "error" }));
      expect(createSupabaseServerClient).not.toHaveBeenCalled();
    },
  );
});
