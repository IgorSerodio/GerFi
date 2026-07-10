import { queueEmitter, startPostgresListener } from "@/infra/events";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  // Ensure listener is running
  await startPostgresListener();

  let cleanup: (() => void) | null = null;

  const customStream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode("event: connected\ndata: {}\n\n"));

      const onUpdate = () => {
        console.log("SSE route received update from queueEmitter!");
        try {
          controller.enqueue(encoder.encode("event: update\ndata: {}\n\n"));
        } catch {
          // Stream might be closed
        }
      };

      queueEmitter.on("update", onUpdate);

      const heartbeat = setInterval(() => {
        try {
          // Keep SSE connection alive (comments are ignored by clients)
          controller.enqueue(encoder.encode(":\n\n"));
        } catch {
          // Stream might be closed
        }
      }, 15000);

      cleanup = () => {
        queueEmitter.off("update", onUpdate);
        clearInterval(heartbeat);
      };
    },
    cancel() {
      if (cleanup) cleanup();
    },
  });

  return new Response(customStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
