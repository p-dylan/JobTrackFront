import { isAxiosError } from "axios";

// Message d'erreur renvoyé par le back ({ statusCode, message }), sinon le message par défaut
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message !== "Bad Request Exception") return message;
  }
  return fallback;
}
