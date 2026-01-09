import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Fredoka } from "next/font/google";
import "./globals.css";

import { LanguageProvider } from "@/components/language-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Footer } from "@/components/footer";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Impostor",
  description: "Find the impostor among your friends!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} antialiased h-[100svh] overflow-hidden flex flex-col`}
      >
        <LanguageProvider>
          <LanguageSwitcher />
          <main className="flex-1 w-full overflow-y-auto">
            {children}
          </main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
