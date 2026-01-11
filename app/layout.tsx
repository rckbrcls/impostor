import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Fredoka } from "next/font/google";
import "./globals.css";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { JsonLd } from "@/components/json-ld";

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
  metadataBase: new URL("https://duplizen.vercel.app"),
  title: {
    default: "Duplizen - Social Deduction Party Game",
    template: "%s | Duplizen",
  },
  description:
    "Play the ultimate social deduction game! Find the impostor among your friends in real-time. Everyone plays from their own phone - no app download needed!",
  keywords: [
    "duplizen",
    "impostor game",
    "social deduction",
    "multiplayer game",
    "party game",
    "online",
    "realtime",
    "ao vivo",
    "browser game",
    "no download",
    "sem baixar app",
    "multi-device",
    "play on phone",
    "jogue no celular",
    "find the impostor",
    "jogo do impostor",
    "jogo de dedução social",
    "jogo de festa",
  ],
  authors: [{ name: "Polterware", url: "https://www.polterware.com" }],
  creator: "Polterware",
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "pt_BR",
    url: "https://duplizen.vercel.app",
    siteName: "Duplizen",
    title: "Duplizen - Social Deduction Game",
    description:
      "Find the impostor among your friends! The ultimate multiplayer social deduction game.",
    images: [
      {
        url: "/assets/impostor.png",
        width: 1200,
        height: 630,
        alt: "Duplizen - Social Deduction Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Duplizen - Social Deduction Game",
    description:
      "Find the impostor among your friends! The ultimate multiplayer social deduction game.",
    images: ["/assets/impostor.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://duplizen.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <JsonLd />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} antialiased h-[100svh] overflow-hidden flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="w-full flex-1 overflow-y-auto">
            {children}
          </main>
          <div className="hidden sm:block">
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
