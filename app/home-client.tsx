"use client";
import { useState, useEffect } from "react";
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
  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError("Room code must be 6 characters");
      return;
    }
    
    // Validate room exists in the backend
    const { data } = await insforge.database
      .from("rooms")
      .select("code")
      .eq("code", code)
      .single();
      
    if (!data) {
      setError("This room does not exist or has expired.");
      return;
    }
    
    router.push(`/room/${code}/lobby`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-transparent overflow-visible">
      {/* Transparent Container to let the notebook background show */}
      <div className="mx-auto w-full max-w-md space-y-10 p-2 transform rotate-1">
        
        <div className="text-center space-y-1 py-4">
          <h1 className="text-7xl md:text-8xl font-black text-blue-900 drop-shadow-sm -rotate-2 py-1 leading-[1.2]">
            Bingo
          </h1>
          <p className="text-3xl text-blue-800/80 font-medium rotate-1 py-1">
            {lang === "EN" ? "School Edition" : "സ്കൂൾ ഓർമ്മകൾ"}
          </p>
        </div>

        {/* User Profile */}
        <div className="flex items-center justify-between border-2 border-blue-900/30 bg-white/30 px-5 py-4 shadow-sm rounded-[255px_15px_225px_15px/15px_225px_15px_255px] transform -rotate-1">
          <div className="flex items-center gap-3">
            {userImage && (
              <img
                src={userImage}
                alt=""
                className="h-10 w-10 rounded-full border-2 border-blue-900/20 shadow-sm"
              />
            )}
            <span className="text-2xl font-bold text-blue-950 leading-none">
              {userName}
            </span>
          </div>
          <button
            onClick={async () => {
              await insforge.auth.signOut();
              window.location.href = "/sign-in";
            }}
            className="text-xl text-red-500 hover:text-red-700 transition-colors font-bold"
          >
            Sign out
          </button>
        </div>

        {/* Main Actions */}
        <div className="flex flex-col gap-5">
          <Button
            onClick={handleCreate}
            className="w-full py-5 h-auto text-3xl font-(family-name:--font-caveat) bg-blue-900 hover:bg-blue-800 text-white rounded-[255px_15px_225px_15px/15px_225px_15px_255px] shadow-md transition-transform active:scale-95"
          >
            {lang === "EN" ? "Create Room" : "വാ നമുക്ക് റൂം എടുക്കാം"}
          </Button>
          <Button
            onClick={handleVsComputer}
            variant="ghost"
            className="w-full py-5 h-auto text-3xl font-(family-name:--font-caveat) border-2 border-blue-900/40 text-blue-900 bg-white/20 rounded-[15px_225px_15px_255px/255px_15px_225px_15px] hover:bg-blue-900/10 shadow-sm transition-transform active:scale-95"
          >
            {lang === "EN"
              ? "Play vs Computer"
              : "യന്ത്രവുമായിട്ടുള്ള മൽപ്പിടുത്തം"}
          </Button>
        </div>

        {/* Join Section */}
        <div className="flex flex-col gap-4 border-t-2 border-dashed border-blue-900/20 pt-8 mt-4">
          <h2 className="text-2xl font-black text-blue-900/60 text-center font-(family-name:--font-caveat) -rotate-1">
             {lang === "EN" ? "Got a Code?" : "കോഡ് ഉണ്ടോ?"}
          </h2>
          <div className="flex gap-3 items-stretch">
            <Input
              placeholder={lang === "EN" ? "CODE" : "കോഡ്"}
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setError("");
              }}
              maxLength={6}
              className="font-(family-name:--font-caveat) text-3xl h-auto py-3 text-center uppercase border-2 border-blue-900/40 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] bg-white/30 text-blue-900 placeholder:text-blue-900/30 focus-visible:ring-blue-900/50"
            />
            <Button
              onClick={handleJoin}
              disabled={!joinCode}
              className="py-3 px-8 h-auto text-3xl font-(family-name:--font-caveat) bg-amber-400 hover:bg-amber-500 text-blue-950 rounded-[15px_225px_15px_255px/255px_15px_225px_15px] border-2 border-blue-900/20 shadow-sm transition-transform active:scale-95"
            >
              {lang === "EN" ? "Join" : "കയറാം"}
            </Button>
          </div>
          {error && <p className="text-xl text-red-500 font-bold text-center -rotate-1">{error}</p>}
        </div>

        {/* Leaderboard Section */}
        <div className="border-t-2 border-blue-900/10 pt-8 mt-4 flex flex-col items-center gap-6 pb-12">
          <h2 className="text-xl font-black text-blue-900/50 text-center font-(family-name:--font-caveat) uppercase tracking-widest text-sm">
            {lang === "EN" ? "Reigning Champion" : "ഇപ്പോഴത്തെ ചാമ്പ്യൻ"}
          </h2>
          <TopPlayerCard />
          <Button
            onClick={() => router.push("/leaderboard")}
            variant="link"
            className="text-blue-800/80 font-(family-name:--font-caveat) text-2xl hover:text-blue-600 transition-colors mt-2"
          >
            {lang === "EN" ? "View Full Leaderboard →" : "ലീഡർബോർഡ് കാണുക →"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TopPlayerCard() {
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await insforge.database
          .from("leaderboard")
          .select("*")
          .order("wins", { ascending: false })
          .limit(1)
          .single();
        if (data) setPlayer(data);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center p-4">
        <span className="text-3xl animate-pulse">🏆</span>
      </div>
    );

  if (!player)
    return (
      <div className="text-center p-3 text-blue-800/50 text-base font-(family-name:--font-caveat)">
        No champion yet. Go win a game!
      </div>
    );

  return (
    <div className="relative flex flex-col items-center gap-1 py-5 px-8 bg-white/40 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-2 border-amber-400/80 shadow-[0_0_15px_2px_rgba(251,191,36,0.15)] transform rotate-1">
      {/* Crown */}
      <span className="text-5xl drop-shadow-md leading-none absolute -top-6 -right-3 transform rotate-12">👑</span>
      {/* Name */}
      <span className="text-4xl font-black text-blue-950 font-(family-name:--font-caveat) mt-1 leading-tight">
        {player.user_name || "Unknown"}
      </span>
      {/* Stats row */}
      <div className="flex items-center gap-6 mt-2">
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-emerald-600 leading-none font-(family-name:--font-caveat)">{player.wins}</span>
          <span className="text-xs font-bold text-emerald-600/70 uppercase tracking-widest font-sans">Wins</span>
        </div>
        <div className="w-px h-8 bg-blue-900/20 transform rotate-12" />
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-red-500 leading-none font-(family-name:--font-caveat)">{player.losses}</span>
          <span className="text-xs font-bold text-red-500/70 uppercase tracking-widest font-sans">Losses</span>
        </div>
      </div>
    </div>
  );
}
