export interface ICustomer {
  _id?: string;
  _rev?: string;
  name: string;
  email?: string;
  phone?: string;
  status: "active" | "inactive";
  isArchived: boolean;
  created_at: Date;
}
