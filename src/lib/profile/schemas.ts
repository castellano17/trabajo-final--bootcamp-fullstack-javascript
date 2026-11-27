import { z } from "zod";

import { avatarMaxBytes } from "@/lib/profile/avatar-config";

export const displayNameField = z
  .string()
  .trim()
  .min(1, "Ingresa tu nombre.")
  .max(50, "El nombre no puede superar los 50 caracteres.");

export const displayNameSchema = z.object({
  displayName: displayNameField,
});

export const avatarFileSchema = z.object({
  avatar: z
    .file("Elige una imagen.")
    .min(1, "Elige una imagen.")
    .max(avatarMaxBytes, "La imagen no puede superar los 2 MB."),
});
