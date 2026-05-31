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
  const connectRef = useRef<() => void>(() => {});

  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    const connect = () => {
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
        reconnectRef.current = setTimeout(() => connectRef.current(), 3000);
      };
      ws.onerror = (err) => console.error("WebSocket error", err);
    };
    connectRef.current = connect;
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [url]);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.warn("WebSocket not open, message dropped:", msg);
    }
  }, []);

  return { send };
}
