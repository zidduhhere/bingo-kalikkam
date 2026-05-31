import { auth0 } from "@/lib/auth0";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  return auth0.middleware(req);
}

export const config = {
  matcher: ["/room/:path*", "/auth/:path*"],
};
