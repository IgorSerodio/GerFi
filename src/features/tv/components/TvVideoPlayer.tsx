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
    isMuted?: () => boolean;
    mute?: () => void;
    unMute?: () => void;
  };
  getVolume?: () => number;
  setVolume?: (vol: number) => void;
  isMuted?: () => boolean;
  mute?: () => void;
  unMute?: () => void;
}

export default function TvVideoPlayer({
  isIdle,
  currentVideoUrl,
  handleVideoError,
  handleVideoEnd,
  handleVideoStart,
}: TvVideoPlayerProps) {
  const playerRef = React.useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = React.useState(true);
  const [volume, setVolume] = React.useState(1.0);
  const syncGracePeriodRef = React.useRef(true);

  React.useEffect(() => {
    syncGracePeriodRef.current = true;
    const savedMuted = localStorage.getItem("tv_video_muted");
    if (savedMuted === "false") {
      setIsMuted(false);
    } else if (savedMuted === null) {
      localStorage.setItem("tv_video_muted", "true");
    }

    const savedVolStr = localStorage.getItem("tv_video_volume");
    if (savedVolStr !== null) {
      const vol = parseFloat(savedVolStr);
      if (!isNaN(vol) && vol > 0) {
        setVolume(vol);
      }
    }
  }, []);

  const handleVideoProgress = React.useCallback(() => {
    if (syncGracePeriodRef.current) return;
    try {
      if (!playerRef.current) return;
      const player = (playerRef.current as unknown) as ReactPlayerInstance;
      
      const internalPlayer = (
        'getInternalPlayer' in player && typeof player.getInternalPlayer === 'function'
          ? player.getInternalPlayer()
          : player
      ) as YoutubeVideoElement | HTMLMediaElement | null;
      
      if (!internalPlayer) return;

      let currentVolNormalized: number | null = null;
      let isCurrentlyMuted: boolean | null = null;

      if ('api' in internalPlayer && internalPlayer.api) {
        if (typeof internalPlayer.api.getVolume === 'function') {
          currentVolNormalized = internalPlayer.api.getVolume() / 100;
        }
        if (typeof internalPlayer.api.isMuted === 'function') {
          isCurrentlyMuted = internalPlayer.api.isMuted();
        }
      } else if ('getVolume' in internalPlayer && typeof internalPlayer.getVolume === 'function') {
        currentVolNormalized = internalPlayer.getVolume() / 100;
        if ('isMuted' in internalPlayer && typeof (internalPlayer as any).isMuted === 'function') {
          isCurrentlyMuted = (internalPlayer as any).isMuted();
        }
      } else if (internalPlayer instanceof HTMLMediaElement) {
        currentVolNormalized = internalPlayer.volume;
        isCurrentlyMuted = internalPlayer.muted;
      }

      if (isCurrentlyMuted !== null && isCurrentlyMuted !== isMuted) {
        setIsMuted(isCurrentlyMuted);
        localStorage.setItem("tv_video_muted", isCurrentlyMuted ? "true" : "false");
      }

      if (currentVolNormalized !== null && currentVolNormalized !== volume && currentVolNormalized > 0) {
        setVolume(currentVolNormalized);
        localStorage.setItem("tv_video_volume", currentVolNormalized.toString());
      }
    } catch {
    }
  }, [isMuted, volume]);

  const handleReady = React.useCallback(() => {
    setTimeout(() => {
      syncGracePeriodRef.current = false;
    }, 500);
  }, []);

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
          onLoad={handleVideoStart}
        />
      );
    }
    return (
      <ReactPlayer
        key={currentVideoUrl}
        ref={playerRef as any}
        src={currentVideoUrl}
        width="100%"
        height="100%"
        playing={isIdle}
        muted={isMuted}
        volume={volume}
        controls={true}
        loop={false}
        onError={handleVideoError}
        onEnded={handleVideoEnd}
        onStart={handleVideoStart}
        onReady={handleReady}
        onProgress={handleVideoProgress}
      />
    );
  }, [currentVideoUrl, isLiveEmbed, isIdle, isMuted, volume, handleVideoError, handleVideoEnd, handleVideoStart, handleReady, handleVideoProgress]);

  return (
    <div className="w-full h-full">
      {currentVideoUrl ? playerElement : null}
    </div>
  );
}
