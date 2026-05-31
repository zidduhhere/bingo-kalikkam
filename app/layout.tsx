import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/components/user-provider";
import { BgAudio } from "@/components/bg-audio";
import { LanguageProvider } from "@/components/language-provider";
import { LanguageToggle } from "@/components/language-toggle";

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
        {/* Background Doodles and Lines */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-20 bg-[#fdfaf3]">
          {/* Notebook Lines */}
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(rgba(100, 150, 200, 0.3) 1px, transparent 1px)",
            backgroundSize: "100% 2.5rem",
            backgroundPosition: "0 3.5rem"
          }}></div>

          {/* Notebook Red Margin Line */}
          <div className="absolute top-0 bottom-0 left-[10%] md:left-16 w-0.5 bg-red-400/40"></div>
          
          {/* Lolan loves Achu */}
          <div className="absolute top-[15%] right-[10%] text-red-500/60 font-bold text-3xl rotate-15 font-(family-name:--font-caveat)">
            lolan loves achu ❤️
          </div>

          {/* Malayalam Notes */}
          <div className="absolute bottom-[20%] left-[5%] text-blue-900/40 text-xl -rotate-5 font-(family-name:--font-caveat) max-w-[200px] leading-relaxed">
            ഇന്ന് ക്ലാസ്സിൽ ഭയങ്കര ബോറാണ്... നമുക്ക് ബിങ്കോ കളിക്കാം! 
            <br/> (15 x 3 = 45)
          </div>


        </div>

        <LanguageProvider>
          <BgAudio />
          <LanguageToggle />
          <div className="relative z-0">
            <UserProvider>{children}</UserProvider>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
