# Bingo Multiplayer Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multiplayer Bingo game frontend in Next.js with OAuth auth, room codes, WebSocket-driven real-time play, and a computer-opponent mode.

**Architecture:** App Router (Next.js 16), Auth.js v5 for Google/GitHub OAuth, native browser WebSocket connecting to a separate backend server. Game state lives in a React context fed by WebSocket events. All WebSocket message shapes are typed via shared TypeScript interfaces so the frontend and backend team share a contract.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Auth.js v5 (`next-auth@beta`), native WebSocket API, React Context.

---

## File Map

```
app/
  layout.tsx                          — root layout (SessionProvider wrapper)
  page.tsx                            — home/landing: create room, join room, vs computer
  (auth)/
    sign-in/page.tsx                  — OAuth sign-in page
  (game)/
    room/[code]/
      lobby/page.tsx                  — waiting room (show room code, players list)
      setup/page.tsx                  — arrange your bingo numbers on the grid
      play/page.tsx                   — live game board
    layout.tsx                        — game layout: WebSocket provider wrapping all game routes

lib/
  auth.ts                             — Auth.js config (providers, callbacks)
  ws-types.ts                         — all WebSocket message/event TypeScript types
  bingo-logic.ts                      — pure functions: detect strikes, check win
  utils.ts                            — misc helpers (shuffle, range)

hooks/
  use-websocket.ts                    — manages WS connection lifecycle, reconnect, send
  use-game.ts                         — consumes WebSocket events, exposes typed game state

contexts/
  game-context.tsx                    — React context wrapping use-game, provided in game layout

components/
  bingo/
    grid.tsx                          — renders a 5×5 bingo grid (used in setup and play)
    cell.tsx                          — single grid cell (called/uncalled/mine states)
    strike-tracker.tsx                — shows 5 strike slots (filled/empty)
    called-numbers.tsx                — scrollable list of all numbers called so far
    player-list.tsx                   — sidebar: players + their strike counts
  ui/
    button.tsx                        — shared button component
    input.tsx                         — shared text input
    room-code-badge.tsx               — large room code display with copy button
    spinner.tsx                       — loading spinner

app/api/auth/[...nextauth]/route.ts  — Auth.js catch-all API route
middleware.ts                         — protect /room routes; redirect unauthenticated users
```

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Auth.js v5 beta**

```bash
cd /path/to/project
npm install next-auth@beta
```

Expected output: `added N packages` with `next-auth@5.x.x` listed.

- [ ] **Step 2: Verify install**

```bash
npm ls next-auth
```

Expected: shows `next-auth@5.x.x` with no peer dependency errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add next-auth v5 beta"
```

---

## Task 2: Auth.js config + API route

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`

Auth.js v5 uses a single `auth.ts` config file. Google and GitHub providers require `CLIENT_ID` / `CLIENT_SECRET` env vars. The route just re-exports `handlers` from the config.

- [ ] **Step 1: Create `lib/auth.ts`**

```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
```

- [ ] **Step 2: Create `app/api/auth/[...nextauth]/route.ts`**

```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 3: Add env vars to `.env.local`**

Create `.env.local` in the project root:

```
NEXTAUTH_SECRET=replace-with-random-32-char-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

> Note: `.env.local` must NOT be committed. Verify it is in `.gitignore`.

- [ ] **Step 4: Extend session type so `session.user.id` is typed**

Create `types/next-auth.d.ts`:

```typescript
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts app/api/auth types/next-auth.d.ts
git commit -m "feat: add Auth.js v5 config with Google and GitHub providers"
```

---

## Task 3: Middleware — protect game routes

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Create `middleware.ts`**

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnGameRoute = req.nextUrl.pathname.startsWith("/room");

  if (isOnGameRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
});

export const config = {
  matcher: ["/room/:path*"],
};
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: protect /room routes with auth middleware"
```

---

## Task 4: Sign-in page

**Files:**
- Create: `app/(auth)/sign-in/page.tsx`
- Create: `components/ui/button.tsx`

- [ ] **Step 1: Create shared button component**

```typescript
// components/ui/button.tsx
import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50",
        variant === "primary" && "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
        variant === "ghost" && "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Create `lib/utils.ts`**

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

- [ ] **Step 3: Install clsx and tailwind-merge**

```bash
npm install clsx tailwind-merge
```

- [ ] **Step 4: Create sign-in page**

```typescript
// app/(auth)/sign-in/page.tsx
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">🎱 Bingo</h1>
          <p className="mt-2 text-sm text-zinc-500">Sign in to play with friends</p>
        </div>

        <div className="flex flex-col gap-3">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="ghost" className="w-full">
              <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
          </form>

          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="ghost" className="w-full">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Continue with GitHub
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add app/\(auth\) components/ui/button.tsx lib/utils.ts
git commit -m "feat: add sign-in page with Google and GitHub OAuth"
```

---

## Task 5: Update root layout with SessionProvider

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/session-provider.tsx`

Auth.js v5 requires a client-side `SessionProvider` wrapper for `useSession` to work in client components.

- [ ] **Step 1: Create client-side SessionProvider wrapper**

```typescript
// components/session-provider.tsx
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

- [ ] **Step 2: Update `app/layout.tsx`**

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bingo",
  description: "Multiplayer bingo game",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx components/session-provider.tsx
git commit -m "feat: wrap root layout with SessionProvider"
```

---

## Task 6: WebSocket types contract

**Files:**
- Create: `lib/ws-types.ts`

All WebSocket messages follow `{ type: string, payload: ... }`. This file is the shared contract — the backend must emit/accept these exact shapes.

- [ ] **Step 1: Create `lib/ws-types.ts`**

```typescript
// Outbound messages (client → server)
export type ClientMessage =
  | { type: "JOIN_ROOM"; roomCode: string; userId: string; userName: string }
  | { type: "CREATE_ROOM"; userId: string; userName: string; vsComputer: boolean }
  | { type: "SUBMIT_GRID"; grid: number[][] }   // 5×5 player grid, numbers 1-25
  | { type: "CALL_NUMBER"; number: number }
  | { type: "READY" };

// Inbound messages (server → client)
export type ServerMessage =
  | { type: "ROOM_CREATED"; roomCode: string }
  | { type: "PLAYER_JOINED"; players: Player[] }
  | { type: "PLAYER_LEFT"; userId: string }
  | { type: "GAME_STARTED" }
  | { type: "NUMBER_CALLED"; number: number; calledBy: string }
  | { type: "STRIKE"; userId: string; strikeCount: number; line: number[] }
  | { type: "GAME_OVER"; winnerId: string; winnerName: string }
  | { type: "ERROR"; message: string };

export interface Player {
  id: string;
  name: string;
  image?: string;
  strikeCount: number;
  isComputer?: boolean;
  isReady: boolean;
}

export interface GameState {
  roomCode: string;
  phase: "lobby" | "setup" | "playing" | "finished";
  players: Player[];
  calledNumbers: number[];
  myGrid: number[][];        // 5×5 grid the local player arranged
  winner: Player | null;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/ws-types.ts
git commit -m "feat: define WebSocket message types for client/server contract"
```

---

## Task 7: Pure bingo logic utilities

**Files:**
- Create: `lib/bingo-logic.ts`
- Create: `lib/bingo-logic.test.ts`

These are pure functions with no side effects — easiest to test.

- [ ] **Step 1: Write failing tests**

```typescript
// lib/bingo-logic.test.ts
import { detectStrikes, isWinner, buildEmptyGrid } from "./bingo-logic";

describe("buildEmptyGrid", () => {
  it("returns a 5×5 grid of zeros", () => {
    const grid = buildEmptyGrid();
    expect(grid.length).toBe(5);
    expect(grid[0].length).toBe(5);
    expect(grid[0][0]).toBe(0);
  });
});

describe("detectStrikes", () => {
  it("detects a full row as a strike", () => {
    const grid = [
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
      [11,12,13,14,15],
      [16,17,18,19,20],
      [21,22,23,24,25],
    ];
    const called = new Set([1, 2, 3, 4, 5]);
    expect(detectStrikes(grid, called)).toBe(1);
  });

  it("detects a full column as a strike", () => {
    const grid = [
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
      [11,12,13,14,15],
      [16,17,18,19,20],
      [21,22,23,24,25],
    ];
    const called = new Set([1, 6, 11, 16, 21]);
    expect(detectStrikes(grid, called)).toBe(1);
  });

  it("detects a main diagonal as a strike", () => {
    const grid = [
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
      [11,12,13,14,15],
      [16,17,18,19,20],
      [21,22,23,24,25],
    ];
    const called = new Set([1, 7, 13, 19, 25]);
    expect(detectStrikes(grid, called)).toBe(1);
  });

  it("returns 0 when no lines complete", () => {
    const grid = [
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
      [11,12,13,14,15],
      [16,17,18,19,20],
      [21,22,23,24,25],
    ];
    const called = new Set([1, 2, 3, 4]); // row not complete
    expect(detectStrikes(grid, called)).toBe(0);
  });
});

describe("isWinner", () => {
  it("returns true when strikeCount is 5", () => {
    expect(isWinner(5)).toBe(true);
  });

  it("returns false when strikeCount is less than 5", () => {
    expect(isWinner(4)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Install jest + ts-jest first:
```bash
npm install -D jest ts-jest @types/jest
```

Add to `package.json` scripts:
```json
"test": "jest"
```

Add `jest.config.js`:
```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
};
```

Run:
```bash
npm test -- lib/bingo-logic.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/bingo-logic.ts`**

```typescript
export function buildEmptyGrid(): number[][] {
  return Array.from({ length: 5 }, () => Array(5).fill(0));
}

// Returns the number of completed lines (rows + cols + 2 diagonals)
export function detectStrikes(grid: number[][], called: Set<number>): number {
  const SIZE = 5;
  let strikes = 0;

  // Rows
  for (let r = 0; r < SIZE; r++) {
    if (grid[r].every((n) => called.has(n))) strikes++;
  }

  // Columns
  for (let c = 0; c < SIZE; c++) {
    if (grid.every((row) => called.has(row[c]))) strikes++;
  }

  // Main diagonal (top-left → bottom-right)
  if (Array.from({ length: SIZE }, (_, i) => grid[i][i]).every((n) => called.has(n))) strikes++;

  // Anti-diagonal (top-right → bottom-left)
  if (Array.from({ length: SIZE }, (_, i) => grid[i][SIZE - 1 - i]).every((n) => called.has(n))) strikes++;

  return strikes;
}

export function isWinner(strikeCount: number): boolean {
  return strikeCount >= 5;
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- lib/bingo-logic.test.ts
```

Expected: PASS — 6 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/bingo-logic.ts lib/bingo-logic.test.ts jest.config.js package.json
git commit -m "feat: add bingo logic utilities with tests"
```

---

## Task 8: WebSocket hook

**Files:**
- Create: `hooks/use-websocket.ts`

Manages WS connection lifecycle, automatic reconnection, and typed message sending.

- [ ] **Step 1: Create `hooks/use-websocket.ts`**

```typescript
"use client";

import { useEffect, useRef, useCallback } from "react";
import type { ClientMessage, ServerMessage } from "@/lib/ws-types";

interface UseWebSocketOptions {
  onMessage: (msg: ServerMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export function useWebSocket(url: string, options: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => optionsRef.current.onOpen?.();

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);
        optionsRef.current.onMessage(msg);
      } catch {
        console.error("Failed to parse WS message", event.data);
      }
    };

    ws.onclose = () => {
      optionsRef.current.onClose?.();
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => console.error("WebSocket error", err);
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.warn("WebSocket not open, message dropped:", msg);
    }
  }, []);

  return { send };
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/use-websocket.ts
git commit -m "feat: add typed WebSocket hook with auto-reconnect"
```

---

## Task 9: Game context and use-game hook

**Files:**
- Create: `hooks/use-game.ts`
- Create: `contexts/game-context.tsx`

`use-game` computes derived state from WebSocket events. `game-context` makes it available to all game route components.

- [ ] **Step 1: Create `hooks/use-game.ts`**

```typescript
"use client";

import { useState, useCallback } from "react";
import { useWebSocket } from "./use-websocket";
import { detectStrikes } from "@/lib/bingo-logic";
import type { ServerMessage, ClientMessage, GameState, Player } from "@/lib/ws-types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";

const INITIAL_STATE: GameState = {
  roomCode: "",
  phase: "lobby",
  players: [],
  calledNumbers: [],
  myGrid: [],
  winner: null,
};

export function useGame(userId: string) {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  const handleMessage = useCallback((msg: ServerMessage) => {
    setState((prev) => {
      switch (msg.type) {
        case "ROOM_CREATED":
          return { ...prev, roomCode: msg.roomCode };

        case "PLAYER_JOINED":
          return { ...prev, players: msg.players };

        case "PLAYER_LEFT":
          return {
            ...prev,
            players: prev.players.filter((p) => p.id !== msg.userId),
          };

        case "GAME_STARTED":
          return { ...prev, phase: "setup" };

        case "NUMBER_CALLED": {
          const calledNumbers = [...prev.calledNumbers, msg.number];
          const calledSet = new Set(calledNumbers);
          const strikes = detectStrikes(prev.myGrid, calledSet);
          const players = prev.players.map((p) =>
            p.id === userId ? { ...p, strikeCount: strikes } : p
          );
          return { ...prev, calledNumbers, players };
        }

        case "STRIKE": {
          const players = prev.players.map((p) =>
            p.id === msg.userId ? { ...p, strikeCount: msg.strikeCount } : p
          );
          return { ...prev, players };
        }

        case "GAME_OVER": {
          const winner = prev.players.find((p) => p.id === msg.winnerId) ?? null;
          return { ...prev, phase: "finished", winner };
        }

        default:
          return prev;
      }
    });
  }, [userId]);

  const { send } = useWebSocket(WS_URL, { onMessage: handleMessage });

  const setMyGrid = useCallback((grid: number[][]) => {
    setState((prev) => ({ ...prev, myGrid: grid, phase: "playing" }));
  }, []);

  return { state, send, setMyGrid };
}
```

- [ ] **Step 2: Create `contexts/game-context.tsx`**

```typescript
"use client";

import { createContext, useContext } from "react";
import { useGame } from "@/hooks/use-game";
import type { ClientMessage, GameState } from "@/lib/ws-types";

interface GameContextValue {
  state: GameState;
  send: (msg: ClientMessage) => void;
  setMyGrid: (grid: number[][]) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) {
  const game = useGame(userId);
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}

export function useGameContext() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGameContext must be used within GameProvider");
  return ctx;
}
```

- [ ] **Step 3: Commit**

```bash
git add hooks/use-game.ts contexts/game-context.tsx
git commit -m "feat: add game context with WebSocket-driven state"
```

---

## Task 10: Game route layout

**Files:**
- Create: `app/(game)/layout.tsx`

Wraps all `/room` routes with `GameProvider`, passing the current user's ID from the session.

- [ ] **Step 1: Create `app/(game)/layout.tsx`**

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GameProvider } from "@/contexts/game-context";

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  return <GameProvider userId={session.user.id}>{children}</GameProvider>;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(game\)/layout.tsx
git commit -m "feat: add game layout with GameProvider and auth guard"
```

---

## Task 11: UI primitives

**Files:**
- Create: `components/ui/input.tsx`
- Create: `components/ui/spinner.tsx`
- Create: `components/ui/room-code-badge.tsx`

- [ ] **Step 1: Create `components/ui/input.tsx`**

```typescript
import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
        className
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 2: Create `components/ui/spinner.tsx`**

```typescript
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600",
        className
      )}
    />
  );
}
```

- [ ] **Step 3: Create `components/ui/room-code-badge.tsx`**

```typescript
"use client";

import { useState } from "react";

export function RoomCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 px-6 py-4 dark:border-indigo-700 dark:bg-indigo-950/30">
      <span className="font-mono text-3xl font-bold tracking-widest text-indigo-700 dark:text-indigo-300">
        {code}
      </span>
      <button
        onClick={handleCopy}
        className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/input.tsx components/ui/spinner.tsx components/ui/room-code-badge.tsx
git commit -m "feat: add shared UI primitives (Input, Spinner, RoomCodeBadge)"
```

---

## Task 12: Bingo grid components

**Files:**
- Create: `components/bingo/cell.tsx`
- Create: `components/bingo/grid.tsx`
- Create: `components/bingo/strike-tracker.tsx`
- Create: `components/bingo/called-numbers.tsx`
- Create: `components/bingo/player-list.tsx`

- [ ] **Step 1: Create `components/bingo/cell.tsx`**

```typescript
import { cn } from "@/lib/utils";

interface CellProps {
  value: number;
  isCalled: boolean;
  isEditing?: boolean;
  onClick?: () => void;
}

export function Cell({ value, isCalled, isEditing, onClick }: CellProps) {
  return (
    <button
      onClick={onClick}
      disabled={!isEditing && !isCalled}
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-lg border-2 text-lg font-bold transition-all select-none",
        isCalled
          ? "border-indigo-500 bg-indigo-600 text-white shadow-md"
          : "border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
        isEditing && !isCalled && "cursor-grab hover:border-indigo-300 hover:bg-indigo-50",
        value === 0 && "border-dashed border-zinc-300 text-zinc-300"
      )}
    >
      {value === 0 ? "?" : value}
    </button>
  );
}
```

- [ ] **Step 2: Create `components/bingo/grid.tsx`**

```typescript
import { Cell } from "./cell";

interface GridProps {
  grid: number[][];
  calledNumbers: Set<number>;
  isEditing?: boolean;
  onCellClick?: (row: number, col: number) => void;
}

export function Grid({ grid, calledNumbers, isEditing = false, onCellClick }: GridProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {grid.map((row, r) =>
        row.map((value, c) => (
          <Cell
            key={`${r}-${c}`}
            value={value}
            isCalled={calledNumbers.has(value)}
            isEditing={isEditing}
            onClick={() => onCellClick?.(r, c)}
          />
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `components/bingo/strike-tracker.tsx`**

```typescript
interface StrikeTrackerProps {
  count: number;
  max?: number;
}

export function StrikeTracker({ count, max = 5 }: StrikeTrackerProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Strikes</span>
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className={`h-6 w-6 rounded-full border-2 transition-colors ${
              i < count
                ? "border-indigo-500 bg-indigo-500"
                : "border-zinc-300 dark:border-zinc-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `components/bingo/called-numbers.tsx`**

```typescript
interface CalledNumbersProps {
  numbers: number[];
}

export function CalledNumbers({ numbers }: CalledNumbersProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Called Numbers</h3>
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
        {numbers.length === 0 ? (
          <span className="text-sm text-zinc-400">None yet</span>
        ) : (
          numbers.map((n) => (
            <span
              key={n}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white"
            >
              {n}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `components/bingo/player-list.tsx`**

```typescript
import { StrikeTracker } from "./strike-tracker";
import type { Player } from "@/lib/ws-types";

export function PlayerList({ players, currentUserId }: { players: Player[]; currentUserId: string }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Players</h3>
      <ul className="flex flex-col gap-2">
        {players.map((p) => (
          <li
            key={p.id}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
              p.id === currentUserId
                ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/30"
                : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{p.name}</span>
              {p.isComputer && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                  CPU
                </span>
              )}
              {p.id === currentUserId && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-600 dark:bg-indigo-900/50">
                  You
                </span>
              )}
            </div>
            <StrikeTracker count={p.strikeCount} />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add components/bingo/
git commit -m "feat: add bingo grid components (Cell, Grid, StrikeTracker, CalledNumbers, PlayerList)"
```

---

## Task 13: Home page — create / join room

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Rewrite `app/page.tsx`**

```typescript
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HomeClient } from "./home-client";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/sign-in");

  return (
    <HomeClient
      userName={session.user.name ?? "Player"}
      userImage={session.user.image ?? undefined}
      userId={session.user.id}
    />
  );
}
```

- [ ] **Step 2: Create `app/home-client.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOut } from "next-auth/react";

interface HomeClientProps {
  userName: string;
  userImage?: string;
  userId: string;
}

export function HomeClient({ userName, userImage, userId }: HomeClientProps) {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const handleCreate = () => {
    router.push("/room/new/lobby?mode=multiplayer");
  };

  const handleVsComputer = () => {
    router.push("/room/new/lobby?mode=computer");
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError("Room code must be 6 characters");
      return;
    }
    router.push(`/room/${code}/lobby`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tight">🎱 BINGO</h1>
          <p className="mt-2 text-zinc-500">5 strikes to win</p>
        </div>

        {/* User info */}
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            {userImage && (
              <img src={userImage} alt="" className="h-8 w-8 rounded-full" />
            )}
            <span className="text-sm font-medium">{userName}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            Sign out
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button onClick={handleCreate} className="w-full py-3 text-base">
            Create Room
          </Button>
          <Button onClick={handleVsComputer} variant="ghost" className="w-full py-3 text-base">
            Play vs Computer
          </Button>
        </div>

        {/* Join room */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              placeholder="Enter room code"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setError("");
              }}
              maxLength={6}
              className="font-mono tracking-widest uppercase"
            />
            <Button onClick={handleJoin} disabled={!joinCode}>
              Join
            </Button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx app/home-client.tsx
git commit -m "feat: add home page with create/join room and vs-computer options"
```

---

## Task 14: Room lobby page

**Files:**
- Create: `app/(game)/room/[code]/lobby/page.tsx`

Shows room code, lists players, and has a "Start Game" button (host only). On mount, sends `CREATE_ROOM` or `JOIN_ROOM` to the WebSocket.

- [ ] **Step 1: Create `app/(game)/room/[code]/lobby/page.tsx`**

```typescript
"use client";

import { useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useGameContext } from "@/contexts/game-context";
import { RoomCodeBadge } from "@/components/ui/room-code-badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode"); // "multiplayer" | "computer" | null (joining)
  const router = useRouter();
  const { data: session } = useSession();
  const { state, send } = useGameContext();

  const isNew = code === "new";
  const userId = session?.user?.id ?? "";
  const userName = session?.user?.name ?? "Player";

  useEffect(() => {
    if (!userId) return;

    if (isNew) {
      send({
        type: "CREATE_ROOM",
        userId,
        userName,
        vsComputer: mode === "computer",
      });
    } else {
      send({ type: "JOIN_ROOM", roomCode: code, userId, userName });
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect once room code is assigned (after CREATE_ROOM response)
  useEffect(() => {
    if (isNew && state.roomCode && state.roomCode !== "") {
      router.replace(`/room/${state.roomCode}/lobby`);
    }
  }, [state.roomCode, isNew, router]);

  // When game starts, navigate to setup
  useEffect(() => {
    if (state.phase === "setup") {
      router.push(`/room/${state.roomCode}/setup`);
    }
  }, [state.phase, state.roomCode, router]);

  const isHost = state.players[0]?.id === userId;
  const displayCode = isNew ? "..." : code;

  const handleStart = () => {
    send({ type: "READY" });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 p-6 dark:bg-zinc-950">
      <h1 className="text-2xl font-bold">Waiting Room</h1>

      <RoomCodeBadge code={displayCode} />

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <h2 className="text-sm font-semibold text-zinc-500">Players ({state.players.length})</h2>
        {state.players.length === 0 ? (
          <div className="flex items-center gap-2 text-zinc-400">
            <Spinner />
            <span className="text-sm">Waiting for players...</span>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {state.players.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <span className="text-sm font-medium">{p.name}</span>
                {p.isComputer && (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">CPU</span>
                )}
                {p.id === userId && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-600">You</span>
                )}
                {isHost && p.id === userId && (
                  <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-600">Host</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {isHost && (
        <Button onClick={handleStart} disabled={state.players.length < 2} className="w-full max-w-sm py-3">
          Start Game
        </Button>
      )}
      {!isHost && (
        <p className="text-sm text-zinc-400">Waiting for the host to start...</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(game\)/room/
git commit -m "feat: add room lobby page with player list and start game"
```

---

## Task 15: Grid setup page

**Files:**
- Create: `app/(game)/room/[code]/setup/page.tsx`

Player arranges numbers 1-25 on their 5×5 grid before the game starts. They can shuffle or click a number then click a cell to place it.

- [ ] **Step 1: Create `app/(game)/room/[code]/setup/page.tsx`**

```typescript
"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameContext } from "@/contexts/game-context";
import { Grid } from "@/components/bingo/grid";
import { Button } from "@/components/ui/button";
import { shuffle, range } from "@/lib/utils";

export default function SetupPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { send, setMyGrid } = useGameContext();

  // Start with a shuffled grid
  const [grid, setGrid] = useState<number[][]>(() => {
    const nums = shuffle(range(25));
    return Array.from({ length: 5 }, (_, r) => nums.slice(r * 5, r * 5 + 5));
  });

  const handleShuffle = () => {
    const nums = shuffle(range(25));
    setGrid(Array.from({ length: 5 }, (_, r) => nums.slice(r * 5, r * 5 + 5)));
  };

  const handleConfirm = () => {
    send({ type: "SUBMIT_GRID", grid });
    setMyGrid(grid);
    router.push(`/room/${code}/play`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 p-6 dark:bg-zinc-950">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Arrange Your Board</h1>
        <p className="mt-1 text-sm text-zinc-500">
          This is your secret grid. Your opponent won't see the positions.
        </p>
      </div>

      <Grid
        grid={grid}
        calledNumbers={new Set()}
        isEditing={false}
      />

      <div className="flex gap-3 w-full max-w-xs">
        <Button variant="ghost" onClick={handleShuffle} className="flex-1">
          Shuffle
        </Button>
        <Button onClick={handleConfirm} className="flex-1">
          Confirm Board
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(game\)/room/\[code\]/setup/
git commit -m "feat: add board setup page with shuffle and confirm"
```

---

## Task 16: Play page — live game board

**Files:**
- Create: `app/(game)/room/[code]/play/page.tsx`

The main game screen. Players take turns calling a number. Each player's grid shows called numbers highlighted. Strike tracker and player list are in a sidebar.

- [ ] **Step 1: Create `app/(game)/room/[code]/play/page.tsx`**

```typescript
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useGameContext } from "@/contexts/game-context";
import { Grid } from "@/components/bingo/grid";
import { StrikeTracker } from "@/components/bingo/strike-tracker";
import { CalledNumbers } from "@/components/bingo/called-numbers";
import { PlayerList } from "@/components/bingo/player-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { detectStrikes } from "@/lib/bingo-logic";

export default function PlayPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { state, send } = useGameContext();
  const [inputNumber, setInputNumber] = useState("");
  const [callError, setCallError] = useState("");

  const userId = session?.user?.id ?? "";
  const calledSet = new Set(state.calledNumbers);
  const myStrikes = detectStrikes(state.myGrid, calledSet);

  // Navigate to finish if game ends
  useEffect(() => {
    if (state.phase === "finished") {
      router.push(`/room/${code}/play?finished=true`);
    }
  }, [state.phase, code, router]);

  const handleCallNumber = () => {
    const n = parseInt(inputNumber, 10);
    if (isNaN(n) || n < 1 || n > 25) {
      setCallError("Enter a number between 1 and 25");
      return;
    }
    if (state.calledNumbers.includes(n)) {
      setCallError("Number already called");
      return;
    }
    send({ type: "CALL_NUMBER", number: n });
    setInputNumber("");
    setCallError("");
  };

  if (state.phase === "finished" && state.winner) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-6 dark:bg-zinc-950">
        <div className="text-center">
          <div className="text-6xl mb-4">{state.winner.id === userId ? "🏆" : "😔"}</div>
          <h1 className="text-3xl font-black">
            {state.winner.id === userId ? "You Won!" : `${state.winner.name} Won!`}
          </h1>
        </div>
        <Button onClick={() => router.push("/")} className="w-48">
          Play Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 p-4 dark:bg-zinc-950 lg:flex-row lg:gap-6 lg:p-8">
      {/* Main board */}
      <div className="flex flex-col items-center gap-6 flex-1">
        <div className="flex items-center justify-between w-full max-w-xs">
          <h1 className="text-xl font-bold">Room: {code}</h1>
          <StrikeTracker count={myStrikes} />
        </div>

        <Grid
          grid={state.myGrid}
          calledNumbers={calledSet}
        />

        {/* Call a number */}
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              max={25}
              placeholder="Call a number (1-25)"
              value={inputNumber}
              onChange={(e) => {
                setInputNumber(e.target.value);
                setCallError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCallNumber()}
            />
            <Button onClick={handleCallNumber} disabled={!inputNumber}>
              Call
            </Button>
          </div>
          {callError && <p className="text-xs text-red-500">{callError}</p>}
        </div>

        <CalledNumbers numbers={state.calledNumbers} />
      </div>

      {/* Sidebar */}
      <aside className="mt-6 lg:mt-0 lg:w-72">
        <PlayerList players={state.players} currentUserId={userId} />
      </aside>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(game\)/room/\[code\]/play/
git commit -m "feat: add live game play page with grid, number calling, and sidebar"
```

---

## Task 17: Run and smoke-test the UI

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Expected: server starts on `http://localhost:3000` with no build errors.

- [ ] **Step 2: Visit sign-in page**

Open `http://localhost:3000/sign-in`. Verify:
- Google and GitHub buttons render
- No console errors

- [ ] **Step 3: Verify auth redirect**

Visit `http://localhost:3000/room/ABC123/lobby` without signing in. Verify it redirects to `/sign-in`.

- [ ] **Step 4: Check home page renders**

After signing in via OAuth (requires real credentials in `.env.local`), verify the home page shows create/join/vs-computer options.

- [ ] **Step 5: Check TypeScript**

```bash
npx tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 6: Lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "chore: final lint and type check pass"
```
