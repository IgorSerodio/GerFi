import { pool } from "@/infra/database";

export const cleanTestDatabase = async () => {
  // ATENÇÃO: Esse script apagará todos os registros dessas tabelas do banco de dados apontado.
  // Garanta que DATABASE_URL de teste é usado.
  
  const tables = ["tickets", "tv_settings"];
  
  // Usamos CASCADE para limpar dependências.
  await pool.query(`TRUNCATE ${tables.join(", ")} RESTART IDENTITY CASCADE`);
};
