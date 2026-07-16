import { pool } from "../src/infra/database";

const TARGET_DATE = "2026-01-01";

async function main() {
  console.log(`Starting mock cleanup for ${TARGET_DATE}...`);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Delete Tickets for TARGET_DATE
    console.log(`Deleting tickets from ${TARGET_DATE}...`);
    const { rowCount: deletedTickets } = await client.query(`
      DELETE FROM tickets 
      WHERE created_at::date = $1
    `, [TARGET_DATE]);
    console.log(`Deleted ${deletedTickets} mock tickets.`);

    // 2. Delete Mock Attendants
    console.log("Deleting mock attendants...");
    const { rowCount: deletedUsers } = await client.query(`
      DELETE FROM users 
      WHERE matricula IN ('MOCK01', 'MOCK02', 'MOCK03', 'MOCK04', 'MOCK05', 'MOCK06', 'MOCK07', 'MOCK08')
    `);
    console.log(`Deleted ${deletedUsers} mock attendants.`);

    await client.query("COMMIT");
    console.log(`Mock data successfully cleaned up!`);

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error cleaning up mock data:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
