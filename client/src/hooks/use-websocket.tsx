import { useEffect, useRef, useState, useCallback } from "react";
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
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "disconnected">("disconnected");

  useEffect(() => {
    // WebSocket completely disabled to prevent connection errors
    setConnectionState("disconnected");
    setSocket(null);
    console.log("WebSocket disabled - using local API mode only");
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    // WebSocket disabled - all functionality is local via REST API
    console.log("WebSocket message ignored (using local mode):", message);
    return;
  }, []);

  return {
    socket: null,
    sendMessage,
    lastMessage: null,
    connectionState: "disconnected" as const,
  };
}