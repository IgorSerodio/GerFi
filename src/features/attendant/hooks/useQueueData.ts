import { useState, useEffect, useRef, useCallback } from "react";
import { Ticket } from "@/features/queue/types";
import { DbTicketWindow } from "@/features/management/types";
import { getQueueStateAction } from "@/features/queue/actions";
import { getActiveGuichesAction } from "@/features/management/actions";
import { useQueueStream } from "@/features/queue/hooks/useQueueStream";

export function useQueueData() {
  const [queue, setQueue] = useState<Ticket[]>([]);
  const [history, setHistory] = useState<Ticket[]>([]);
  const [activeGuiches, setActiveGuiches] = useState<{ ticketWindowId: number; guicheName: string; guicheAlias: string | null; attendantName: string }[]>([]);
  const [ticketWindows, setTicketWindows] = useState<DbTicketWindow[]>([]);
  const [locationId, setLocationId] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("attendant_locationId");
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocationId(Number(stored));
    } else {
      setLocationId(1);
      localStorage.setItem("attendant_locationId", "1");
    }
  }, []);

  const refreshState = useCallback(async () => {
    if (locationId === null) return;
    const res = await getQueueStateAction(locationId);
    if (res.success && res.data) {
      setQueue(res.data.tickets);
      setHistory(res.data.history);
    }
    const activeRes = await getActiveGuichesAction(locationId);
    if (activeRes.success && activeRes.data) {
      setActiveGuiches(activeRes.data);
    }

    import("@/features/management/actions").then(m => {
      m.getTicketWindowsAction(locationId).then((wRes) => {
        if (wRes.success && wRes.data) setTicketWindows(wRes.data as DbTicketWindow[]);
      });
    });
  }, [locationId]);

  const refreshStateRef = useRef(refreshState);
  useEffect(() => {
    refreshStateRef.current = refreshState;
  }, [refreshState]);

  useEffect(() => {
    if (locationId !== null) {
      setTimeout(() => {
        refreshStateRef.current();
      }, 0);
    }
  }, [locationId]);

  useQueueStream(() => refreshStateRef.current());

  const attendants = ticketWindows.map((tw) => {
    const active = activeGuiches.find((a) => a.ticketWindowId === tw.id);
    return {
      ticketWindowId: tw.id,
      guiche: tw.name,
      alias: tw.alias,
      groupName: tw.groupName,
      attendantName: active?.attendantName,
    };
  });

  return {
    locationId,
    setLocationId,
    queue,
    history,
    activeGuiches,
    ticketWindows,
    attendants,
    refreshState
  };
}
