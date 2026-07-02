import React, { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-8 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent)] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
      
      <Suspense fallback={
        <div className="w-full max-w-md mx-auto p-8 bg-white rounded-[32px] shadow-xl border border-emerald-100/50 flex items-center justify-center h-[500px]">
          <div className="animate-spin w-8 h-8 border-4 border-sefaz-accent border-t-transparent rounded-full"></div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
