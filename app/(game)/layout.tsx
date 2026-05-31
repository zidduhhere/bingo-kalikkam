import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { GameProvider } from "@/contexts/game-context";

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession();
  if (!session?.user) redirect("/api/auth/login");
  return <GameProvider userId={session.user.sub}>{children}</GameProvider>;
}
