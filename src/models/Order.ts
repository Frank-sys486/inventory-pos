import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  product_id: mongoose.Types.ObjectId | string;
  name: string; // Snapshotted at time of order
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  customer_id: mongoose.Types.ObjectId | string;
  total_amount: number;
  user_uid: string;
  status: 'pending' | 'completed' | 'cancelled';
  items: IOrderItem[];
  isArchived: boolean;
  created_at: Date;
}

const OrderItemSchema = new Schema({
  product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required:true },
});

const OrderSchema: Schema = new Schema({
  customer_id: { type: Schema.Types.ObjectId, ref: 'Customer' },
  total_amount: { type: Number, required: true },
  user_uid: { type: String, required: true, index: true },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'completed' },
  items: [OrderItemSchema],
  isArchived: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
