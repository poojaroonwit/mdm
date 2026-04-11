// Database connection utility for PostgreSQL
// This replaces Supabase client for direct PostgreSQL connections

import { Pool } from 'pg';

const fallbackConnectionString = 'postgresql://postgres@localhost:5432/customer_data_management';

// Database configuration
const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      connectionString: fallbackConnectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Database query helper
export async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Get client from pool for transactions
export async function getClient() {
  return await pool.connect();
}

// Close all connections
export async function close() {
  await pool.end();
}

// Export pool for direct access if needed
export { pool };
