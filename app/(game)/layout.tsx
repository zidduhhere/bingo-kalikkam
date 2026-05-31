"use client";

import { useUser } from "@/components/user-provider";
import { redirect } from "next/navigation";
import { GameProvider } from "@/contexts/game-context";
import { useEffect } from "react";

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && !user) {
      redirect("/sign-in");
    }
  }, [user, isLoading]);

  if (isLoading || !user) return <div className="p-8">Loading...</div>;

  const userName = user.name ?? user.email ?? "Player";
  return <GameProvider userId={user.id} userName={userName}>{children}</GameProvider>;
}
