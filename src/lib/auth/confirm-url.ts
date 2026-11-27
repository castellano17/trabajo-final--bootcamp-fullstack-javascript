import { currentRequestOrigin } from "@/lib/site-origin";

export async function getConfirmUrl(): Promise<string> {
  return `${await currentRequestOrigin()}/auth/confirm`;
}
