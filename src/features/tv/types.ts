export interface YouTubeVideo {
  url: string;
  videoId: string;
  title: string;
}

export interface TvSettings {
  id: number;
  slug: string;
  name: string;
  mode: "channel" | "playlist" | "slides";
  youtubeChannel?: string;
  videoUrl: YouTubeVideo[];
  uploadedFiles: string[];
  services: number[];
  locationId: number;
  marqueeMessages: string[];
  slides: { title: string; text: string; type: string }[];
}
