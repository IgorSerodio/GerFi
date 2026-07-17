import { useEffect, useRef } from "react";

/**
 * Hook para assinar atualizações em tempo real da fila via Server-Sent Events (SSE)
 * @param onUpdate Callback executado quando um evento "update" é recebido
 */
export function useQueueStream(onUpdate: () => void) {
  const savedCallback = useRef(onUpdate);

  useEffect(() => {
    savedCallback.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const eventSource = new EventSource("/api/queue/stream");

    eventSource.onmessage = () => {
      // heartbeats
    };

    eventSource.addEventListener("update", () => {
      setTimeout(() => {
        savedCallback.current();
      }, 0);
    });

    return () => {
      eventSource.close();
    };
  }, []);
}
