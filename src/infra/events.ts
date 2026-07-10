import { EventEmitter } from "node:events";
import { Client } from "pg";

const globalForEvents = globalThis as unknown as { 
  queueEmitter: EventEmitter | undefined;
  listenerClient: Client | undefined;
};
export const queueEmitter = globalForEvents.queueEmitter ?? new EventEmitter();

if (process.env.NODE_ENV !== "production") {
  globalForEvents.queueEmitter = queueEmitter;
}

let reconnectTimeout: NodeJS.Timeout | null = null;

export async function startPostgresListener() {
  if (globalForEvents.listenerClient) return;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Real-time events will not be active.");
    return;
  }

  try {
    globalForEvents.listenerClient = new Client({ connectionString: databaseUrl });
    await globalForEvents.listenerClient.connect();
    await globalForEvents.listenerClient.query("LISTEN queue_change");

    console.log("PostgreSQL LISTEN active on channel: queue_change");

    globalForEvents.listenerClient.on("notification", (msg) => {
      if (msg.channel === "queue_change") {
        queueEmitter.emit("update");
      }
    });

    globalForEvents.listenerClient.on("error", async (err) => {
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
  if (globalForEvents.listenerClient) {
    globalForEvents.listenerClient.end().catch(() => {});
    globalForEvents.listenerClient = undefined;
  }
}

function triggerReconnect() {
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  reconnectTimeout = setTimeout(() => {
    startPostgresListener().catch(console.error);
  }, 5000);
}
