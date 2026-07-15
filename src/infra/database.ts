import { Pool, types } from "pg";

const parseTimestamp = (stringValue: string) => new Date(stringValue + "Z");

// Garante que o pg interprete as datas do Postgres (TIMESTAMP sem fuso horário) como UTC
types.setTypeParser(1114, parseTimestamp);

// @ts-expect-error OID 1115 (TIMESTAMP_ARRAY) não está mapeado nativamente na tipagem do pg
types.setTypeParser(1115, (stringValue) => {
  // @ts-expect-error arrayParser.create existe em tempo de execução, mas não está tipado no @types/pg
  return types.arrayParser.create(stringValue, (entry: string | null) => {
    return entry !== null ? parseTimestamp(entry) : null;
  }).parse();
});

const globalForPool = globalThis as unknown as {
  pool: Pool | undefined;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL variable is not defined in environment variables.");
}

let maxConnections = 10;
try {
  const url = new URL(databaseUrl);
  const limit = url.searchParams.get("connection_limit") || url.searchParams.get("max");
  if (limit) {
    maxConnections = parseInt(limit, 10);
  }
} catch {
  // Fallback if DATABASE_URL is not a standard URL format
}

export const pool =
  globalForPool.pool ??
  new Pool({
    connectionString: databaseUrl,
    max: maxConnections,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPool.pool = pool;
}
