import dotenv from 'dotenv';
dotenv.config();

import connectDB from './config/db';
import app from './app';

connectDB();

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
