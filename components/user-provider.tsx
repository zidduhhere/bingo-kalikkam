"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { insforge } from "@/lib/insforge";

type User = {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      // Restore access token from the HTTP-only refresh cookie so the session
      // survives page reloads without forcing the user to re-authenticate.
      await insforge.auth.refreshSession().catch(() => {});
      const { data } = await insforge.auth.getCurrentUser();
      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || "",
          name: data.user.profile?.name || data.user.email?.split("@")[0],
          avatar_url: data.user.profile?.avatar_url,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    }
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useUser = () => useContext(AuthContext);
