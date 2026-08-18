import { Client } from "pg";
import { execSync } from "child_process";

async function setupTestDb() {
  let defaultUrl = process.env.DATABASE_URL;
  if (!defaultUrl) {
    throw new Error("DATABASE_URL is required in .env");
  }

  // Interpolação manual porque o --env-file do Node não suporta variáveis na string
  defaultUrl = defaultUrl
    .replace("${POSTGRES_USER}", process.env.POSTGRES_USER || "postgres")
    .replace("${POSTGRES_PASSWORD}", process.env.POSTGRES_PASSWORD || "postgres")
    .replace("${POSTGRES_HOST}", process.env.POSTGRES_HOST || "localhost")
    .replace("${POSTGRES_PORT}", process.env.POSTGRES_PORT || "5432")
    .replace("${POSTGRES_DB}", process.env.POSTGRES_DB || "postgres");

  const url = new URL(defaultUrl);
  const testDbName = "gerfi_test";

  // Connect to the default 'postgres' database to create/drop
  const adminUrl = new URL(defaultUrl);
  adminUrl.pathname = "/postgres";
  
  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();

  console.log("Dropping test database if exists...");
  await client.query(`DROP DATABASE IF EXISTS ${testDbName}`);

  console.log("Creating test database...");
  await client.query(`CREATE DATABASE ${testDbName}`);

  await client.end();

  // Now run the migrations on the test database
  const testUrl = new URL(defaultUrl);
  testUrl.pathname = `/${testDbName}`;
  const testConnectionString = testUrl.toString();

  console.log("Running migrations on test database...");
  execSync("tsx scripts/migrate.ts", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testConnectionString }
  });

  console.log("Test database setup complete.");
}

setupTestDb().catch((err) => {
  console.error("Failed to setup test database:", err);
  process.exit(1);
});
