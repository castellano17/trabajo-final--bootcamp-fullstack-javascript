export function requirePublicEnv(
  name: string,
  value: string | undefined,
): string {
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}
