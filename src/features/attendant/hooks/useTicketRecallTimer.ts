import { useState, useEffect } from "react";
import { Ticket } from "@/features/queue/types";
import { RECALL_COOLDOWN_MS } from "@/features/queue/constants";

export function useTicketRecallTimer(currentCall?: Ticket) {
  const [cooldownLeft, setCooldownLeft] = useState(0);

  useEffect(() => {
    if (!currentCall || currentCall.status === "started") return;

    const checkCooldown = () => {
      const now = Date.now();
      const history = currentCall.recallHistory || [];
      const lastRecall = history.length > 0 ? history[history.length - 1] : undefined;
      const effectiveCallTimeStr = lastRecall || currentCall.calledAt;
      const effectiveCallTime = effectiveCallTimeStr ? new Date(effectiveCallTimeStr).getTime() : 0;
      
      const timeSinceLastCall = now - effectiveCallTime;
      if (timeSinceLastCall < RECALL_COOLDOWN_MS) {
        setCooldownLeft(Math.ceil((RECALL_COOLDOWN_MS - timeSinceLastCall) / 1000));
      } else {
        setCooldownLeft(0);
      }
    };

    checkCooldown(); // initial check
    const intervalId = setInterval(checkCooldown, 1000);

    return () => clearInterval(intervalId);
  }, [currentCall]);

  const recallCount = currentCall?.recallHistory?.length || 0;
  const canRecall = cooldownLeft === 0;
  const canMarkAsNoShow = recallCount >= 3;

  return { cooldownLeft, canRecall, recallCount, canMarkAsNoShow };
}
