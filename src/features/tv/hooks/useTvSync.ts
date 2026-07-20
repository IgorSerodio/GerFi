import { useState, useEffect, useRef, useCallback } from "react";
import { getQueueStateAction } from "@/features/queue/actions";
import { getTvSettingsAction } from "@/features/tv/actions";
import { Ticket } from "@/features/queue/types";
import { TvSettings } from "@/features/tv/types";
import { useQueueStream } from "@/features/queue/hooks/useQueueStream";

export function useTvSync(
  initialSettings: TvSettings,
  initialHistory: Ticket[],
  setIsIdle: (idle: boolean) => void,
  resetIdleTimer: () => void
) {
  const [tvSettings, setTvSettings] = useState<TvSettings>(initialSettings);
  const [history, setHistory] = useState<Ticket[]>(initialHistory);
  const [currentCall, setCurrentCall] = useState<Ticket | null>(null);
  
  const [volume, setVolume] = useState(0.7);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const prevCallIdRef = useRef<string | null>(null);
  const prevCalledAtRef = useRef<string | null>(null);

  const stateRef = useRef({
    locationId: tvSettings.locationId,
    services: tvSettings.services,
    slug: tvSettings.slug,
    soundEnabled,
    volume,
  });

  useEffect(() => {
    stateRef.current = {
      locationId: tvSettings.locationId,
      services: tvSettings.services,
      slug: tvSettings.slug,
      soundEnabled,
      volume,
    };
  }, [tvSettings.locationId, tvSettings.services, tvSettings.slug, soundEnabled, volume]);

  const playAlert = useCallback((currentVol?: number) => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.volume = currentVol ?? stateRef.current.volume;
      audio.play().catch((e) => console.log("Audio play blocked", e));
    } catch (e) {
      console.log("Audio error", e);
    }
  }, []);

  const refreshState = useCallback(async () => {
    const { locationId, services, slug, soundEnabled: sEnabled, volume: vol } = stateRef.current;

    const [queueRes, tvRes] = await Promise.all([
      getQueueStateAction(locationId, services),
      getTvSettingsAction(slug),
    ]);

    if (tvRes.success && tvRes.data) {
      setTvSettings(tvRes.data);
    }

    if (queueRes.success && queueRes.data) {
      const hist = queueRes.data.history;
      setHistory(hist);

      if (hist.length > 0) {
        const first = hist[0];

        if (first.status === "calling") {
          setCurrentCall(first);
          setIsIdle(false);
          resetIdleTimer();

          const latestCallTime = first.recallHistory && first.recallHistory.length > 0 
            ? first.recallHistory[first.recallHistory.length - 1] 
            : (first.calledAt || "");

          if ((first.id !== prevCallIdRef.current || latestCallTime !== prevCalledAtRef.current) && sEnabled) {
            playAlert(vol);
          }
          prevCallIdRef.current = first.id;
          prevCalledAtRef.current = latestCallTime;
        } else {
          setCurrentCall(null);
          setIsIdle(true);
        }
      } else {
        setCurrentCall(null);
        setIsIdle(true);
      }
    }
  }, [playAlert, setIsIdle, resetIdleTimer]);

  useEffect(() => {
    setTimeout(() => { refreshState(); }, 0);
  }, [soundEnabled, refreshState]);

  useQueueStream(() => refreshState());

  return {
    tvSettings,
    history,
    currentCall,
    volume,
    setVolume,
    soundEnabled,
    setSoundEnabled,
    playAlert,
  };
}
