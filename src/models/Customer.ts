import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  email?: string;
  phone?: string;
  user_uid: string;
  status: 'active' | 'inactive';
  created_at: Date;
}

const CustomerSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: false, unique: false, index: true, sparse: true }, // unique scoped to user_uid would be better but keeping simple for now
  phone: { type: String },
  user_uid: { type: String, required: true, index: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
