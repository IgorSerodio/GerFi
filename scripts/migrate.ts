import fs from "node:fs/promises";
import path from "node:path";
import { pool } from "../src/infra/database";

async function run(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations_history (
      id SERIAL PRIMARY KEY,
      file_name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const sqlDir = path.resolve(process.cwd(), "sql");
  const files = (await fs.readdir(sqlDir)).filter((file) => file.endsWith(".sql")).sort();

  const { rows } = await pool.query<{ file_name: string }>("SELECT file_name FROM _migrations_history");
  const appliedMigrations = new Set(rows.map((row) => row.file_name));

  for (const file of files) {
    if (appliedMigrations.has(file)) continue;

    const fullPath = path.join(sqlDir, file);
    const sql = await fs.readFile(fullPath, "utf8");

    await pool.query("BEGIN");
    try {
      await pool.query(sql);
      await pool.query("INSERT INTO _migrations_history (file_name) VALUES ($1)", [file]);
      await pool.query("COMMIT");
      console.log(`Applied migration: ${file}`);
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error(`Error applying migration ${file}, rolling back.`);
      throw error;
    }
  }
}

run()
  .then(async () => {
    await pool.end();
  })
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });
