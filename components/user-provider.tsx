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
      const { data, error } = await insforge.auth.getSession();
      if (data?.session?.user) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || "",
          name: data.session.user.user_metadata?.name || data.session.user.user_metadata?.full_name || data.session.user.email?.split("@")[0],
          avatar_url: data.session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    }
    fetchUser();
    
    const { data: authListener } = insforge.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
          avatar_url: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useUser = () => useContext(AuthContext);
