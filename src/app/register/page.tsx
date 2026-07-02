import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] py-12 px-8 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent)] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
      
      <RegisterForm />
    </div>
  );
}
