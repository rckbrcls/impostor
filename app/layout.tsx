import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-[100svh] overflow-hidden flex flex-col`}
      >
        <main className="flex-1 w-full overflow-y-auto">
          {children}
        </main>
        <footer className="py-4 text-center text-sm text-muted-foreground">
          made by{' '}
          <a
            href="https://www.erickbarcelos.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            erick barcelos
          </a>
        </footer>
      </body>
    </html>
  );
}
