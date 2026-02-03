import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Boa prática: usar fontes do Next.js
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema Enterprise",
  description: "Login seguro e escalável",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {/* O componente Providers gerencia o MUI no lado do cliente */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}