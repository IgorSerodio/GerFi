import { useState, useCallback, useRef, useEffect } from "react";
import { TvSettings } from "@/features/tv/types";

export function useVideoPlaylist(tvSettings: TvSettings) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [playCycle, setPlayCycle] = useState(0);

  const tvSettingsRef = useRef(tvSettings);
  useEffect(() => {
    tvSettingsRef.current = tvSettings;
  }, [tvSettings]);

  const videoIdsStr = (tvSettings.videoUrl || []).map(v => v.videoId).join(',');

  // Se a lista real de vídeos mudar, reseta o índice e os erros
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentVideoIndex(0);
    setConsecutiveErrors(0);
    setPlayCycle(0);
  }, [videoIdsStr]);

  const nextVideo = useCallback(() => {
    const videoUrl = tvSettingsRef.current.videoUrl;
    if (videoUrl && videoUrl.length > 0) {
      setCurrentVideoIndex(prev => (prev + 1) % videoUrl.length);
      setPlayCycle(prev => prev + 1);
    }
  }, []);

  const resetErrors = useCallback(() => {
    setConsecutiveErrors(0);
  }, []);

  const addError = useCallback(() => {
    setConsecutiveErrors(prev => prev + 1);
    nextVideo();
  }, [nextVideo]);

  return {
    currentVideoIndex,
    consecutiveErrors,
    playCycle,
    nextVideo,
    addError,
    resetErrors,
    setCurrentVideoIndex
  };
}
