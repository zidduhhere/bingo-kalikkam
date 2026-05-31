"use client";

import { useUser } from "@/components/user-provider";
import { redirect } from "next/navigation";
import { HomeClient } from "./home-client";
import { useEffect } from "react";

export default function HomePage() {
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && !user) {
      redirect("/sign-in");
    }
  }, [user, isLoading]);

  if (isLoading || !user) return <div className="p-8 text-center flex-1 items-center justify-center bg-transparent">Loading...</div>;

  return (
    <HomeClient
      userId={user.id}
      userName={user.name ?? user.email ?? "Player"}
      userImage={user.avatar_url}
    />
  );
}
