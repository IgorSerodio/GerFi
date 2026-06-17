import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "GerFi - Sistema de Gestão de Filas - SEFAZ",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
