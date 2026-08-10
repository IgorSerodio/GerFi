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
  getInternalPlayer: () => Record<string, unknown> | HTMLVideoElement | null;
}

export default function TvVideoPlayer({
  isIdle,
  currentVideoUrl,
  handleVideoError,
  handleVideoEnd,
  handleVideoStart,
}: TvVideoPlayerProps) {
  const playerRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (!playerRef.current) return;
    
    try {
      const player = (playerRef.current as unknown) as ReactPlayerInstance | HTMLVideoElement;
      const internal = (
        'getInternalPlayer' in player && typeof player.getInternalPlayer === 'function'
          ? player.getInternalPlayer()
          : player
      ) as Record<string, unknown> | HTMLVideoElement | null;
      
      if (isIdle) {
        if (internal) {
          if ('playVideo' in internal && typeof internal.playVideo === 'function') {
            internal.playVideo(); // Youtube
          } else if ('play' in internal && typeof internal.play === 'function') {
            internal.play(); // HTML5
          }
        }
      } else {
        if (internal) {
          if ('pauseVideo' in internal && typeof internal.pauseVideo === 'function') {
            internal.pauseVideo(); // Youtube
          } else if ('pause' in internal && typeof internal.pause === 'function') {
            internal.pause(); // HTML5
          }
        }
      }
    } catch (error) {
      console.warn("Could not imperatively control video player:", error);
    }
  }, [isIdle]);

  const handleVideoProgress = React.useCallback(() => {
    try {
      if (!playerRef.current) return;
      const player = (playerRef.current as unknown) as ReactPlayerInstance | HTMLVideoElement;
      
      const internalPlayer = (
        'getInternalPlayer' in player && typeof player.getInternalPlayer === 'function'
          ? player.getInternalPlayer()
          : player
      ) as Record<string, unknown> | HTMLVideoElement | null;
      if (!internalPlayer) return;

      let currentVolNormalized: number | null = null;

      if ('getVolume' in internalPlayer && typeof internalPlayer.getVolume === 'function') {
        currentVolNormalized = (internalPlayer.getVolume() as number) / 100;
      } 
      else if ('volume' in internalPlayer && typeof internalPlayer.volume === 'number') {
        currentVolNormalized = internalPlayer.volume;
      }

      if (currentVolNormalized !== null) {
        const savedVol = localStorage.getItem("tv_video_volume");
        if (savedVol !== currentVolNormalized.toString()) {
          localStorage.setItem("tv_video_volume", currentVolNormalized.toString());
        }
      }
    } catch {
    }
  }, []);

  const handleVideoStartWrapper = React.useCallback(() => {
    handleVideoStart();
    
    try {
      const savedVolStr = localStorage.getItem("tv_video_volume");
      const vol = savedVolStr !== null ? parseFloat(savedVolStr) : 0;
      
      if (isNaN(vol)) return;

      if (!playerRef.current) return;
      const player = (playerRef.current as unknown) as ReactPlayerInstance | HTMLVideoElement;

      const internalPlayer = (
        'getInternalPlayer' in player && typeof player.getInternalPlayer === 'function'
          ? player.getInternalPlayer()
          : player
      ) as Record<string, unknown> | HTMLVideoElement | null;
      if (!internalPlayer) return;

      if ('setVolume' in internalPlayer && typeof internalPlayer.setVolume === 'function') {
        internalPlayer.setVolume(vol * 100);
      } 
      else if ('volume' in internalPlayer) {
        Reflect.set(internalPlayer, 'volume', vol);
      }
    } catch (error) {
      console.warn("Could not set initial video volume:", error);
    }
  }, [handleVideoStart]);

  const playerElement = React.useMemo(() => (
    <ReactPlayer
      ref={playerRef}
      src={currentVideoUrl}
      width="100%"
      height="100%"
      playing={true}
      controls={true}
      loop={false}
      onError={handleVideoError}
      onEnded={handleVideoEnd}
      onStart={handleVideoStartWrapper}
      onProgress={handleVideoProgress}
    />
  ), [currentVideoUrl, handleVideoError, handleVideoEnd, handleVideoStartWrapper, handleVideoProgress]);

  return (
    <div className="w-full h-full">
      {playerElement}
    </div>
  );
}
