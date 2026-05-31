"use client";

import { Auth0Provider as Auth0UserProvider } from "@auth0/nextjs-auth0";

export function UserProvider({ children }: { children: React.ReactNode }) {
  return <Auth0UserProvider>{children}</Auth0UserProvider>;
}
