import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.ts';

import { env } from './env.ts';



export const pool = new Pool({
    connectionString : env.DATABASE_URL,
    max: 10,
})

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });