import { useState, useEffect } from "react";
import { TvSettings } from "@/features/tv/types";

export function useSlideshow(tvSettings: TvSettings) {
  const [slideIndex, setSlideIndex] = useState(0);

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
    }, 10000);

    return () => clearInterval(slideTimer);
  }, [uploadedFilesStr, slidesStr, tvSettings.uploadedFiles, tvSettings.slides]);

  return { slideIndex };
}
