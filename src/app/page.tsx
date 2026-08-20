import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MainMenuClient from "@/components/core/MainMenuClient";

export default async function Page() {
  const session = await getServerSession(authOptions);
  return <MainMenuClient session={session} />;
}
