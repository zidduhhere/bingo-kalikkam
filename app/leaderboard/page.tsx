"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { insforge } from "@/lib/insforge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";

interface PlayerStat {
  user_id: string;
  user_name: string;
  wins: number;
  losses: number;
}

export default function LeaderboardPage() {
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { lang } = useLanguage();

  useEffect(() => {
    insforge.database
      .from("leaderboard")
      .select("*")
      .order("wins", { ascending: false })
      .limit(20)
      .then(({ data, error }: any) => {
        if (!error && data) {
          setStats(data);
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center p-6 bg-transparent">
      <div className="w-full max-w-md mt-8 space-y-6 bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-zinc-200/50 transform -rotate-1 pb-16 bg-[url('https://www.transparenttextures.com/patterns/notebook-dark.png')]">
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/")} className="hover:bg-blue-100/50 text-blue-900 rounded-full h-10 w-10 p-2 text-2xl pb-3">
            ⬅️
          </Button>
          <div className="text-center flex-1 pr-10">
            <h1 className="text-4xl font-black tracking-tight text-blue-900 drop-shadow-sm rotate-1 flex items-center justify-center gap-2">
              <span className="text-3xl drop-shadow-md">🏆</span>
              Hall of Fame
            </h1>
            <p className="text-xl text-blue-800/80 font-(family-name:--font-caveat) -rotate-1">
              {lang === "EN" ? "Top 20 Players" : "മികച്ച 20 കളിക്കാർ"}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {loading ? (
            <div className="text-center p-8 text-xl text-blue-900/60 font-(family-name:--font-caveat)">
              {lang === "EN" ? "Loading records..." : "രേഖകൾ എടുക്കുന്നു..."}
            </div>
          ) : stats.length === 0 ? (
            <div className="text-center p-8 text-xl text-blue-900/60 font-(family-name:--font-caveat) border-2 border-dashed border-blue-900/20 rounded-xl">
              {lang === "EN" ? "No records yet. Go win a game!" : "ആരുമില്ല. പോയി ജയിച്ചു വാ!"}
            </div>
          ) : (
            stats.map((stat, i) => (
              <div 
                key={stat.user_id} 
                className={`flex items-center justify-between p-3 px-4 rounded-xl border-2 transition-all duration-300 ${
                  i === 0 ? "border-yellow-400 bg-yellow-50/50 scale-[1.02] shadow-sm transform -rotate-1" : 
                  i === 1 ? "border-slate-300 bg-slate-50/50" : 
                  i === 2 ? "border-amber-600/30 bg-amber-50/30" : 
                  "border-blue-900/10 bg-white/40"
                } rounded-[255px_15px_225px_15px/15px_225px_15px_255px]`}
              >
                <div className="flex items-center gap-3">
                  <div className={`font-black text-lg w-6 text-center ${i === 0 ? 'text-yellow-600' : 'text-blue-900/50'}`}>
                    {i === 0 ? <span className="text-xl">🥇</span> : `#${i + 1}`}
                  </div>
                  <div className="font-(family-name:--font-caveat) text-2xl text-blue-950 font-bold max-w-[150px] truncate">
                    {stat.user_name || "Unknown"}
                  </div>
                </div>
                
                <div className="flex gap-4 text-center">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-blue-900/40 uppercase">Wins</span>
                    <span className="text-xl font-bold text-emerald-600">{stat.wins}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-blue-900/40 uppercase">Loss</span>
                    <span className="text-xl font-bold text-red-400">{stat.losses}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
