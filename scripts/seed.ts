import { pool } from "../src/infra/database";
import bcrypt from "bcryptjs";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || "Administrador GerFi";
const ADMIN_MATRICULA = process.env.ADMIN_MATRICULA || "00000";
const ADMIN_CPF = process.env.ADMIN_CPF || "00000000000";
const MAIN_LOCATION_NAME = process.env.MAIN_LOCATION_NAME || "SEFAZ";

async function main() {
  console.log("Seeding database...");
  if (!ADMIN_PASSWORD) {
    console.error("Error: ADMIN_PASSWORD environment variable is not defined.");
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Seed Main Location
    console.log(`Seeding main location (${MAIN_LOCATION_NAME})...`);
    await client.query(`
      INSERT INTO locations (id, name, is_active)
      VALUES (0, $1, true)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
    `, [MAIN_LOCATION_NAME]);

    // 2. Seed TV Settings
    console.log("Seeding TV settings...");
    await client.query(`
      INSERT INTO tv_settings (id, slug, name, mode, live_url, uploaded_files, location_id)
      VALUES (1, 'global', 'TV Principal', 'live', 'https://www.youtube.com/embed/live_stream?channel=UC77X3Z_78d52S9T3Z_V5-0w', '[]'::jsonb, 0)
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
      null,
      ADMIN_MATRICULA,
      ADMIN_CPF,
      "admin@caruaru.pe.gov.br",
      ADMIN_USERNAME,
      passwordHash,
      [],
      false
    ]);

    await client.query("COMMIT");

    console.log("Seeding ticket windows...");
    await client.query("BEGIN");
    const ticketWindows = [
      "Guichê 01", "Guichê 02", "Guichê 03", "Guichê 04", "Guichê 05"
    ];
    for (const tw of ticketWindows) {
      await client.query(`
        INSERT INTO ticket_windows (location_id, name) VALUES (0, $1)
        ON CONFLICT (location_id, name) DO NOTHING;
      `, [tw]);
    }
    await client.query("COMMIT");

    console.log("Seeding categories...");
    await client.query("BEGIN");
    const categories = [
      { id: 1, ticketChar: "IPT", name: "IPTU", description: "Imposto Predial e Territorial Urbano", icon: "Landmark", color: "bg-emerald-600" },
      { id: 2, ticketChar: "ITB", name: "ITBI", description: "Imposto sobre Transmissão de Bens Imóveis", icon: "Landmark", color: "bg-emerald-600" },
      { id: 3, ticketChar: "SJO", name: "SÃO JOÃO", description: "Eventos e Autorizações", icon: "Landmark", color: "bg-blue-500" },
      { id: 4, ticketChar: "TRA", name: "TRANSPORTE", description: "Mobilidade Urbana", icon: "History", color: "bg-slate-600" },
      { id: 5, ticketChar: "MAL", name: "MALHA FISCAL", description: "Regularização de Pendências", icon: "Gavel", color: "bg-amber-600" },
      { id: 6, ticketChar: "SSA", name: "SEMANA SANTA", description: "Eventos e Autorizações", icon: "Landmark", color: "bg-emerald-500" },
      { id: 7, ticketChar: "FEI", name: "FEIRA", description: "Taxas e Licenciamento", icon: "Landmark", color: "bg-emerald-500" },
      { id: 8, ticketChar: "PRI", name: "+80", description: "Atendimento Super Prioritário", icon: "Accessibility", color: "bg-emerald-700" },
      { id: 9, ticketChar: "AMB", name: "AMBULANTE", description: "Licenciamento de Comércio", icon: "UserPlus", color: "bg-emerald-500" },
      { id: 10, ticketChar: "REC", name: "RECADASTRAMENTO", description: "Atualização Cadastral", icon: "UserPlus", color: "bg-indigo-600" },
      { id: 11, ticketChar: "VIA", name: "2ª VIA", description: "Emissão de Documentos", icon: "FileText", color: "bg-slate-500" },
      { id: 12, ticketChar: "TAX", name: "TAXI", description: "Alvarás e Taxas", icon: "History", color: "bg-slate-600" },
      { id: 13, ticketChar: "NFS", name: "NOTA FISCAL", description: "Serviços e Consultas", icon: "FileText", color: "bg-emerald-600" },
      { id: 14, ticketChar: "PAG", name: "PAGAMENTO", description: "Quitação de Débitos", icon: "Landmark", color: "bg-blue-600" },
      { id: 15, ticketChar: "ATE", name: "ATENDIMENTO", description: "Informações Gerais", icon: "Info", color: "bg-emerald-500" },
      { id: 16, ticketChar: "DIV", name: "DIVERSOS", description: "Outros Assuntos", icon: "Info", color: "bg-emerald-500" }
    ];

    for (const cat of categories) {
      await client.query(`
        INSERT INTO categories (id, ticket_char, name, description, icon, color)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          ticket_char = EXCLUDED.ticket_char,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          icon = EXCLUDED.icon,
          color = EXCLUDED.color;
      `, [cat.id, cat.ticketChar, cat.name, cat.description, cat.icon, cat.color]);
    }
    await client.query("COMMIT");
    console.log("Database seeded successfully!");
    
    console.log("Fixing sequences to avoid primary key violations...");
    await client.query(`
      SELECT setval(pg_get_serial_sequence('users', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM users;
      SELECT setval(pg_get_serial_sequence('tv_settings', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM tv_settings;
      SELECT setval(pg_get_serial_sequence('ticket_windows', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM ticket_windows;
      SELECT setval(pg_get_serial_sequence('categories', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM categories;
      SELECT setval(pg_get_serial_sequence('locations', 'id'), GREATEST(coalesce(max(id), 1), 1), max(id) IS NOT null) FROM locations;
    `);

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
