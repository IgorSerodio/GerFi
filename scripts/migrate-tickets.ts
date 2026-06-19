import fs from "fs";
import path from "path";

// Load .env manually to ensure DATABASE_URL is available
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=:#]+?)[=:](.*)/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/['"]/g, "");
      process.env[key] = value;
    }
  });
}

import { pool } from "../src/infra/database";

async function migrate() {
  console.log("Iniciando migração da tabela tickets...");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Renomear a coluna id para ticket_number
    console.log("Renomeando coluna 'id' para 'ticket_number'...");
    await client.query("ALTER TABLE tickets RENAME COLUMN id TO ticket_number;");

    // 2. Remover a constraint de primary key atual
    console.log("Removendo constraint de primary key atual...");
    await client.query("ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_pkey;");

    // 3. Adicionar nova coluna id UUID gerada automaticamente e defini-la como Primary Key
    console.log("Adicionando nova coluna 'id' (UUID) como Primary Key...");
    await client.query("ALTER TABLE tickets ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();");

    await client.query("COMMIT");
    console.log("Migração concluída com sucesso!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro durante a migração. Alterações revertidas.", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
