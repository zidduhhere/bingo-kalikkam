"use client";
import { useEffect, useRef, useCallback } from "react";
import { insforge } from "@/lib/insforge";

export type RealtimeHandler = (payload: Record<string, unknown>) => void;

interface UseRealtimeOptions {
  roomCode: string;
  onEvent: (event: string, payload: Record<string, unknown>) => void;
  enabled: boolean;
}

/**
 * Connects to InsForge Realtime and subscribes to the bingo:<roomCode> channel.
 * Exposes a `publish` function to broadcast typed game events to all room members.
 */
export function useRealtime({ roomCode, onEvent, enabled }: UseRealtimeOptions) {
  const channel = roomCode ? `bingo:${roomCode}` : null;
  const onEventRef = useRef(onEvent);
  const connectedRef = useRef(false);
  const subscribedChannel = useRef<string | null>(null);

  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    if (!channel || !enabled) return;

    let cancelled = false;

    async function setup() {
      if (!channel) return;

      // Connect once
      if (!connectedRef.current) {
        await insforge.realtime.connect();
        connectedRef.current = true;
      }

      if (cancelled) return;

      // Unsubscribe from previous channel if changed
      if (subscribedChannel.current && subscribedChannel.current !== channel) {
        await insforge.realtime.unsubscribe(subscribedChannel.current);
        subscribedChannel.current = null;
      }

      if (!subscribedChannel.current) {
        const response = await insforge.realtime.subscribe(channel);
        if (!response.ok) {
          console.error("[Realtime] subscribe failed:", response.error);
          return;
        }
        subscribedChannel.current = channel;
      }
    }

    setup();

    // Generic event router — InsForge fires events by name, we forward all of them
    const GAME_EVENTS = [
      "ROOM_CREATED",
      "PLAYER_JOINED",
      "PLAYER_LEFT",
      "GAME_STARTED",
      "GAME_START_PLAYING",
      "NUMBER_CALLED",
      "STRIKE",
      "PLAYER_WON",
      "GAME_OVER",
      "GAME_OVER_GRIDS",
      "DIFFICULTY_CHANGED",
      "PLAY_AGAIN_REQUESTED",
      "GAME_RESET",
      "ERROR",
    ] as const;

    const handlers = GAME_EVENTS.map((event) => {
      const handler = (payload: Record<string, unknown>) => {
        onEventRef.current(event, payload);
      };
      insforge.realtime.on(event, handler);
      return { event, handler };
    });

    insforge.realtime.on("error", ({ code, message }: { channel: string; code: string; message: string }) => {
      console.error("[Realtime] error:", code, message);
    });

    return () => {
      cancelled = true;
      handlers.forEach(({ event, handler }) => {
        insforge.realtime.off(event, handler);
      });
    };
  }, [channel, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscribedChannel.current) {
        try { insforge.realtime.unsubscribe(subscribedChannel.current); } catch { /* ignore */ }
        subscribedChannel.current = null;
      }
      if (connectedRef.current) {
        insforge.realtime.disconnect();
        connectedRef.current = false;
      }
    };
  }, []);

  const publish = useCallback(
    async (event: string, payload: Record<string, unknown>, overrideChannel?: string) => {
      const targetChannel = overrideChannel || channel;
      if (!targetChannel) {
        console.warn("[Realtime] publish called before channel is set");
        return;
      }

      // Wait up to 2.5 seconds for the subscription to establish
      let retries = 0;
      while (subscribedChannel.current !== targetChannel && retries < 25) {
        await new Promise((r) => setTimeout(r, 100));
        retries++;
      }

      if (subscribedChannel.current !== targetChannel) {
        console.error("[Realtime] publish failed: channel not subscribed in time");
        return;
      }

      await insforge.realtime.publish(targetChannel, event, payload);
    },
    [channel]
  );

  return { publish };
}
