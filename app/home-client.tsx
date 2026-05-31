"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HomeClientProps { userName: string; userImage?: string; }

export function HomeClient({ userName, userImage }: HomeClientProps) {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const handleCreate = () => router.push("/room/new/lobby?mode=multiplayer");
  const handleVsComputer = () => router.push("/room/new/lobby?mode=computer");
  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { setError("Room code must be 6 characters"); return; }
    router.push(`/room/${code}/lobby`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tight">🎱 BINGO</h1>
          <p className="mt-2 text-zinc-500">5 strikes to win</p>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            {userImage && <img src={userImage} alt="" className="h-8 w-8 rounded-full" />}
            <span className="text-sm font-medium">{userName}</span>
          </div>
          <a href="/api/auth/logout" className="text-xs text-zinc-400 hover:text-zinc-600">Sign out</a>
        </div>
        <div className="flex flex-col gap-3">
          <Button onClick={handleCreate} className="w-full py-3 text-base">Create Room</Button>
          <Button onClick={handleVsComputer} variant="ghost" className="w-full py-3 text-base">Play vs Computer</Button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              placeholder="Enter room code"
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError(""); }}
              maxLength={6}
              className="font-mono tracking-widest uppercase"
            />
            <Button onClick={handleJoin} disabled={!joinCode}>Join</Button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
