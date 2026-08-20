// Client Prisma "trần" - chưa qua $extends. Các module khác cần bypass extension
// (audit/soft-delete) để truy vấn thẳng vào DB thì import basePrisma từ đây thay vì prisma.js
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const basePrisma = new PrismaClient({ adapter });

module.exports = { basePrisma };
