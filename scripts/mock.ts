import { pool } from "../src/infra/database";
import bcrypt from "bcryptjs";

const TARGET_DATE = "2026-01-01";
const LOCATION_ID = 1;

async function main() {
  console.log(`Starting mock generation for ${TARGET_DATE}...`);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Create Mock Attendants
    console.log("Creating mock attendants...");
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync("123456", salt);
    
    const attendants = [
      { name: "João Silva (Mock)", matricula: "MOCK01", guiche: "Guichê 01" },
      { name: "Maria Souza (Mock)", matricula: "MOCK02", guiche: "Guichê 02" },
      { name: "Pedro Santos (Mock)", matricula: "MOCK03", guiche: "Guichê 03" },
      { name: "Ana Costa (Mock)", matricula: "MOCK04", guiche: "Guichê 04" },
      { name: "Carlos Alves (Mock)", matricula: "MOCK05", guiche: "Guichê 05" },
      { name: "Julia Lima (Mock)", matricula: "MOCK06", guiche: "Guichê 06" },
      { name: "Rafael Gomes (Mock)", matricula: "MOCK07", guiche: "Guichê 07" },
      { name: "Beatriz Dias (Mock)", matricula: "MOCK08", guiche: "Guichê 08" }
    ];

    const availability: Record<string, Date> = {};
    for (const att of attendants) {
      availability[att.matricula] = new Date(`${TARGET_DATE}T08:00:00.000-03:00`);
    }

    for (const att of attendants) {
      await client.query(`
        INSERT INTO users (name, role, guiche, matricula, cpf, email, username, password, services, blocked)
        VALUES ($1, 'Atendente', $2, $3, $4, $5, $6, $7, '{}', false)
        ON CONFLICT (matricula) DO UPDATE SET name = EXCLUDED.name, guiche = EXCLUDED.guiche;
      `, [
        att.name,
        att.guiche,
        att.matricula,
        `0000000${att.matricula.replace("MOCK", "")}`,
        `${att.matricula.toLowerCase()}@mock.com`,
        att.matricula.toLowerCase(),
        passwordHash
      ]);
    }

    // 2. Load Categories
    const { rows: categories } = await client.query("SELECT id, name, ticket_char FROM categories");
    if (categories.length === 0) {
      throw new Error("No categories found. Run 'npm run seed' first.");
    }

    // 3. Generate Tickets
    console.log("Generating mock tickets...");
    const statuses = ['completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'no_show', 'forwarded'];
    
    // We will generate exactly 100 tickets over the day from 08:00 to 14:00
    const TOTAL_TICKETS = 100;
    const startHour = 8;
    const endHour = 14;
    const totalMinutes = (endHour - startHour) * 60; // 6 hours = 360 mins
    
    for (let i = 1; i <= TOTAL_TICKETS; i++) {
      // Pick random category
      const category = categories[Math.floor(Math.random() * categories.length)];
      // Pick random status, favoring completed
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const minuteOffset = Math.floor((i / TOTAL_TICKETS) * totalMinutes) + Math.floor(Math.random() * 5);
      
      const ticketNumber = `${category.ticket_char}${i.toString().padStart(3, '0')}`;
      const priority = Math.random() > 0.8 ? 'Prioritário' : 'Normal';
      
      let currentStatus = status;
      let currentCreatedAt = new Date(`${TARGET_DATE}T08:00:00.000-03:00`);
      currentCreatedAt.setMinutes(currentCreatedAt.getMinutes() + minuteOffset);

      let chainDepth = 0;
      while (chainDepth < 2) {
        const attendant = attendants[Math.floor(Math.random() * attendants.length)];

        // Wait time (5 to 45 minutes)
        const waitMins = Math.floor(Math.random() * 40) + 5;
        let calledAt = new Date(currentCreatedAt);
        calledAt.setMinutes(calledAt.getMinutes() + waitMins);

        // Prevent overlap by checking attendant availability and ensuring at least 1 min interval
        const availableSince = availability[attendant.matricula];
        const minCalledAt = new Date(availableSince);
        minCalledAt.setMinutes(minCalledAt.getMinutes() + 1);

        if (calledAt < minCalledAt) {
          calledAt = new Date(minCalledAt);
          // Slight random extra delay (0 to 3 minutes)
          calledAt.setMinutes(calledAt.getMinutes() + Math.floor(Math.random() * 4));
        }

        // Service time (2 to 20 minutes)
        const serviceMins = Math.floor(Math.random() * 18) + 2;
        const startedAt = new Date(calledAt);
        startedAt.setMinutes(startedAt.getMinutes() + 1); // Started 1 min after calling
        
        const completedAt = new Date(startedAt);
        completedAt.setMinutes(completedAt.getMinutes() + serviceMins);

        // Update availability
        if (currentStatus === 'no_show') {
          // no show takes ~1 minute of attendant time
          const freeAt = new Date(calledAt);
          freeAt.setMinutes(freeAt.getMinutes() + 2);
          availability[attendant.matricula] = freeAt;
        } else {
          availability[attendant.matricula] = new Date(completedAt);
        }

        let finalCalledAt: Date | null = calledAt;
        let finalStartedAt: Date | null = startedAt;
        let finalCompletedAt: Date | null = completedAt;
        const finalAttendant: string | null = attendant.name;
        const finalGuiche: string | null = attendant.guiche;
        let recallHistory: Date[] = [];

        if (currentStatus === 'no_show') {
          finalStartedAt = null;
          const call1 = new Date(calledAt);
          const call2 = new Date(call1);
          call2.setSeconds(call1.getSeconds() + 16);
          const call3 = new Date(call2);
          call3.setSeconds(call2.getSeconds() + 20);
          
          recallHistory = [call2, call3]; // Apenas as rechamadas
          finalCalledAt = call1; // Mantém a primeira chamada correta para a linha do tempo
          finalCompletedAt = new Date(call3); 
        }

        let forwardedTo: string | null = null;
        if (currentStatus === 'forwarded') {
          // If it's forwarded, choose a random category different from current
          const otherCategories = categories.filter(c => c.id !== category.id);
          const fwdCategory = otherCategories.length > 0 ? otherCategories[Math.floor(Math.random() * otherCategories.length)] : category;
          forwardedTo = fwdCategory.name;
        }

        await client.query(`
          INSERT INTO tickets (
            ticket_number, category_name, category_id, priority, status, 
            created_at, called_at, started_at, completed_at, attendant, guiche, location_id, recall_history, forwarded_to
          ) VALUES (
            $1, $2, $3, $4, $5, 
            $6, $7, $8, $9, $10, $11, $12, $13, $14
          )
        `, [
          ticketNumber,
          category.name,
          category.id,
          priority,
          currentStatus,
          currentCreatedAt.toISOString(),
          finalCalledAt ? finalCalledAt.toISOString() : null,
          finalStartedAt ? finalStartedAt.toISOString() : null,
          finalCompletedAt ? finalCompletedAt.toISOString() : null,
          finalAttendant,
          finalGuiche,
          LOCATION_ID,
          recallHistory.length > 0 ? recallHistory.map(d => d.toISOString()) : '{}',
          forwardedTo
        ]);

        if (currentStatus === 'forwarded') {
          chainDepth++;
          currentStatus = 'completed'; // O ticket encaminhado termina como completado no próximo guichê
          currentCreatedAt = new Date(finalCompletedAt!);
        } else {
          break;
        }
      }
    }

    await client.query("COMMIT");
    console.log(`Mock data successfully generated for ${TARGET_DATE}!`);

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error generating mock data:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
