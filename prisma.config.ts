import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Para prisma generate no es obligatorio tener DB; para migrate/seed sí.
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/radar",
  },
});
