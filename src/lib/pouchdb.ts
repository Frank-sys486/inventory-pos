import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
import path from 'path';
import fs from 'fs';

PouchDB.plugin(PouchDBFind);

/**
 * POUCHDB STORAGE ENGINE
 * This file handles database initialization with robust path detection
 * to avoid 500 Internal Server Errors in production.
 */

const dbLog = (msg: string) => {
  try {
    const logDir = process.env.DATA_PATH || path.join(process.cwd(), 'data');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logFile = path.join(logDir, 'db-debug.log');
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(logFile, line);
  } catch (e) {}
  console.log(`[DB] ${msg}`);
};

const getDBPath = (name: string) => {
  // 1. Try Environment Variable (Set by Electron)
  let baseDir = process.env.DATA_PATH;

  // 2. Fallback to current working directory
  if (!baseDir) {
    baseDir = path.join(process.cwd(), 'data');
  }

  // 3. Ensure the directory is absolute and writable
  const finalPath = path.resolve(path.join(baseDir, name));
  
  try {
    const parent = path.dirname(finalPath);
    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
    dbLog(`Database [${name}] target: ${finalPath}`);
  } catch (e) {
    dbLog(`PATH ERROR [${name}]: ${(e as Error).message}`);
  }

  return finalPath;
};

// Initialize Databases
export const dbProducts = new PouchDB(getDBPath('products'));
export const dbCustomers = new PouchDB(getDBPath('customers'));
export const dbOrders = new PouchDB(getDBPath('orders'));
export const dbTransactions = new PouchDB(getDBPath('transactions'));
export const dbUsers = new PouchDB(getDBPath('users'));

dbLog('All database instances initialized.');

export async function getAllDocs(db: PouchDB.Database) {
  try {
    const result = await db.allDocs({ include_docs: true });
    return result.rows.map(row => row.doc);
  } catch (err) {
    dbLog(`Query Error: ${(err as Error).message}`);
    throw err;
  }
}
