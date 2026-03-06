export interface IOrderItem {
  product_id: string;
  name: string; 
  quantity: number;
  price: number;
}

export interface IOrder {
  _id?: string;
  _rev?: string;
  customer_id: string;
  total_amount: number;
  user_uid: string;
  status: 'pending' | 'completed' | 'cancelled';
  items: IOrderItem[];
  isArchived: boolean;
  created_at: Date;
}
