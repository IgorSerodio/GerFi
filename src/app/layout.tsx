import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import GlobalHeader from "@/components/layout/GlobalHeader";
import { LoginModalProvider } from "@/features/auth/contexts/LoginModalContext";

export const metadata: Metadata = {
  title: "GerFi - Sistema de Gerenciamento de Filas - SEFAZ",
  description: "Sistema de gerenciamento de filas em tempo real para a Secretaria da Fazenda Municipal de Caruaru com painel de TV, triagem e back-office.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <LoginModalProvider>
            <div className="flex flex-col min-h-screen">
              <GlobalHeader />
              <main className="flex-1 flex flex-col">{children}</main>
            </div>
          </LoginModalProvider>
        </Providers>
      </body>
    </html>
  );
}
