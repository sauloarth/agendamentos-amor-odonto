import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  durationMinutes: number;
  price: number;
  active: boolean;
  professionals: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
    professionals: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  },
  { timestamps: true }
);

productSchema.index({ professionals: 1 });

const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);

export default Product;
