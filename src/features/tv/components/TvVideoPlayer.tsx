import React from "react";
import ReactPlayer from 'react-player';

interface TvVideoPlayerProps {
  isIdle: boolean;
  currentVideoUrl: string;
  handleVideoError: () => void;
  handleVideoEnd: () => void;
  handleVideoStart: () => void;
}

interface ReactPlayerInstance {
  getInternalPlayer: () => YoutubeVideoElement | HTMLMediaElement | null;
}

interface YoutubeVideoElement extends HTMLElement {
  api?: {
    getVolume?: () => number;
    setVolume?: (vol: number) => void;
  };
  getVolume?: () => number;
  setVolume?: (vol: number) => void;
}

export default function TvVideoPlayer({
  isIdle,
  currentVideoUrl,
  handleVideoError,
  handleVideoEnd,
  handleVideoStart,
}: TvVideoPlayerProps) {
  const playerRef = React.useRef<HTMLVideoElement>(null);

  // Removed imperative play/pause effect to prevent conflicts with playing prop

  const handleVideoProgress = React.useCallback(() => {
    try {
      if (!playerRef.current) return;
      const player = (playerRef.current as unknown) as ReactPlayerInstance | HTMLVideoElement;
      
      const internalPlayer = (
        'getInternalPlayer' in player && typeof player.getInternalPlayer === 'function'
          ? player.getInternalPlayer()
          : player
      ) as YoutubeVideoElement | HTMLMediaElement | null;
      if (!internalPlayer) return;

      let currentVolNormalized: number | null = null;

      // Safely access volume without triggering youtube-video-element's buggy getter
      if ('api' in internalPlayer && internalPlayer.api) {
        if (typeof internalPlayer.api.getVolume === 'function') {
          currentVolNormalized = internalPlayer.api.getVolume() / 100;
        }
      } else if ('getVolume' in internalPlayer && typeof internalPlayer.getVolume === 'function') {
        currentVolNormalized = internalPlayer.getVolume() / 100;
      } else if (internalPlayer instanceof HTMLMediaElement) {
        currentVolNormalized = internalPlayer.volume;
      }

      if (currentVolNormalized !== null) {
        const savedVol = localStorage.getItem("tv_video_volume");
        if (savedVol !== currentVolNormalized.toString()) {
          localStorage.setItem("tv_video_volume", currentVolNormalized.toString());
        }
      }
    } catch {
      // Silently catch any progress errors to prevent React crashes
    }
  }, []);

  const handleVideoStartWrapper = React.useCallback(() => {
    handleVideoStart();
    
    try {
      const savedVolStr = localStorage.getItem("tv_video_volume");
      const vol = savedVolStr !== null ? parseFloat(savedVolStr) : 0;
      
      if (isNaN(vol)) return;

      // Delay volume setting slightly to ensure internal API is fully populated
      setTimeout(() => {
        try {
          if (!playerRef.current) return;
          const player = (playerRef.current as unknown) as ReactPlayerInstance | HTMLVideoElement;
          const internalPlayer = (
            'getInternalPlayer' in player && typeof player.getInternalPlayer === 'function'
              ? player.getInternalPlayer()
              : player
          ) as YoutubeVideoElement | HTMLMediaElement | null;
          
          if (!internalPlayer) return;

          // Safely set volume without triggering youtube-video-element's buggy setter
          if ('api' in internalPlayer && internalPlayer.api) {
            if (typeof internalPlayer.api.setVolume === 'function') {
              internalPlayer.api.setVolume(vol * 100);
            }
          } else if ('setVolume' in internalPlayer && typeof internalPlayer.setVolume === 'function') {
            internalPlayer.setVolume(vol * 100);
          } else if (internalPlayer instanceof HTMLMediaElement) {
            internalPlayer.volume = vol;
          }
        } catch (e) {
          console.warn("Error setting volume after delay", e);
        }
      }, 1000); // Increased delay to 1s to ensure API is ready
    } catch (error) {
      console.warn("Could not set initial video volume:", error);
    }
  }, [handleVideoStart]);

  const isLiveEmbed = currentVideoUrl.includes("embed/live_stream");

  const playerElement = React.useMemo(() => {
    if (isLiveEmbed) {
      return (
        <iframe
          src={`${currentVideoUrl}&autoplay=1&mute=1`}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onError={handleVideoError}
          onLoad={handleVideoStartWrapper}
        />
      );
    }
    return (
      <ReactPlayer
        key={currentVideoUrl}
        ref={playerRef}
        src={currentVideoUrl}
        width="100%"
        height="100%"
        playing={isIdle}
        controls={true}
        loop={false}
        onError={handleVideoError}
        onEnded={handleVideoEnd}
        onStart={handleVideoStartWrapper}
        onProgress={handleVideoProgress}
      />
    );
  }, [currentVideoUrl, isLiveEmbed, handleVideoError, handleVideoEnd, handleVideoStartWrapper, handleVideoProgress]);

  return (
    <div className="w-full h-full">
      {currentVideoUrl ? playerElement : null}
    </div>
  );
}
