import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?: number;
  errorCode?: string;
  details?: any;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error caught by Central Handler:', err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const errorCode = err.errorCode || 'INTERNAL_ERROR';
  const details = err.details || {};

  res.status(status).json({
    success: false,
    message,
    errorCode,
    details
  });
}
