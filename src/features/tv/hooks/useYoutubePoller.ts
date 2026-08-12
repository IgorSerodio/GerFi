import { useState, useEffect } from "react";
import { TvSettings } from "@/features/tv/types";
import { resolveYoutubeChannelAction, checkYoutubeLiveStatusAction } from "@/features/tv/services/youtube";

export function useYoutubePoller(tvSettings: TvSettings) {
  const [isResolvingChannel, setIsResolvingChannel] = useState(false);
  const [channelResolveError, setChannelResolveError] = useState(false);
  
  const [channelId, setChannelId] = useState<string>("");
  const [channelLiveUrl, setChannelLiveUrl] = useState<string>("");
  const [channelPlaylistUrl, setChannelPlaylistUrl] = useState<string>("");
  const [channelIsLive, setChannelIsLive] = useState(false);

  // Resolve Channel URL
  useEffect(() => {
    if (tvSettings.mode === "channel" && tvSettings.youtubeChannel) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsResolvingChannel(true);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChannelResolveError(false);
      resolveYoutubeChannelAction(tvSettings.youtubeChannel).then((res) => {
        if (res.success && res.data) {
          setChannelId(res.data.channelId);
          setChannelLiveUrl(res.data.liveUrl);
          setChannelPlaylistUrl(`https://www.youtube.com/playlist?list=${res.data.playlistId}`);
        } else {
          setChannelResolveError(true);
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
        if (res.liveVideoId) {
          setChannelLiveUrl(`https://www.youtube.com/watch?v=${res.liveVideoId}`);
        }
        setChannelIsLive(true);
      } else {
        setChannelIsLive(false);
      }
    };

    checkLive();
    const poller = setInterval(checkLive, 300000); // 5 minutos

    return () => {
      isMounted = false;
      clearInterval(poller);
    };
  }, [channelId, tvSettings.mode]);

  return {
    isResolvingChannel,
    channelResolveError,
    channelLiveUrl,
    channelPlaylistUrl,
    channelIsLive
  };
}
