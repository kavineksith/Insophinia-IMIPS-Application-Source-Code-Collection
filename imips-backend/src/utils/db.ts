// db.ts - Modified version
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import DatabaseSeeder from './seedData';

const dbFile = path.join(__dirname, '..', 'database.sqlite');

if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, '');

let databaseInstance: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export const initDB = async (options: { seedData?: boolean } = {}) => {
  if (databaseInstance) return databaseInstance;

  databaseInstance = await open({
    filename: dbFile,
    driver: sqlite3.Database,
  });

  await databaseInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT,
      profilePictureUrl TEXT
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT,
      sku TEXT,
      quantity INTEGER,
      threshold INTEGER,
      category TEXT,
      price REAL,
      imageUrl TEXT,
      warrantyPeriod INTEGER
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      customerName TEXT,
      customerEmail TEXT,
      inquiryDetails TEXT,
      status TEXT,
      assignedStaffId TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customerName TEXT,
      customerContact TEXT,
      customerAddress TEXT,
      customerEmail TEXT,
      subtotal REAL,
      discountAmount REAL,
      total REAL,
      createdAt TEXT,
      createdBy TEXT,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId TEXT,
      itemId TEXT,
      name TEXT,
      price REAL,
      quantity INTEGER,
      FOREIGN KEY (orderId) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS emails (
      id TEXT PRIMARY KEY,
      recipient TEXT,
      subject TEXT,
      body TEXT,
      sentAt TEXT,
      attachmentName TEXT,
      attachmentData TEXT
    );

    CREATE TABLE IF NOT EXISTS discounts (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE,
    description TEXT,
    type TEXT,
    value REAL,
    condition TEXT,
    isActive INTEGER DEFAULT 1,
    usedCount INTEGER DEFAULT 0,
    createdAt TEXT,
    createdBy TEXT
);
  `);

  // Conditional seeding based on options
  const shouldSeed = options.seedData !== false; // Default to true if not specified
  if (shouldSeed) {
    await DatabaseSeeder.runFullSeed(databaseInstance);
  }

  console.log('Database initialized');

  return databaseInstance;
};

// Export the database instance directly
export const getDB = () => {
  if (!databaseInstance) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return databaseInstance;
};

// Export a function to run seeding manually if needed
export const runDatabaseSeed = async () => {
  if (!databaseInstance) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  await DatabaseSeeder.runFullSeed(databaseInstance);
};