"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";

export default function GlobalHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Esconder completamente o header na rota da TV (que deve ser limpa)
  if (pathname.startsWith("/tv")) {
    return null;
  }

  return (
    <header className="w-full bg-white border-b border-emerald-100 shadow-sm py-3 px-6 flex items-center justify-between z-40 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sefaz-accent/10 text-sefaz-accent rounded-lg flex items-center justify-center">
            <UserIcon size={18} />
          </div>
          <h2 className="font-black text-sefaz-dark tracking-tighter uppercase hidden sm:block">
            GerFi <span className="font-medium text-sefaz-accent opacity-60">Sefaz</span>
          </h2>
        </div>

        <div>
          {session ? (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-black text-sefaz-dark leading-none">{session.user?.name}</p>
                <p className="text-[10px] font-bold text-sefaz-accent uppercase tracking-wider mt-1">
                  {session.user.role}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-2 border border-transparent hover:border-red-100"
                title="Sair do Sistema"
              >
                <LogOut size={16} />
                <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Sair</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2 bg-sefaz-accent text-white rounded-lg font-black text-xs uppercase tracking-widest hover:bg-sefaz-dark transition-colors cursor-pointer shadow-md shadow-emerald-900/10"
            >
              Login
            </button>
          )}
        </div>
      </header>
  );
}
