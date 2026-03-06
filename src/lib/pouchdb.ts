import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
import path from 'path';

PouchDB.plugin(PouchDBFind);

// Helper to get the correct database path
const getDBPath = (name: string) => {
  // In production/standalone, we want it in a 'data' folder next to the app
  return path.join(process.cwd(), 'data', name);
};

// Initialize Databases
export const dbProducts = new PouchDB(getDBPath('products'));
export const dbCustomers = new PouchDB(getDBPath('customers'));
export const dbOrders = new PouchDB(getDBPath('orders'));
export const dbTransactions = new PouchDB(getDBPath('transactions'));
export const dbUsers = new PouchDB(getDBPath('users'));

// Common helper to get all docs from a database as an array
export async function getAllDocs(db: PouchDB.Database) {
  const result = await db.allDocs({ include_docs: true });
  return result.rows.map(row => row.doc);
}
