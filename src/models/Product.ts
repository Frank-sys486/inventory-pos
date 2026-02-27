import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  code?: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  in_stock: number;
  user_uid: string; // User ID from NextAuth (e.g., MongoDB _id as string or original UUID)
  category?: string;
  unit: string;
  created_at: Date;
}

const ProductSchema: Schema = new Schema({
  code: { type: String },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  cost: { type: Number, required: true },
  in_stock: { type: Number, required: true, default: 0 },
  user_uid: { type: String, required: true, index: true },
  category: { type: String },
  unit: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
