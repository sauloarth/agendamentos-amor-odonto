import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI não definida nas variáveis de ambiente');
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB conectado');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Erro ao conectar no MongoDB:', message);
    process.exit(1);
  }
};

export default connectDB;
