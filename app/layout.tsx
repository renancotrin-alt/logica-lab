import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://logica-tutor-programacao.renancotrin.chatgpt.site"),
  title: "Lógica — Pense primeiro, codifique em qualquer linguagem",
  description: "Tutor interativo para aprender lógica de programação antes da sintaxe, com Python, JavaScript, TypeScript, Java, SQL e tecnologias web.",
  openGraph: {
    title: "Lógica — Pense primeiro",
    description: "Aprenda a resolver problemas e traduza a mesma lógica para diferentes linguagens.",
    images: [{ url: "/og-v2.png", width: 1536, height: 1024, alt: "Tutor Lógica multilíngue" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lógica — Pense primeiro",
    description: "Aprenda a resolver problemas e codifique em diferentes linguagens.",
    images: ["/og-v2.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
