"use client";
import { useState, useRef, useEffect } from "react";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { toJpeg } from "html-to-image";
import { useUser } from "@/components/user-provider";
import { useGameContext } from "@/contexts/game-context";
import { Grid } from "@/components/bingo/grid";
import { StrikeTracker } from "@/components/bingo/strike-tracker";
import { CalledNumbers } from "@/components/bingo/called-numbers";
import { PlayerList } from "@/components/bingo/player-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { detectStrikes } from "@/lib/bingo-logic";

export default function PlayPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { user } = useUser();
  const { state, actions } = useGameContext();
  const [inputNumber, setInputNumber] = useState("");
  const [callError, setCallError] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [suggestion, setSuggestion] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);
  const { lang } = useLanguage();

  const userId = user?.id ?? "";
  const calledSet = new Set(state.calledNumbers);
  const myStrikes = state.myGrid.length === 5 ? detectStrikes(state.myGrid, calledSet) : 0;
  const isMyTurn = state.currentTurnId === userId;
  const isComputerGame = state.players.some(p => p.isComputer);
  const cellRefs = useRef<(HTMLButtonElement | null)[][]>(Array.from({ length: 5 }, () => Array(5).fill(null)));

  const calledCountRef = useRef(state.calledNumbers.length);
  useEffect(() => {
    if (state.calledNumbers.length > calledCountRef.current) {
      const audio = new Audio("/strike-sound.mp3");
      audio.volume = 0.6;
      audio.play().catch(e => console.log("Strike sound blocked:", e));
    }
    calledCountRef.current = state.calledNumbers.length;
  }, [state.calledNumbers.length]);

  const prevStrikesRef = useRef<Record<string, number>>({});
  useEffect(() => {
    state.players.forEach(p => {
      const prev = prevStrikesRef.current[p.id] || 0;
      if (prev < 3 && p.strikeCount >= 3) {
        // Array of numbered audio files in public directory
        const audios = ["1.mp3"]; // Add "2.mp3", "3.mp3" here when added to the public folder
        const randomAudio = audios[Math.floor(Math.random() * audios.length)];
        const audio = new Audio(`/${randomAudio}`);
        audio.volume = 0.8;
        audio.play().catch(e => console.log("3rd strike audio blocked:", e));
      }
      prevStrikesRef.current[p.id] = p.strikeCount;
    });
  }, [state.players]);

  useEffect(() => {
    if (state.phase === "finished") {
      const audio = new Audio("/adich-keri%20vaa.webm");
      audio.volume = 1.0;
      audio.play().catch(e => console.log("Game over audio blocked:", e));
    }
  }, [state.phase]);

  const handleCallNumber = () => {
    const n = parseInt(inputNumber, 10);
    if (!isMyTurn) { setCallError("Not your turn!"); return; }
    if (isNaN(n) || n < 1 || n > 25) { setCallError("Enter a number between 1 and 25"); return; }
    if (state.calledNumbers.includes(n)) { setCallError("Number already called"); return; }
    actions.callNumber(n);
    setInputNumber("");
    setCallError("");
  };

  const handleCellClick = (r: number, c: number) => {
    const num = state.myGrid[r][c];
    if (!isMyTurn) {
      setCallError("Not your turn!");
      return;
    }
    if (calledSet.has(num)) {
      setCallError("Number already called");
      return;
    }
    actions.callNumber(num);
    setCallError("");
  };

  const handleCellKeyDown = (r: number, c: number, e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCellClick(r, c);
    } else if (e.key === "ArrowUp") {
      e.preventDefault(); if (r > 0) cellRefs.current[r - 1][c]?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault(); if (r < 4) cellRefs.current[r + 1][c]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault(); if (c > 0) cellRefs.current[r][c - 1]?.focus();
    } else if (e.key === "ArrowRight") {
      e.preventDefault(); if (c < 4) cellRefs.current[r][c + 1]?.focus();
    }
  };

  if (state.phase === "finished") {
    const myIndex = state.winners.findIndex(w => w.id === userId);
    const didIWin = myIndex !== -1;
    const getOrdinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    const handleShare = async () => {
      if (!storyRef.current) return;
      try {
        setIsGenerating(true);
        const dataUrl = await toJpeg(storyRef.current, { quality: 0.95, width: 1080, height: 1920 });
        const link = document.createElement("a");
        link.download = `bingo-winner-${code}.jpeg`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Failed to generate image", err);
      } finally {
        setIsGenerating(false);
      }
    };

    // Prepare story data
    const winnerPlayer = state.winners[0];
    const winnerGrid = winnerPlayer?.id === userId ? state.myGrid : (state.opponentGrids?.[winnerPlayer?.id] || state.myGrid);
    const opponentPlayer = state.players.find(p => p.id !== winnerPlayer?.id);

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 bg-transparent">
        <div className="text-center -rotate-2 bg-white/70 p-8 rounded-3xl border border-zinc-200/50 shadow-xl backdrop-blur-sm max-w-md w-full">
          <div className="text-7xl mb-4">{didIWin ? "🏆" : "😔"}</div>
          <h1 className="text-4xl font-black text-blue-900 drop-shadow-sm mb-6">
            {didIWin ? `You got ${getOrdinal(myIndex + 1)} Place!` : "You Lost!"}
          </h1>
          <div className="flex flex-col gap-2 text-left bg-white/50 p-4 rounded-xl border-2 border-blue-900/20 rounded-[15px_225px_15px_255px/255px_15px_225px_15px]">
             <h3 className="font-bold text-2xl text-blue-950 underline decoration-blue-900/30 decoration-[3px] mb-2">Final Standings</h3>
             {state.winners.map((w, i) => (
               <div key={w.id} className="flex flex-col gap-2 mb-3">
                 <div className="text-xl font-bold text-blue-900 flex justify-between">
                   <span>{i + 1}. {w.name} {w.id === userId && <span className="text-red-600 text-sm">(YOU)</span>}</span>
                   <span className="text-blue-600">WINNER</span>
                 </div>
                 {state.opponentGrids && state.opponentGrids[w.id] && w.id !== userId && (
                   <div className="mt-1 transform-gpu scale-75 origin-top-left -mb-16 pointer-events-none opacity-80">
                      <Grid grid={state.opponentGrids[w.id]} calledNumbers={calledSet} />
                   </div>
                 )}
               </div>
             ))}
             {state.players.filter(p => !state.winners.find(w => w.id === p.id)).map(p => (
               <div key={p.id} className="flex flex-col gap-2 mb-2">
                 <div className="text-xl font-bold text-blue-900/50 flex justify-between">
                   <span>- {p.name} {p.id === userId && <span className="text-red-400 text-sm">(YOU)</span>}</span>
                   <span>DNF</span>
                 </div>
                 {state.opponentGrids && state.opponentGrids[p.id] && p.id !== userId && (
                   <div className="mt-1 transform-gpu scale-[0.65] origin-top-left -mb-20 pointer-events-none opacity-70">
                      <Grid grid={state.opponentGrids[p.id]} calledNumbers={calledSet} />
                   </div>
                 )}
               </div>
             ))}
           </div>
           
           <div className="mt-6 flex flex-col gap-3 bg-white/50 p-4 rounded-xl border-2 border-blue-900/20 rounded-[15px_225px_15px_255px/255px_15px_225px_15px]">
             <h3 className="font-bold text-xl text-blue-950 font-(family-name:--font-caveat)">How was the game?</h3>
             {!feedbackSent ? (
               <div className="flex flex-col gap-3">
                 <div className="flex justify-center gap-1">
                   {[1, 2, 3, 4, 5].map((star) => (
                     <button
                       key={star}
                       className="text-3xl transition-transform hover:scale-110"
                       onMouseEnter={() => setHoverRating(star)}
                       onMouseLeave={() => setHoverRating(0)}
                       onClick={() => setRating(star)}
                     >
                       <span className={(hoverRating || rating) >= star ? "grayscale-0" : "grayscale opacity-50"}>⭐</span>
                     </button>
                   ))}
                 </div>
                 <textarea
                   className="w-full rounded-md border-2 border-blue-900/20 bg-white/50 p-2 text-sm text-blue-900 placeholder:text-blue-900/40 focus:outline-none focus:border-blue-900/50 min-h-[80px]"
                   placeholder="Any suggestions for new games?"
                   value={suggestion}
                   onChange={(e) => setSuggestion(e.target.value)}
                 />
                 <Button 
                   onClick={() => setFeedbackSent(true)}
                   disabled={!rating}
                   className="w-full text-lg h-auto py-2 font-(family-name:--font-caveat)"
                 >
                   Submit Feedback
                 </Button>
               </div>
             ) : (
               <p className="text-blue-600 font-medium font-(family-name:--font-caveat) text-xl">Thank you for your feedback! 🎉</p>
             )}
           </div>

           <div className="mt-4 pt-4 border-t-2 border-dashed border-blue-900/20 text-sm text-blue-900/70 font-medium flex flex-col gap-1">
             <p>Developed with ❤️ by <span className="font-bold text-blue-900">Ziddu</span></p>
             <p>Instagram: <a href="https://instagram.com/zid.kah" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@zid.kah</a></p>
           </div>
            </div>
        <div className="flex flex-col gap-4">
          <Button onClick={handleShare} disabled={isGenerating} className="w-64 text-xl bg-purple-600 hover:bg-purple-700 font-(family-name:--font-caveat)">
            {isGenerating ? "Generating..." : "Share to Story 📸"}
          </Button>
          <Button onClick={() => router.push("/")} className="w-64 text-xl">Play Again</Button>
        </div>

        {/* Hidden Story Template */}
        <div className="overflow-hidden absolute left-[-9999px] top-[-9999px]">
          <div ref={storyRef} className="w-[1080px] h-[1920px] bg-[#fdfaf3] flex flex-col items-center justify-center p-20 relative">
            {/* Notebook ruled lines decoration */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: "linear-gradient(#1e3a8a 2px, transparent 2px)", backgroundSize: "100% 4rem" }}></div>
            <div className="absolute top-0 bottom-0 left-32 w-1 bg-red-500/30 pointer-events-none"></div>

            <h1 className="text-[120px] font-black text-blue-900 font-(family-name:--font-caveat) drop-shadow-md mb-8 z-10 text-center">
              {winnerPlayer?.name} Won! 🏆
            </h1>
            
            <div className="z-10 scale-[2.5] origin-center mt-40">
              <Grid grid={winnerGrid} calledNumbers={calledSet} />
            </div>

            <div className="absolute bottom-32 z-10 flex flex-col items-center bg-white/80 p-8 rounded-3xl border-4 border-blue-900/20 shadow-xl -rotate-2">
              <p className="text-[50px] font-bold text-blue-950 font-(family-name:--font-caveat)">
                Defeated: {opponentPlayer?.name || "Opponent"}
              </p>
              <p className="text-[40px] text-blue-900/60 mt-4">Play Bingo Kalikkam!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.phase !== "playing") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 bg-transparent">
        <div className="text-center rotate-1 bg-white/50 p-8 rounded-2xl">
          <h1 className="text-4xl font-bold text-blue-900 animate-pulse">Waiting for opponent...</h1>
          <p className="mt-2 text-xl text-blue-800/80">The game will start once everyone has arranged their board.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row p-4 lg:p-12 gap-8 lg:gap-12 bg-transparent justify-center items-start overflow-hidden">
      
      {/* Left Column: Messy paper notes (Called Numbers) */}
      <div className="hidden lg:flex w-[250px] -rotate-3 transform-gpu transition-transform hover:-rotate-1 mt-10">
        <div className="bg-white/90 w-full p-6 shadow-xl border border-zinc-200 relative rounded-[2px_15px_3px_20px/10px_2px_15px_5px]">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-4 bg-yellow-500/30 rotate-2"></div>
           <CalledNumbers numbers={state.calledNumbers} />
        </div>
      </div>

      {/* Center Column: The Main Notebook Page */}
      <div className="flex flex-col items-center flex-1 max-w-xl w-full z-10 relative">
        <div className="bg-[#fdfaf3] w-full p-6 md:p-10 shadow-[8px_8px_0_0_rgba(30,58,138,0.1)] border-[3px] border-blue-900/10 rounded-[15px_2px_225px_3px/2px_225px_15px_255px] relative">
          
          {/* Notebook ruled lines decoration */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "linear-gradient(#1e3a8a 1px, transparent 1px)", backgroundSize: "100% 1.5rem" }}></div>
          <div className="absolute top-0 bottom-0 left-10 w-0.5 bg-red-500/20 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="flex flex-col items-center justify-center w-full gap-2 mb-2">
              <h1 className="text-4xl font-black text-blue-900 font-(family-name:--font-caveat) tracking-wider">Room: {code}</h1>
              <StrikeTracker count={myStrikes} />
            </div>

            <Grid 
              grid={state.myGrid} 
              calledNumbers={calledSet} 
              onCellClick={handleCellClick}
              onCellKeyDown={handleCellKeyDown}
              buttonRefs={cellRefs}
            />

            <div className="flex flex-col gap-4 w-full mt-6">
              <div className="relative flex justify-center">
                {isMyTurn && (
                  <svg className="absolute -inset-4 w-[120%] h-[150%] text-red-500/20 pointer-events-none -z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M 10,50 Q 50,10 90,50 T 10,50" stroke="currentColor" strokeWidth="8" fill="currentColor" />
                  </svg>
                )}
                <div className={`text-3xl font-bold text-center font-(family-name:--font-caveat) ${isMyTurn ? "text-red-600 animate-pulse" : "text-blue-900/50"}`}>
                  {isMyTurn ? "🎯 YOUR TURN!" : "⏳ Waiting for opponent..."}
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="text-xl font-bold text-blue-900/70 font-(family-name:--font-caveat)">
                  {isMyTurn ? (lang === "EN" ? "Click a number on your board to call it!" : "ബോർഡിൽ നിന്ന് ഒരു നമ്പർ തിരഞ്ഞെടുക്കുക!") : ""}
                </div>
              </div>
              {callError && <p className="text-sm font-bold text-red-600 font-(family-name:--font-caveat) text-center">{callError}</p>}
              
              {isComputerGame && (
                <div className="flex items-center justify-between mt-4 p-3 bg-white/80 rounded-xl border-2 border-blue-900/20 shadow-sm rounded-[15px_225px_15px_255px/255px_15px_225px_15px]">
                  <span className="text-lg font-bold text-blue-900 font-(family-name:--font-caveat)">AI Difficulty:</span>
                  <div className="flex gap-2">
                    <Button
                      variant={state.difficulty === "normal" ? "primary" : "outline"}
                      className="px-3 py-1 h-8"
                      onClick={() => actions.setDifficulty("normal")}
                    >
                      Normal
                    </Button>
                    <Button
                      variant={state.difficulty === "hard" ? "primary" : "outline"}
                      className="px-3 py-1 h-8"
                      onClick={() => actions.setDifficulty("hard")}
                    >
                      Hard
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile only called numbers */}
        <div className="lg:hidden w-full mt-8 bg-white/80 p-4 rounded-xl border-2 border-dashed border-blue-900/30">
          <CalledNumbers numbers={state.calledNumbers} />
        </div>
      </div>

      {/* Right Column: Player list on a torn scrap */}
      <aside className="w-full lg:w-[320px] rotate-2 transform-gpu transition-transform hover:rotate-0 mt-6 lg:mt-20">
        <div className="bg-yellow-50/90 w-full p-6 shadow-lg border border-yellow-200/50 rounded-[255px_2px_225px_15px/15px_255px_2px_225px] relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-blue-500/20 -rotate-4"></div>
          <PlayerList players={state.players} currentUserId={userId} />
        </div>
      </aside>
    </div>
  );
}
