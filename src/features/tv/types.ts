export interface YouTubeVideo {
  url: string;
  videoId: string;
  title: string;
}

export interface TvSettings {
  id: number;
  slug: string;
  name: string;
  mode: "live" | "files";
  videoUrl: YouTubeVideo[];
  uploadedFiles: string[];
  services: number[];
}
