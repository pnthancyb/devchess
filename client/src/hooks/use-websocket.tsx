import { useCallback } from "react";
import type { WebSocketMessage } from "@/types/chess";

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

interface UseWebSocketReturn {
  socket: WebSocket | null;
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  connectionState: "connecting" | "connected" | "disconnected";
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const sendMessage = useCallback((message: WebSocketMessage) => {
    // WebSocket disabled - all functionality is local via REST API
    return;
  }, []);

  return {
    socket: null,
    sendMessage,
    lastMessage: null,
    connectionState: "disconnected" as const,
  };
}