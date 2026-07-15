import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Session pooler — IPv4 compatible, works on Supabase free tier
    // Transaction pooler is IPv6 only on free tier
    url: process.env.DATABASE_URL,
  },
});
