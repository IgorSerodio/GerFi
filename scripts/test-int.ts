import { execSync } from "child_process";

try {
  console.log("1. Configurando o banco de testes...");
  execSync("npx tsx scripts/test-db-setup.ts", { stdio: "inherit", env: process.env });

  console.log("2. Executando testes de integração...");
  execSync("npx vitest run", { stdio: "inherit", env: process.env });
} catch (error) {
  process.exit(1);
}
