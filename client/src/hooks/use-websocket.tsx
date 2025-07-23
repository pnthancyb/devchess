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
  const {
    onMessage,
    onConnect,
    onDisconnect,
    autoReconnect = false,
    reconnectDelay = 5000,
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const connectingRef = useRef(false);

  useEffect(() => {
    // Disable WebSocket connections to prevent errors
    // All functionality works locally without WebSocket
    setConnectionState("disconnected");
    onDisconnect?.();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

      }, [onDisconnect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    // Local gameplay - no WebSocket needed
    console.log("Message would be sent:", message);
  }, []);

  return {
    socket,
    sendMessage,
    lastMessage,
    connectionState,
  };
}