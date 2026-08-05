import { useState, useEffect, useCallback } from "react";
import { TvSettings } from "@/features/tv/types";

// Removed defaultSlides since they are now loaded from the database
export function useTvMedia(tvSettings: TvSettings) {
  const [slideIndex, setSlideIndex] = useState(0);

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
  }, [tvSettings.uploadedFiles, tvSettings.slides]);

  const getPlaylistUrl = useCallback(() => {
    if (!tvSettings.videoUrl || tvSettings.videoUrl.length === 0) return "";

    const firstVideoId = tvSettings.videoUrl[0].videoId;
    let url = `https://www.youtube.com/embed/${firstVideoId}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&loop=1`;

    if (tvSettings.videoUrl.length === 1) {
      url += `&playlist=${firstVideoId}`;
    } else {
      const remainingIds = tvSettings.videoUrl
        .slice(1)
        .map((v) => v.videoId)
        .join(",");
      url += `&playlist=${remainingIds},${firstVideoId}`;
    }

    return url;
  }, [tvSettings.videoUrl]);

  return { slideIndex, getPlaylistUrl, slides: tvSettings.slides || [] };
}
