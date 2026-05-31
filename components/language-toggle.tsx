"use client";

import { useLanguage } from "@/components/language-provider";

export function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();

  return (
    <div className="fixed top-20 right-4 z-50 flex items-center gap-2 p-2 bg-white/60 backdrop-blur-sm border-2 border-blue-900/20 rounded-2xl shadow-sm transform -rotate-2">
      <span className={`text-sm font-bold font-(family-name:--font-caveat) transition-colors ${lang === "EN" ? "text-blue-950" : "text-blue-900/50"}`}>
        Eng
      </span>
      
      <button 
        onClick={toggleLang}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 border-2 border-blue-900/30 ${lang === "ML" ? "bg-red-400" : "bg-white"}`}
        title="Toggle Language"
      >
        <span className="sr-only">Toggle Language</span>
        <span
          className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
            lang === "ML" ? "translate-x-5 bg-white" : "translate-x-1 bg-blue-900/50"
          }`}
        />
      </button>

      <span className={`text-sm font-bold font-(family-name:--font-caveat) transition-colors ${lang === "ML" ? "text-blue-950" : "text-blue-900/50"}`}>
        മള
      </span>
    </div>
  );
}
