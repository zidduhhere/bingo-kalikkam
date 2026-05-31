import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { HomeClient } from "./home-client";

export default async function HomePage() {
  const session = await getSession();
  if (!session?.user) redirect("/api/auth/login");
  return (
    <HomeClient
      userName={session.user.name ?? "Player"}
      userImage={session.user.picture ?? undefined}
    />
  );
}
