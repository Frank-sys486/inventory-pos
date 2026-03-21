export interface IProduct {
  _id?: string;
  _rev?: string;
  code?: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  isArchived: boolean;
  created_at: Date;
}
