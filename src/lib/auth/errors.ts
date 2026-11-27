export const genericAuthErrorMessage = "Algo salió mal. Inténtalo de nuevo.";

const userFacingMessages: Partial<Record<string, string>> = {
  captcha_failed:
    "No pudimos verificar que eres una persona. Inténtalo de nuevo.",
  over_request_rate_limit:
    "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
  over_email_send_rate_limit:
    "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
  weak_password: "La contraseña es demasiado débil.",
  same_password: "La nueva contraseña debe ser distinta de la anterior.",
};

export function isUserFacingAuthError(errorCode: string | undefined): boolean {
  return Boolean(errorCode && userFacingMessages[errorCode]);
}

export function authErrorMessage(errorCode: string | undefined): string {
  return (
    (errorCode && userFacingMessages[errorCode]) || genericAuthErrorMessage
  );
}
