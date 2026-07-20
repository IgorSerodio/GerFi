import { useState, useEffect, useCallback } from "react";
import { TvSettings } from "@/features/tv/types";

export const defaultSlides = [
  {
    title: "IPTU 2026",
    text: "Pague sua cota única até Abril e receba 20% de desconto. Contribua com o crescimento de Caruaru.",
    type: "tax",
  },
  {
    title: "Nota Fiscal Caruaruense",
    text: "Peça seu CPF na nota e participe de sorteios mensais de até R$ 10.000,00.",
    type: "program",
  },
  {
    title: "Atendimento Online",
    text: "Evite filas! Mais de 50 serviços disponíveis no portal caruaru.pe.gov.br",
    type: "tax",
  },
  {
    title: "SEFAZ Informa",
    text: "Novos canais de atendimento via WhatsApp: (81) 99999-9999",
    type: "news",
  },
];

export function useTvMedia(tvSettings: TvSettings) {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const slideTimer = setInterval(() => {
      if (tvSettings.uploadedFiles.length > 0) {
        setSlideIndex((prev) => (prev + 1) % tvSettings.uploadedFiles.length);
      } else {
        setSlideIndex((prev) => (prev + 1) % defaultSlides.length);
      }
    }, 8000);

    return () => clearInterval(slideTimer);
  }, [tvSettings.uploadedFiles]);

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

  return { slideIndex, getPlaylistUrl, defaultSlides };
}
