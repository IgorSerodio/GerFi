import { useState, useEffect, useCallback, useRef } from "react";
import { TvSettings } from "@/features/tv/types";
import { resolveYoutubeChannelAction, checkYoutubeLiveStatusAction } from "@/features/tv/actions";

type PlaybackMode = "channel" | "channel-playlist" | "playlist" | "slides";

export function useTvMedia(tvSettings: TvSettings) {
  const [slideIndex, setSlideIndex] = useState(0);
  
  // Video Player states
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);

  // Fallback State Machine
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(
    tvSettings.mode === "channel" ? "channel" : (tvSettings.mode === "playlist" ? "playlist" : "slides")
  );
  const [channelLiveUrl, setChannelLiveUrl] = useState<string>("");
  const [channelPlaylistUrl, setChannelPlaylistUrl] = useState<string>("");
  const [isResolvingChannel, setIsResolvingChannel] = useState(false);
  
  const [channelId, setChannelId] = useState<string>("");
  const [channelIsLive, setChannelIsLive] = useState(false);

  const tvSettingsRef = useRef(tvSettings);
  useEffect(() => {
    tvSettingsRef.current = tvSettings;
  }, [tvSettings]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlaybackMode(tvSettings.mode === "channel" ? "channel" : (tvSettings.mode === "playlist" ? "playlist" : "slides"));
    setConsecutiveErrors(0);
  }, [tvSettings.mode]);

  // Resolve Channel URL
  useEffect(() => {
    if (tvSettings.mode === "channel" && tvSettings.youtubeChannel) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsResolvingChannel(true);
      resolveYoutubeChannelAction(tvSettings.youtubeChannel).then((res) => {
        if (res.success && res.data) {
          setChannelId(res.data.channelId);
          setChannelLiveUrl(res.data.liveUrl);
          setChannelPlaylistUrl(`https://www.youtube.com/embed/videoseries?list=${res.data.playlistId}`);
        } else {
          // Se não encontrou o canal, pula direto pra playlist cadastrada
          setPlaybackMode("playlist");
        }
        setIsResolvingChannel(false);
      });
    }
  }, [tvSettings.mode, tvSettings.youtubeChannel]);

  // Polling para checar se a live começou (a cada 5 minutos)
  useEffect(() => {
    if (!channelId || tvSettings.mode !== "channel") return;

    let isMounted = true;
    const checkLive = async () => {
      const res = await checkYoutubeLiveStatusAction(channelId);
      if (!isMounted) return;
      
      if (res.success && res.isLive) {
        setChannelIsLive(true);
        setPlaybackMode(prev => prev !== "channel" ? "channel" : prev);
      } else {
        setChannelIsLive(false);
        // Se não tem live, pula da tentativa de "channel" para "channel-playlist"
        setPlaybackMode(prev => prev === "channel" ? "channel-playlist" : prev);
      }
    };

    checkLive();
    const poller = setInterval(checkLive, 300000); // 5 minutos

    return () => {
      isMounted = false;
      clearInterval(poller);
    };
  }, [channelId, tvSettings.mode]);

  // Converte listas para strings para evitar cancelamento do timer por mudança de referência
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

  const videoIdsStr = (tvSettings.videoUrl || []).map(v => v.videoId).join(',');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentVideoIndex(0);
    setConsecutiveErrors(0);
  }, [videoIdsStr]);

  const handleVideoError = useCallback(() => {
    setPlaybackMode(prevMode => {
      if (prevMode === "channel") return "channel-playlist";
      if (prevMode === "channel-playlist") return "playlist";
      return prevMode;
    });

    if (playbackMode === "playlist") {
      setConsecutiveErrors(prev => prev + 1);
      const videoUrl = tvSettingsRef.current.videoUrl;
      if (videoUrl && videoUrl.length > 0) {
        setCurrentVideoIndex(prev => (prev + 1) % videoUrl.length);
      }
    }
  }, [playbackMode]);

  const handleVideoEnd = useCallback(() => {
    if (playbackMode === "channel") {
      setPlaybackMode("channel-playlist");
    } else if (playbackMode === "channel-playlist") {
      setPlaybackMode("playlist");
    } else if (playbackMode === "playlist") {
      const videoUrl = tvSettingsRef.current.videoUrl;
      if (videoUrl && videoUrl.length > 0) {
        setCurrentVideoIndex(prev => (prev + 1) % videoUrl.length);
      }
    }
  }, [playbackMode]);

  const handleVideoStart = useCallback(() => {
    setConsecutiveErrors(0);
  }, []);

  const totalVideos = tvSettings.videoUrl?.length || 0;
  
  let currentVideoUrl = "";
  if (playbackMode === "channel" && channelLiveUrl && channelIsLive) {
    currentVideoUrl = channelLiveUrl;
  } else if ((playbackMode === "channel" || playbackMode === "channel-playlist") && channelPlaylistUrl) {
    currentVideoUrl = channelPlaylistUrl;
  } else if (playbackMode === "playlist" && totalVideos > 0 && tvSettings.videoUrl[currentVideoIndex]) {
    currentVideoUrl = `https://www.youtube.com/watch?v=${tvSettings.videoUrl[currentVideoIndex].videoId}`;
  }

  const useSlidesFallback = 
    playbackMode === "slides" || 
    (playbackMode === "playlist" && (totalVideos === 0 || consecutiveErrors >= totalVideos)) ||
    (playbackMode === "channel" && !tvSettings.youtubeChannel);

  // Se está resolvendo, vamos considerar "hasVideos" true provisoriamente para não piscar os slides
  const hasVideos = isResolvingChannel || currentVideoUrl !== "";

  return { 
    slideIndex, 
    slides: tvSettings.slides || [],
    currentVideoUrl,
    handleVideoError,
    handleVideoEnd,
    handleVideoStart,
    useSlidesFallback: useSlidesFallback && !isResolvingChannel,
    hasVideos
  };
}
