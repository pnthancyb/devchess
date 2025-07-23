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

export function useWebSocket(url?: string) {
  const [isConnected, setIsConnected] = useState(true); // Always show as connected for local mode
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const connect = useCallback(() => {
    // Disable WebSocket connections - use local mode only
    console.log("WebSocket disabled - using local mode");
    setIsConnected(true);
    return;
  }, []);

  const sendMessage = useCallback((message: any) => {
    // Local mode - no WebSocket sending needed
    console.log("Local mode - message not sent:", message);
    return true;
  }, []);

  const disconnect = useCallback(() => {
    // Local mode - no disconnection needed
    console.log("Local mode - disconnect called");
    return;
  }, []);

  useEffect(() => {
    // Local mode - no WebSocket connections
    setIsConnected(true);

    return () => {
      // Cleanup if needed
    };
  }, [url]);

  return {
    isConnected: true, // Always connected in local mode
    error: null,
    sendMessage,
    reconnect: () => console.log("Local mode - reconnect called"),
    disconnect: () => console.log("Local mode - disconnect called"),
  };
}