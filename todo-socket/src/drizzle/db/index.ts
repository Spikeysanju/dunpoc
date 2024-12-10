import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres'
import * as schema from './schema';

console.log('Starting database connection setup...');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  throw new Error('DATABASE_URL is not set');
}

console.log('DATABASE_URL is set');

const client = postgres(process.env.DATABASE_URL);
console.log('Postgres client created,', process.env.DATABASE_URL);

export const db = drizzle(client, {
  schema: schema,
});

console.log('Drizzle ORM initialized with schema');
