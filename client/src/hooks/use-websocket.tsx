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
    autoReconnect = false, // Disable auto-reconnect to prevent loops
    reconnectDelay = 5000, // Increase delay
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const connectingRef = useRef(false);

  useEffect(() => {
    // Prevent multiple connection attempts
    if (connectingRef.current) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const connect = () => {
      if (connectingRef.current) return;

      connectingRef.current = true;
      setConnectionState("connecting");

      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        // Ensure we have a valid host and port
        const wsUrl = host ? `${protocol}//${host}/ws` : `ws://localhost:5000/ws`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("WebSocket connected");
          setConnectionState("connected");
          setSocket(ws);
          reconnectAttempts.current = 0;
          connectingRef.current = false;
          onConnect?.();

          // Join game session immediately after connection
          ws.send(JSON.stringify({
            type: "join_game",
            data: {
              userId: 1,
              language: "en",
              gameMode: "classic"
            }
          }));
        };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

        ws.onclose = (event) => {
          console.log("WebSocket disconnected", event.code, event.reason);
          setConnectionState("disconnected");
          setSocket(null);
          connectingRef.current = false;
          onDisconnect?.();

          // Only reconnect if it was an unexpected disconnection
          if (autoReconnect && reconnectAttempts.current < 3 && event.code !== 1000) {
            const delay = reconnectDelay * Math.pow(2, reconnectAttempts.current);
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current++;
              connect();
            }, delay);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setConnectionState("disconnected");
          connectingRef.current = false;
        };
      } catch (error) {
        console.error("Failed to create WebSocket:", error);
        setConnectionState("disconnected");
        connectingRef.current = false;
      }
    };

    connect();

    return () => {
      connectingRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(1000, "Component unmounting");
      }
    };
  }, [autoReconnect, reconnectDelay, onMessage, onConnect, onDisconnect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected");
    }
  }, [socket]);

  return {
    socket,
    sendMessage,
    lastMessage,
    connectionState,
  };
}