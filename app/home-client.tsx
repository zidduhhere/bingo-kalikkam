"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/language-provider";
import { insforge } from "@/lib/insforge";
interface HomeClientProps {
  userName: string;
  userImage?: string;
}

export function HomeClient({ userName, userImage }: HomeClientProps) {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const { lang } = useLanguage();

  const handleCreate = () => router.push("/room/new/lobby?mode=multiplayer");
  const handleVsComputer = () => router.push("/room/local/setup?mode=computer");
  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError("Room code must be 6 characters");
      return;
    }
    router.push(`/room/${code}/lobby`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-transparent">
      <div className="mx-auto w-full max-w-sm space-y-8 bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-zinc-200/50 transform rotate-1">

        <div className="text-center space-y-2">
          <h1 className="text-6xl font-black tracking-tight text-blue-900 drop-shadow-sm -rotate-2">Bingo</h1>
          <p className="text-2xl text-blue-800/80 font-medium rotate-1">{lang === "EN" ? "School Edition" : "സ്കൂൾ ഓർമ്മകൾ"}</p>
        </div>
        <div className="flex items-center justify-between rounded-xl border-2 border-blue-900/20 bg-white/40 px-4 py-3 shadow-sm rounded-[255px_15px_225px_15px/15px_225px_15px_255px]">
          <div className="flex items-center gap-3">
            { }
            {userImage && (
              <img src={userImage} alt="" className="h-8 w-8 rounded-full border border-blue-900/20" />
            )}
            <span className="text-xl font-medium text-blue-950">{userName}</span>
          </div>
          <button
            onClick={async () => {
              await insforge.auth.signOut();
              window.location.href = "/sign-in";
            }}
            className="text-lg text-red-400 hover:text-red-600 transition-colors"
          >
            Sign out
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <Button onClick={handleCreate} className="w-full py-4 h-auto text-2xl font-(family-name:--font-caveat)">
            {lang === "EN" ? "Create Room" : "വാ നമുക്ക് റൂം എടുക്കാം"}
          </Button>
          <Button
            onClick={handleVsComputer}
            variant="ghost"
            className="w-full py-4 h-auto text-2xl font-(family-name:--font-caveat) border-2 border-blue-900/30 rounded-xl hover:bg-blue-900/5 transition-colors"
          >
            {lang === "EN" ? "Play vs Computer" : "യന്ത്രവുമായിട്ടുള്ള മൽപ്പിടുത്തം"}
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-3">
            <Input
              placeholder={lang === "EN" ? "Enter room code" : "റൂം കോഡ് അടിക്കൂ"}
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setError("");
              }}
              maxLength={6}
              className="font-mono tracking-widest uppercase text-xl h-14 text-center"
            />
            <Button onClick={handleJoin} disabled={!joinCode} className="w-full py-4 h-auto text-2xl font-(family-name:--font-caveat)">
              {lang === "EN" ? "Join" : "വാ നമുക്ക് കയറാം"}
            </Button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <Button onClick={() => router.push("/leaderboard")} variant="ghost" className="w-full text-blue-800 font-(family-name:--font-caveat) text-xl hover:bg-transparent hover:underline -mt-2">
          {lang === "EN" ? "View Leaderboard 🏆" : "ലീഡർബോർഡ് കാണുക 🏆"}
        </Button>
      </div>
    </div>
  );
}
