import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import blockRoutes from './routes/blockRoutes';
import userRoutes from './routes/userRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import availabilityRoutes from './routes/availabilityRoutes';
import errorHandler from './middleware/errorHandler';
import openApiSpec from './docs/openapi.json';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/docs.json', (req, res) => {
  res.json(openApiSpec);
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/availability', availabilityRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'API rodando' });
});

app.use(errorHandler);

export default app;
