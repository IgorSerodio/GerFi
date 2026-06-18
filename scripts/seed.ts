import { pool } from "../src/infra/database";
import bcrypt from "bcryptjs";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || "Administrador GerFi";
const ADMIN_MATRICULA = process.env.ADMIN_MATRICULA || "00000";
const ADMIN_CPF = process.env.ADMIN_CPF || "000.000.000-00";

async function main() {
  console.log("Seeding database...");
  if (!ADMIN_PASSWORD) {
    console.error("Error: ADMIN_PASSWORD environment variable is not defined.");
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Seed TV Settings
    console.log("Seeding TV settings...");
    await client.query(`
      INSERT INTO tv_settings (id, mode, live_url, uploaded_files)
      VALUES (1, 'live', 'https://www.youtube.com/embed/live_stream?channel=UC77X3Z_78d52S9T3Z_V5-0w', '[]'::jsonb)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 2. Seed Admin User
    console.log(`Seeding admin user (${ADMIN_USERNAME})...`);
    
    // Hash password before inserting
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, salt);

    await client.query(`
      INSERT INTO users (name, role, guiche, matricula, cpf, email, username, password, services, blocked)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (matricula) DO UPDATE SET 
        name = EXCLUDED.name,
        cpf = EXCLUDED.cpf,
        username = EXCLUDED.username, 
        password = EXCLUDED.password;
    `, [
      ADMIN_NAME,
      "Admin",
      "-",
      ADMIN_MATRICULA,
      ADMIN_CPF,
      "admin@caruaru.pe.gov.br",
      ADMIN_USERNAME,
      passwordHash,
      [],
      false
    ]);

    await client.query("COMMIT");
    console.log("Database seeded successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error seeding database, rolled back:", error);
    throw error;
  } finally {
    client.release();
  }
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });
