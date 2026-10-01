import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dito & Feito",
  description:
    "Seu cantinho para avaliar filmes e séries com quem você gosta.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
