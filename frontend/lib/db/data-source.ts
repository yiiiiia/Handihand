import pg from 'pg';
import "reflect-metadata";

const { Pool } = pg

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 3000,
    connectionTimeoutMillis: 3000,
})