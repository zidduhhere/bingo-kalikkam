import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/components/user-provider";

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bingo",
  description: "Multiplayer bingo game - nostalgic edition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans relative">
        <div className="absolute top-0 bottom-0 left-[10%] md:left-16 w-0.5 bg-red-400/40 -z-10 pointer-events-none"></div>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
