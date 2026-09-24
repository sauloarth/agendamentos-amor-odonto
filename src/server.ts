import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import blockRoutes from './routes/blockRoutes';
import userRoutes from './routes/userRoutes';
import errorHandler from './middleware/errorHandler';

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'API rodando' });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
