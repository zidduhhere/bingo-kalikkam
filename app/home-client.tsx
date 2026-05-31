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
          <h1 className="text-6xl font-black tracking-tight text-blue-900 drop-shadow-sm -rotate-2">
            Bingo
          </h1>
          <p className="text-2xl text-blue-800/80 font-medium rotate-1">
            {lang === "EN" ? "School Edition" : "സ്കൂൾ ഓർമ്മകൾ"}
          </p>
        </div>
        <div className="flex items-center justify-between border-2 border-blue-900/20 bg-white/40 px-4 py-3 shadow-sm rounded-[255px_15px_225px_15px/15px_225px_15px_255px]">
          <div className="flex items-center gap-3">
            {}
            {userImage && (
              <img
                src={userImage}
                alt=""
                className="h-8 w-8 rounded-full border border-blue-900/20"
              />
            )}
            <span className="text-xl font-medium text-blue-950">
              {userName}
            </span>
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
          <Button
            onClick={handleCreate}
            className="w-full py-4 h-auto text-2xl font-(family-name:--font-caveat)"
          >
            {lang === "EN" ? "Create Room" : "വാ നമുക്ക് റൂം എടുക്കാം"}
          </Button>
          <Button
            onClick={handleVsComputer}
            variant="ghost"
            className="w-full py-4 h-auto text-2xl font-(family-name:--font-caveat) border-2 border-blue-900/30 rounded-xl hover:bg-blue-900/5 transition-colors"
          >
            {lang === "EN"
              ? "Play vs Computer"
              : "യന്ത്രവുമായിട്ടുള്ള മൽപ്പിടുത്തം"}
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-3">
            <Input
              placeholder={
                lang === "EN" ? "Enter room code" : "റൂം കോഡ് അടിക്കൂ"
              }
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setError("");
              }}
              maxLength={6}
              className="font-mono tracking-widest uppercase text-xl h-14 text-center"
            />
            <Button
              onClick={handleJoin}
              disabled={!joinCode}
              className="w-full py-4 h-auto text-2xl font-(family-name:--font-caveat)"
            >
              {lang === "EN" ? "Join" : "വാ നമുക്ക് കയറാം"}
            </Button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <Button
          onClick={() => router.push("/leaderboard")}
          variant="ghost"
          className="w-full text-blue-800 font-(family-name:--font-caveat) text-xl hover:bg-transparent hover:underline -mt-2"
        >
          {lang === "EN" ? "View Full Leaderboard 🏆" : "ലീഡർബോർഡ് കാണുക 🏆"}
        </Button>

        {/* Leaderboard Preview */}
        <div className="mt-4 border-t-2 border-blue-900/10 pt-6">
          <h2 className="text-2xl font-black text-blue-900 drop-shadow-sm text-center mb-4 font-(family-name:--font-caveat)">
            {lang === "EN" ? "Top Players" : "മുമ്പന്മാർ"}
          </h2>

          <div className="bg-white/50 rounded-xl overflow-hidden shadow-sm border border-blue-900/10">
            <LeaderboardPreview />
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardPreview() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const { data } = await insforge.database
          .from("leaderboard")
          .select("*")
          .order("wins", { ascending: false })
          .limit(5);
        if (data) setData(data);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  if (loading)
    return (
      <div className="p-4 text-center text-blue-800/60 animate-pulse">
        Loading...
      </div>
    );
  if (!data || data.length === 0)
    return (
      <div className="p-4 text-center text-blue-800/60 text-sm">
        No games played yet.
      </div>
    );

  return (
    <div className="divide-y divide-blue-900/10">
      {data.map((player, idx) => (
        <div
          key={player.user_id}
          className="flex items-center justify-between p-3 hover:bg-white/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="font-black text-lg w-6 text-blue-900/40 text-center">
              {idx + 1}
            </span>
            <span className="font-semibold text-blue-950 truncate max-w-[120px]">
              {player.user_name || "Unknown"}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <div className="flex flex-col items-center">
              <span className="text-green-600 font-bold">{player.wins}</span>
              <span className="text-[10px] text-green-600/70 uppercase">
                Wins
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-red-500 font-bold">{player.losses}</span>
              <span className="text-[10px] text-red-500/70 uppercase">
                Loss
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
