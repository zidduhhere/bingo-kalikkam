# Bingo Multiplayer Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multiplayer Bingo game frontend in Next.js with Auth0 (Google) OAuth, room codes, WebSocket-driven real-time play, and a computer-opponent mode.

**Architecture:** App Router (Next.js 16), Auth0 (`@auth0/nextjs-auth0`) for Google OAuth, native browser WebSocket connecting to a separate backend server. Game state lives in a React context fed by WebSocket events. All WebSocket message shapes are typed via shared TypeScript interfaces so the frontend and backend team share a contract.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Auth0 (`@auth0/nextjs-auth0`), native WebSocket API, React Context.

---

## File Map

```
app/
  layout.tsx                          — root layout (Auth0 UserProvider wrapper)
  page.tsx                            — home/landing: create room, join room, vs computer
  home-client.tsx                     — client component for home page interactions
  api/
    auth/
      [auth0]/route.ts                — Auth0 catch-all API route
  (game)/
    layout.tsx                        — game layout: auth guard + WebSocket provider
    room/[code]/
      lobby/page.tsx                  — waiting room (show room code, players list)
      setup/page.tsx                  — arrange your bingo numbers on the grid
      play/page.tsx                   — live game board

lib/
  ws-types.ts                         — all WebSocket message/event TypeScript types
  bingo-logic.ts                      — pure functions: detect strikes, check win
  utils.ts                            — misc helpers (shuffle, range, cn)

hooks/
  use-websocket.ts                    — manages WS connection lifecycle, reconnect, send
  use-game.ts                         — consumes WebSocket events, exposes typed game state

contexts/
  game-context.tsx                    — React context wrapping use-game, provided in game layout

components/
  user-provider.tsx                   — client wrapper for Auth0 UserProvider
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
```

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Auth0 SDK and utilities**

```bash
npm install @auth0/nextjs-auth0 clsx tailwind-merge
```

Expected output: packages added with no peer dependency errors.

- [ ] **Step 2: Verify installs**

```bash
npm ls @auth0/nextjs-auth0 clsx tailwind-merge
```

Expected: all three listed at their installed versions with no unmet peer deps.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @auth0/nextjs-auth0, clsx, tailwind-merge"
```

---

## Task 2: Auth0 environment variables and API route

**Files:**
- Create: `.env.local` (not committed)
- Create: `app/api/auth/[auth0]/route.ts`

Auth0 SDK reads `AUTH0_SECRET`, `AUTH0_BASE_URL`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` from the environment. The catch-all route handles all `/api/auth/*` requests (login, logout, callback, me).

- [ ] **Step 1: Create `.env.local`**

```
AUTH0_SECRET=use-openssl-rand-hex-32-to-generate
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://YOUR_AUTH0_DOMAIN.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

> Note: In the Auth0 dashboard, create a Regular Web Application, enable Google social connection, and set Allowed Callback URL to `http://localhost:3000/api/auth/callback` and Allowed Logout URL to `http://localhost:3000`.

- [ ] **Step 2: Verify `.env.local` is in `.gitignore`**

```bash
grep ".env.local" .gitignore
```

Expected: `.env.local` appears in the output. If not, add it:
```bash
echo ".env.local" >> .gitignore
```

- [ ] **Step 3: Create `app/api/auth/[auth0]/route.ts`**

```typescript
import { handleAuth } from "@auth0/nextjs-auth0";

export const GET = handleAuth();
```

- [ ] **Step 4: Commit**

```bash
git add app/api/auth .gitignore
git commit -m "feat: add Auth0 catch-all API route"
```

---

## Task 3: Middleware — protect game routes

**Files:**
- Create: `middleware.ts`

Auth0 SDK provides `withMiddlewareAuthRequired` to guard routes. Unauthenticated users hitting `/room/*` are redirected to Auth0's login page.

- [ ] **Step 1: Create `middleware.ts`**

```typescript
import { withMiddlewareAuthRequired } from "@auth0/nextjs-auth0/edge";

export default withMiddlewareAuthRequired();

export const config = {
  matcher: ["/room/:path*"],
};
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: protect /room routes with Auth0 middleware"
```

---

## Task 4: Root layout with Auth0 UserProvider

**Files:**
- Create: `components/user-provider.tsx`
- Modify: `app/layout.tsx`

Auth0's `UserProvider` must be a client component. We wrap it so the server-side root layout stays a Server Component.

- [ ] **Step 1: Create `components/user-provider.tsx`**

```typescript
"use client";

import { UserProvider as Auth0UserProvider } from "@auth0/nextjs-auth0/client";

export function UserProvider({ children }: { children: React.ReactNode }) {
  return <Auth0UserProvider>{children}</Auth0UserProvider>;
}
```

- [ ] **Step 2: Update `app/layout.tsx`**

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/components/user-provider";

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
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/user-provider.tsx app/layout.tsx
git commit -m "feat: wrap root layout with Auth0 UserProvider"
```

---

## Task 5: Sign-in page

**Files:**
- Create: `app/sign-in/page.tsx`
- Create: `components/ui/button.tsx`
- Create: `lib/utils.ts`

Auth0 login is triggered by redirecting to `/api/auth/login`. No server action needed — just a regular anchor/button.

- [ ] **Step 1: Create `lib/utils.ts`**

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

- [ ] **Step 2: Create `components/ui/button.tsx`**

```typescript
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

- [ ] **Step 3: Create `app/sign-in/page.tsx`**

```typescript
export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">🎱 Bingo</h1>
          <p className="mt-2 text-sm text-zinc-500">Sign in to play with friends</p>
        </div>

        <a
          href="/api/auth/login"
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/sign-in lib/utils.ts components/ui/button.tsx
git commit -m "feat: add sign-in page with Google OAuth via Auth0"
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

## Task 7: Pure bingo logic utilities + tests

**Files:**
- Create: `lib/bingo-logic.ts`
- Create: `lib/bingo-logic.test.ts`
- Create: `jest.config.js`

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D jest ts-jest @types/jest
```

- [ ] **Step 2: Create `jest.config.js`**

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
};
```

Add to `package.json` `"scripts"`:
```json
"test": "jest"
```

- [ ] **Step 3: Write failing tests — `lib/bingo-logic.test.ts`**

```typescript
import { buildEmptyGrid, detectStrikes, isWinner } from "./bingo-logic";

describe("buildEmptyGrid", () => {
  it("returns a 5×5 grid of zeros", () => {
    const grid = buildEmptyGrid();
    expect(grid.length).toBe(5);
    expect(grid[0].length).toBe(5);
    expect(grid[0][0]).toBe(0);
  });
});

describe("detectStrikes", () => {
  const grid = [
    [1,  2,  3,  4,  5],
    [6,  7,  8,  9,  10],
    [11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25],
  ];

  it("detects a full row as a strike", () => {
    expect(detectStrikes(grid, new Set([1, 2, 3, 4, 5]))).toBe(1);
  });

  it("detects a full column as a strike", () => {
    expect(detectStrikes(grid, new Set([1, 6, 11, 16, 21]))).toBe(1);
  });

  it("detects the main diagonal as a strike", () => {
    expect(detectStrikes(grid, new Set([1, 7, 13, 19, 25]))).toBe(1);
  });

  it("detects the anti-diagonal as a strike", () => {
    expect(detectStrikes(grid, new Set([5, 9, 13, 17, 21]))).toBe(1);
  });

  it("returns 0 when no line is complete", () => {
    expect(detectStrikes(grid, new Set([1, 2, 3, 4]))).toBe(0);
  });
});

describe("isWinner", () => {
  it("returns true at 5 strikes", () => expect(isWinner(5)).toBe(true));
  it("returns false below 5 strikes", () => expect(isWinner(4)).toBe(false));
});
```

- [ ] **Step 4: Run — verify FAIL**

```bash
npm test -- lib/bingo-logic.test.ts
```

Expected: FAIL — `Cannot find module './bingo-logic'`.

- [ ] **Step 5: Implement `lib/bingo-logic.ts`**

```typescript
export function buildEmptyGrid(): number[][] {
  return Array.from({ length: 5 }, () => Array(5).fill(0));
}

export function detectStrikes(grid: number[][], called: Set<number>): number {
  const SIZE = 5;
  let strikes = 0;

  for (let r = 0; r < SIZE; r++) {
    if (grid[r].every((n) => called.has(n))) strikes++;
  }

  for (let c = 0; c < SIZE; c++) {
    if (grid.every((row) => called.has(row[c]))) strikes++;
  }

  if (Array.from({ length: SIZE }, (_, i) => grid[i][i]).every((n) => called.has(n))) strikes++;
  if (Array.from({ length: SIZE }, (_, i) => grid[i][SIZE - 1 - i]).every((n) => called.has(n))) strikes++;

  return strikes;
}

export function isWinner(strikeCount: number): boolean {
  return strikeCount >= 5;
}
```

- [ ] **Step 6: Run — verify PASS**

```bash
npm test -- lib/bingo-logic.test.ts
```

Expected: 7 tests passing.

- [ ] **Step 7: Commit**

```bash
git add lib/bingo-logic.ts lib/bingo-logic.test.ts jest.config.js package.json
git commit -m "feat: add bingo logic utilities with tests"
```

---

## Task 8: WebSocket hook

**Files:**
- Create: `hooks/use-websocket.ts`

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
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      reconnectRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => console.error("WebSocket error", err);
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
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

- [ ] **Step 1: Create `hooks/use-game.ts`**

```typescript
"use client";

import { useState, useCallback } from "react";
import { useWebSocket } from "./use-websocket";
import { detectStrikes } from "@/lib/bingo-logic";
import type { ServerMessage, ClientMessage, GameState } from "@/lib/ws-types";

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
          return { ...prev, players: prev.players.filter((p) => p.id !== msg.userId) };
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

export function GameProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
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

Uses Auth0's server-side `getSession` to get the current user and pass their ID to `GameProvider`.

- [ ] **Step 1: Create `app/(game)/layout.tsx`**

```typescript
import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { GameProvider } from "@/contexts/game-context";

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/api/auth/login");

  return (
    <GameProvider userId={session.user.sub}>{children}</GameProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(game\)/layout.tsx
git commit -m "feat: add game layout with Auth0 session guard and GameProvider"
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
git add components/ui/
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
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">CPU</span>
              )}
              {p.id === currentUserId && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-600 dark:bg-indigo-900/50">You</span>
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
- Create: `app/home-client.tsx`

Auth0's `getSession` provides the server-side session. The client gets user info via `useUser` from `@auth0/nextjs-auth0/client`.

- [ ] **Step 1: Rewrite `app/page.tsx`**

```typescript
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
```

- [ ] **Step 2: Create `app/home-client.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HomeClientProps {
  userName: string;
  userImage?: string;
}

export function HomeClient({ userName, userImage }: HomeClientProps) {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const handleCreate = () => router.push("/room/new/lobby?mode=multiplayer");
  const handleVsComputer = () => router.push("/room/new/lobby?mode=computer");

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
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tight">🎱 BINGO</h1>
          <p className="mt-2 text-zinc-500">5 strikes to win</p>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            {userImage && <img src={userImage} alt="" className="h-8 w-8 rounded-full" />}
            <span className="text-sm font-medium">{userName}</span>
          </div>
          <a href="/api/auth/logout" className="text-xs text-zinc-400 hover:text-zinc-600">
            Sign out
          </a>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={handleCreate} className="w-full py-3 text-base">
            Create Room
          </Button>
          <Button onClick={handleVsComputer} variant="ghost" className="w-full py-3 text-base">
            Play vs Computer
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              placeholder="Enter room code"
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError(""); }}
              maxLength={6}
              className="font-mono tracking-widest uppercase"
            />
            <Button onClick={handleJoin} disabled={!joinCode}>Join</Button>
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

- [ ] **Step 1: Create `app/(game)/room/[code]/lobby/page.tsx`**

```typescript
"use client";

import { useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useGameContext } from "@/contexts/game-context";
import { RoomCodeBadge } from "@/components/ui/room-code-badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const router = useRouter();
  const { user } = useUser();
  const { state, send } = useGameContext();

  const isNew = code === "new";
  const userId = user?.sub ?? "";
  const userName = user?.name ?? "Player";

  useEffect(() => {
    if (!userId) return;
    if (isNew) {
      send({ type: "CREATE_ROOM", userId, userName, vsComputer: mode === "computer" });
    } else {
      send({ type: "JOIN_ROOM", roomCode: code, userId, userName });
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isNew && state.roomCode) router.replace(`/room/${state.roomCode}/lobby`);
  }, [state.roomCode, isNew, router]);

  useEffect(() => {
    if (state.phase === "setup") router.push(`/room/${state.roomCode}/setup`);
  }, [state.phase, state.roomCode, router]);

  const isHost = state.players[0]?.id === userId;
  const displayCode = isNew ? "..." : code;

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
              <li key={p.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
                <span className="text-sm font-medium">{p.name}</span>
                {p.isComputer && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">CPU</span>}
                {p.id === userId && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-600">You</span>}
                {isHost && p.id === userId && <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-600">Host</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {isHost ? (
        <Button onClick={() => send({ type: "READY" })} disabled={state.players.length < 2} className="w-full max-w-sm py-3">
          Start Game
        </Button>
      ) : (
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

- [ ] **Step 1: Create `app/(game)/room/[code]/setup/page.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameContext } from "@/contexts/game-context";
import { Grid } from "@/components/bingo/grid";
import { Button } from "@/components/ui/button";
import { shuffle, range } from "@/lib/utils";

export default function SetupPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { send, setMyGrid } = useGameContext();

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
        <p className="mt-1 text-sm text-zinc-500">Your opponent won't see the number positions.</p>
      </div>
      <Grid grid={grid} calledNumbers={new Set()} />
      <div className="flex gap-3 w-full max-w-xs">
        <Button variant="ghost" onClick={handleShuffle} className="flex-1">Shuffle</Button>
        <Button onClick={handleConfirm} className="flex-1">Confirm Board</Button>
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

- [ ] **Step 1: Create `app/(game)/room/[code]/play/page.tsx`**

```typescript
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
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
  const { user } = useUser();
  const { state, send } = useGameContext();
  const [inputNumber, setInputNumber] = useState("");
  const [callError, setCallError] = useState("");

  const userId = user?.sub ?? "";
  const calledSet = new Set(state.calledNumbers);
  const myStrikes = detectStrikes(state.myGrid, calledSet);

  const handleCallNumber = () => {
    const n = parseInt(inputNumber, 10);
    if (isNaN(n) || n < 1 || n > 25) { setCallError("Enter a number between 1 and 25"); return; }
    if (state.calledNumbers.includes(n)) { setCallError("Number already called"); return; }
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
        <Button onClick={() => router.push("/")} className="w-48">Play Again</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 p-4 dark:bg-zinc-950 lg:flex-row lg:gap-6 lg:p-8">
      <div className="flex flex-col items-center gap-6 flex-1">
        <div className="flex items-center justify-between w-full max-w-xs">
          <h1 className="text-xl font-bold">Room: {code}</h1>
          <StrikeTracker count={myStrikes} />
        </div>
        <Grid grid={state.myGrid} calledNumbers={calledSet} />
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              max={25}
              placeholder="Call a number (1–25)"
              value={inputNumber}
              onChange={(e) => { setInputNumber(e.target.value); setCallError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleCallNumber()}
            />
            <Button onClick={handleCallNumber} disabled={!inputNumber}>Call</Button>
          </div>
          {callError && <p className="text-xs text-red-500">{callError}</p>}
        </div>
        <CalledNumbers numbers={state.calledNumbers} />
      </div>
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

## Task 17: TypeScript check and smoke test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Expected: starts on `http://localhost:3000` with no build errors.

- [ ] **Step 2: Visit sign-in**

Open `http://localhost:3000/sign-in`. Verify the Google button renders with no console errors.

- [ ] **Step 3: Verify auth redirect**

Visit `http://localhost:3000/room/ABC123/lobby` without a session. Verify it redirects to Auth0 login.

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "chore: final type check and lint pass"
```
