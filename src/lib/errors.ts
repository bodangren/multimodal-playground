export function errorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string') {
    const message = error.trim();
    if (message) {
      return message;
    }
  }

  if (error instanceof Error) {
    const message = error.message.trim();
    if (message) {
      return message;
    }
  }

  return fallback;
}
