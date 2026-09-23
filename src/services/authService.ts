import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import AppError from '../utils/AppError';
import { RegisterInput, LoginInput } from '../validations/authValidation';

interface AuthResult {
  _id: string;
  name: string;
  email: string;
  role: IUser['role'];
  token: string;
}

const generateToken = (id: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET não definida nas variáveis de ambiente');
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

  return jwt.sign({ id }, jwtSecret, { expiresIn });
};

const toAuthResult = (user: IUser): AuthResult => ({
  _id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  token: generateToken(user._id.toString()),
});

const registerUser = async (input: RegisterInput): Promise<AuthResult> => {
  const { name, email, password, phone } = input;

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new AppError('E-mail já cadastrado', 400);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    role: 'client',
  });

  return toAuthResult(user);
};

const loginUser = async (input: LoginInput): Promise<AuthResult> => {
  const { email, password } = input;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Credenciais inválidas', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Credenciais inválidas', 401);
  }

  return toAuthResult(user);
};

export { registerUser, loginUser };
