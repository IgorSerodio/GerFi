import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import MainMenuClient from "@/features/auth/components/MainMenuClient";

export default async function Page() {
  const session = await getServerSession(authOptions);
  return <MainMenuClient session={session} />;
}
