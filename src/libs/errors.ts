export interface AppError extends Error {
  statusCode: number;
}

export function createAppError(message: string, statusCode = 400): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.name = 'AppError';
  return error;
}

export function unauthorizedError(message = 'Unauthorized.'): AppError {
  return createAppError(message, 401);
}

export function notFoundError(message = 'Resource not found.'): AppError {
  return createAppError(message, 404);
}

export function conflictError(message = 'Conflict.'): AppError {
  return createAppError(message, 409);
}

export function badRequestError(message = 'Bad request.'): AppError {
  return createAppError(message, 400);
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof Error && typeof (error as AppError).statusCode === 'number';
}
