import React from "react";
import { getQueueStateAction, getTvSettingsAction } from "@/features/queue/actions";
import TvDashboard from "@/features/tv/components/TvDashboard";

export default async function TvPage() {
  const [queueRes, tvRes] = await Promise.all([getQueueStateAction(), getTvSettingsAction()]);
  
  const initialHistory = queueRes.success && queueRes.data ? queueRes.data.history : [];
  const initialSettings = tvRes.success && tvRes.data ? tvRes.data : {
    id: 1,
    mode: "live" as const,
    videoUrl: [],
    uploadedFiles: [],
  };

  return <TvDashboard initialHistory={initialHistory} initialSettings={initialSettings} />;
}
