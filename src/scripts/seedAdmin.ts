import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';

const seedAdmin = async (): Promise<void> => {
  const [, , email, password, name] = process.argv;

  if (!email || !password) {
    console.log('Uso: npm run seed:admin -- email senha "Nome"');
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI não definida nas variáveis de ambiente');
  }

  await mongoose.connect(mongoUri);

  const exists = await User.findOne({ email });
  if (exists) {
    console.log('Já existe um usuário com esse e-mail');
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    name: name || 'Admin',
    email,
    password: hashedPassword,
    role: 'admin',
  });

  console.log('Admin criado com sucesso:', email);
  process.exit(0);
};

seedAdmin();
