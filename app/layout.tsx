import "./globals.css";

export const metadata = {
  title: "Dito & Feito",
  description: "Avalie filmes e séries em dupla ou grupo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}