"use client";

import { useUser } from "@/components/user-provider";
import { useRouter } from "next/navigation";
import { HomeClient } from "./home-client";
import { useEffect } from "react";

export default function HomePage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/sign-in");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return <div className="p-8 text-center flex-1 items-center justify-center bg-transparent">Loading...</div>;

  return (
    <HomeClient
      userName={user.name ?? user.email ?? "Player"}
      userImage={user.avatar_url}
    />
  );
}
