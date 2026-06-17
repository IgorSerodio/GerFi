import { EventEmitter } from "node:events";
import { Client } from "pg";

export const queueEmitter = new EventEmitter();

let listenerClient: Client | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;

export async function startPostgresListener() {
  if (listenerClient) return;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Real-time events will not be active.");
    return;
  }

  try {
    listenerClient = new Client({ connectionString: databaseUrl });
    await listenerClient.connect();
    await listenerClient.query("LISTEN queue_change");

    console.log("PostgreSQL LISTEN active on channel: queue_change");

    listenerClient.on("notification", (msg) => {
      if (msg.channel === "queue_change") {
        queueEmitter.emit("update");
      }
    });

    listenerClient.on("error", async (err) => {
      console.error("Postgres listener client error:", err);
      cleanupListener();
      triggerReconnect();
    });
  } catch (err) {
    console.error("Failed to connect Postgres listener:", err);
    cleanupListener();
    triggerReconnect();
  }
}

function cleanupListener() {
  if (listenerClient) {
    listenerClient.end().catch(() => {});
    listenerClient = null;
  }
}

function triggerReconnect() {
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  reconnectTimeout = setTimeout(() => {
    startPostgresListener().catch(console.error);
  }, 5000);
}

// Start the listener automatically on server start
if (typeof window === "undefined") {
  startPostgresListener().catch(console.error);
}
