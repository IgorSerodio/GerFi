import { useState, useEffect, useCallback, useRef } from "react";
import { TvSettings } from "@/features/tv/types";

export function useTvMedia(tvSettings: TvSettings) {
  const [slideIndex, setSlideIndex] = useState(0);
  
  // Video Player states
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);

  const tvSettingsRef = useRef(tvSettings);
  useEffect(() => {
    tvSettingsRef.current = tvSettings;
  }, [tvSettings]);

  // Converte listas para strings para evitar cancelamento do timer por mudança de referência na API
  const uploadedFilesStr = (tvSettings.uploadedFiles || []).join(',');
  const slidesStr = (tvSettings.slides || []).map(s => s.title).join(',');

  useEffect(() => {
    const slideTimer = setInterval(() => {
      if (tvSettings.uploadedFiles && tvSettings.uploadedFiles.length > 0) {
        setSlideIndex((prev) => (prev + 1) % tvSettings.uploadedFiles.length);
      } else if (tvSettings.slides && tvSettings.slides.length > 0) {
        setSlideIndex((prev) => (prev + 1) % tvSettings.slides.length);
      } else {
        setSlideIndex(0);
      }
    }, 8000);

    return () => clearInterval(slideTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFilesStr, slidesStr]);

  // Converte os IDs de vídeo para uma string para evitar re-renderizações por mudança de referência
  const videoIdsStr = (tvSettings.videoUrl || []).map(v => v.videoId).join(',');

  // Se a lista real de vídeos mudar, reseta o índice e os erros
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentVideoIndex(0);
    setConsecutiveErrors(0);
  }, [videoIdsStr]);

  const handleVideoError = useCallback(() => {
    setConsecutiveErrors(prev => prev + 1);
    const videoUrl = tvSettingsRef.current.videoUrl;
    if (videoUrl && videoUrl.length > 0) {
      setCurrentVideoIndex(prev => (prev + 1) % videoUrl.length);
    }
  }, []);

  const handleVideoEnd = useCallback(() => {
    const videoUrl = tvSettingsRef.current.videoUrl;
    if (videoUrl && videoUrl.length > 0) {
      setCurrentVideoIndex(prev => (prev + 1) % videoUrl.length);
    }
  }, []);

  const handleVideoStart = useCallback(() => {
    setConsecutiveErrors(0);
  }, []);

  const totalVideos = tvSettings.videoUrl?.length || 0;
  const useSlidesFallback = totalVideos > 0 && consecutiveErrors >= totalVideos;

  const currentVideoUrl = totalVideos > 0 && tvSettings.videoUrl[currentVideoIndex]
    ? `https://www.youtube.com/watch?v=${tvSettings.videoUrl[currentVideoIndex].videoId}` 
    : "";

  return { 
    slideIndex, 
    slides: tvSettings.slides || [],
    currentVideoUrl,
    handleVideoError,
    handleVideoEnd,
    handleVideoStart,
    useSlidesFallback,
    hasVideos: totalVideos > 0
  };
}
