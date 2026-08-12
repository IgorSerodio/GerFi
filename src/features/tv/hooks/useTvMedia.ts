import { useState, useEffect, useCallback } from "react";
import { TvSettings } from "@/features/tv/types";
import { useSlideshow } from "./useSlideshow";
import { useYoutubePoller } from "./useYoutubePoller";
import { useVideoPlaylist } from "./useVideoPlaylist";

type PlaybackMode = "channel" | "channel-playlist" | "playlist" | "slides";

export function useTvMedia(tvSettings: TvSettings) {
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(
    tvSettings.mode === "channel" ? "channel" : (tvSettings.mode === "playlist" ? "playlist" : "slides")
  );

  const { slideIndex } = useSlideshow(tvSettings);
  
  const { 
    isResolvingChannel, 
    channelResolveError, 
    channelLiveUrl, 
    channelPlaylistUrl, 
    channelIsLive 
  } = useYoutubePoller(tvSettings);
  
  const { 
    currentVideoIndex, 
    consecutiveErrors, 
    playCycle,
    nextVideo, 
    addError, 
    resetErrors,
    setCurrentVideoIndex
  } = useVideoPlaylist(tvSettings);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlaybackMode(tvSettings.mode === "channel" ? "channel" : (tvSettings.mode === "playlist" ? "playlist" : "slides"));
    resetErrors();
  }, [tvSettings.mode, resetErrors]);

  // Regra de fallback baseada na resolução do YouTube
  useEffect(() => {
    if (channelResolveError && tvSettings.mode === "channel") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlaybackMode("playlist");
    }
  }, [channelResolveError, tvSettings.mode]);

  // Regra de transição de Live baseada no Poller do YouTube
  useEffect(() => {
    if (tvSettings.mode !== "channel") return;

    if (channelIsLive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlaybackMode(prev => {
        if (prev !== "channel") {
          setCurrentVideoIndex(0);
          resetErrors();
          return "channel";
        }
        return prev;
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlaybackMode(prev => prev === "channel" ? "channel-playlist" : prev);
    }
  }, [channelIsLive, tvSettings.mode, setCurrentVideoIndex, resetErrors]);

  const handleVideoError = useCallback(() => {
    setPlaybackMode(prevMode => {
      if (prevMode === "channel") return "channel-playlist";
      if (prevMode === "channel-playlist") return "playlist";
      return prevMode;
    });

    if (playbackMode === "playlist") {
      addError();
    }
  }, [playbackMode, addError]);

  const handleVideoEnd = useCallback(() => {
    if (playbackMode === "channel") {
      setPlaybackMode("channel-playlist");
    } else if (playbackMode === "channel-playlist") {
      setPlaybackMode("playlist");
    } else if (playbackMode === "playlist") {
      nextVideo();
    }
  }, [playbackMode, nextVideo]);

  const handleVideoStart = useCallback(() => {
    resetErrors();
  }, [resetErrors]);

  const totalVideos = tvSettings.videoUrl?.length || 0;
  
  let currentVideoUrl = "";
  if (playbackMode === "channel" && channelLiveUrl && channelIsLive) {
    currentVideoUrl = channelLiveUrl;
  } else if ((playbackMode === "channel" || playbackMode === "channel-playlist") && channelPlaylistUrl) {
    currentVideoUrl = channelPlaylistUrl;
  } else if (playbackMode === "playlist" && totalVideos > 0 && tvSettings.videoUrl[currentVideoIndex]) {
    currentVideoUrl = `https://www.youtube.com/watch?v=${tvSettings.videoUrl[currentVideoIndex].videoId}&cycle=${playCycle}`;
  }

  const useSlidesFallback = 
    playbackMode === "slides" || 
    (playbackMode === "playlist" && (totalVideos === 0 || consecutiveErrors >= totalVideos)) ||
    (playbackMode === "channel" && !tvSettings.youtubeChannel);

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
