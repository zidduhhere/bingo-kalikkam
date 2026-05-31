"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { insforge } from "@/lib/insforge";
interface HomeClientProps {
  userName: string;
  userImage?: string;
}

export function HomeClient({ userName, userImage }: HomeClientProps) {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const handleCreate = () => router.push("/room/new/lobby?mode=multiplayer");
  const handleVsComputer = () => router.push("/room/new/lobby?mode=computer");
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
          <h1 className="text-6xl font-black tracking-tight text-blue-900 drop-shadow-sm rotate-[-2deg]">Bingo</h1>
          <p className="text-2xl text-blue-800/80 font-medium rotate-[1deg]">School Edition</p>
        </div>
        <div className="flex items-center justify-between rounded-xl border-2 border-blue-900/20 bg-white/40 px-4 py-3 shadow-sm [border-radius:255px_15px_225px_15px/15px_225px_15px_255px]">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
          <Button onClick={handleCreate} className="w-full py-3 text-base">
            Create Room
          </Button>
          <Button
            onClick={handleVsComputer}
            variant="ghost"
            className="w-full py-3 text-base"
          >
            Play vs Computer
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              placeholder="Enter room code"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setError("");
              }}
              maxLength={6}
              className="font-mono tracking-widest uppercase"
            />
            <Button onClick={handleJoin} disabled={!joinCode}>
              Join
            </Button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
