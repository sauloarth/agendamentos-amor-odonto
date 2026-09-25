import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

interface JwtPayload {
  id: string;
}

type AuthResult = { user: IUser } | { error: string };

// Resolve o usuário de um header `Authorization: Bearer <token>`. Nunca lança.
const resolveUser = async (authHeader: string): Promise<AuthResult> => {
  const token = authHeader.split(' ')[1];

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET não definida nas variáveis de ambiente');
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return { error: 'Usuário não encontrado' };
    }

    return { user };
  } catch (err) {
    return { error: 'Token inválido ou expirado' };
  }
};

const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token não fornecido' });
    return;
  }

  const result = await resolveUser(authHeader);
  if ('error' in result) {
    res.status(401).json({ message: result.error });
    return;
  }

  req.user = result.user;
  next();
};

// Rotas públicas: sem token segue anônimo; token inválido/expirado responde 401.
const authenticateOptional = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const result = await resolveUser(authHeader);
  if ('error' in result) {
    res.status(401).json({ message: result.error });
    return;
  }

  req.user = result.user;
  next();
};

const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Acesso negado para esse papel de usuário' });
      return;
    }
    next();
  };
};

export { authenticate, authenticateOptional, authorize };
