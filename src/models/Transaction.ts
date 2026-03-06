export interface ITransaction {
  _id?: string;
  _rev?: string;
  description?: string;
  order_id?: string;
  payment_method: string; 
  amount: number;
  user_uid: string;
  type: 'income' | 'expense';
  category?: string;
  status: 'pending' | 'completed' | 'failed';
  isArchived: boolean;
  created_at: Date;
}
