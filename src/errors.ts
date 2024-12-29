export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }

  static from(error: unknown, context?: string): DatabaseError {
    if (error instanceof DatabaseError) {
      return error;
    }

    // SQLite errors have a code property
    if (error && typeof error === 'object' && 'code' in error) {
      const sqliteError = error as { code: string; message?: string };
      const message = context
        ? `${context}: ${sqliteError.message || 'Unknown error'}`
        : sqliteError.message || 'Unknown error';

      return new DatabaseError(message, sqliteError.code, error);
    }

    const message = context
      ? `${context}: ${error instanceof Error ? error.message : 'Unknown error'}`
      : error instanceof Error
        ? error.message
        : 'Unknown error';

    return new DatabaseError(message, undefined, error);
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: unknown[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'NetworkError';
  }

  static from(error: unknown, context?: string): NetworkError {
    if (error instanceof NetworkError) {
      return error;
    }

    // Check if it's a fetch/undici error with status code
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const httpError = error as { statusCode: number; message?: string };
      const message = context
        ? `${context}: ${httpError.message || 'Unknown error'}`
        : httpError.message || 'Unknown error';

      return new NetworkError(message, httpError.statusCode, error);
    }

    const message = context
      ? `${context}: ${error instanceof Error ? error.message : 'Unknown error'}`
      : error instanceof Error
        ? error.message
        : 'Unknown error';

    return new NetworkError(message, undefined, error);
  }
}

// Helper function to determine if an error is a specific type
export function isErrorType<T extends Error>(
  error: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorType: new (...args: any[]) => T
): error is T {
  return error instanceof errorType;
}

export class TelegramError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'TelegramError';
  }

  static from(error: unknown, context?: string): TelegramError {
    if (error instanceof TelegramError) {
      return error;
    }

    // Handle Telegraf specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      const telegramError = error as { code: string; message?: string };
      const message = context
        ? `${context}: ${telegramError.message || 'Unknown telegram error'}`
        : telegramError.message || 'Unknown telegram error';

      return new TelegramError(message, telegramError.code, error);
    }

    const message = context
      ? `${context}: ${error instanceof Error ? error.message : 'Unknown error'}`
      : error instanceof Error
        ? error.message
        : 'Unknown error';

    return new TelegramError(message, undefined, error);
  }
}
