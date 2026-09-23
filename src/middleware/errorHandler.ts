import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';

const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  const message = err instanceof Error ? err.message : String(err);
  res.status(500).json({ message: 'Erro interno do servidor', error: message });
};

export default errorHandler;
