import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  description?: string;
  order_id?: mongoose.Types.ObjectId | string;
  payment_method: string; // Stored as a string from the enum/fixed list
  amount: number;
  user_uid: string;
  type: 'income' | 'expense';
  category?: string;
  status: 'pending' | 'completed' | 'failed';
  isArchived: boolean;
  created_at: Date;
}

const TransactionSchema: Schema = new Schema({
  description: { type: String },
  order_id: { type: Schema.Types.Mixed, ref: 'Order' },
  payment_method: { type: String, required: true },
  amount: { type: Number, required: true },
  user_uid: { type: String, required: true, index: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  isArchived: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
