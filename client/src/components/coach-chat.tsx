import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import type { ChatMessage } from "@shared/schema";

interface CoachChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onReceiveMessage?: (message: string) => void;
  isVisible: boolean;
  currentFen?: string;
  aiModel?: string;
}

export function CoachChat({ messages, onSendMessage, onReceiveMessage, isVisible, currentFen, aiModel = "llama3-70b-8192" }: CoachChatProps) {
  const { t } = useI18n();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (inputValue.trim()) {
      const userMessage = inputValue.trim();
      setInputValue("");
      setIsLoading(true);

      try {
        console.log("Sending coach message:", userMessage);
        const response = await apiRequest("/api/chess/coach-response", "POST", {
          message: userMessage,
          fen: currentFen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          model: aiModel,
          gameId: Date.now().toString()
        });

        console.log("Coach response received:", response);

        if (response && response.response) {
          // Add user message first
          if (onSendMessage) {
            onSendMessage(userMessage);
          }
          // Then add AI response  
          if (onReceiveMessage) {
            onReceiveMessage(response.response);
          }
        } else {
          console.error("Invalid coach response:", response);
          if (onReceiveMessage) {
            onReceiveMessage("Sorry, I didn't receive a proper response. Please try again!");
          }
        }
      } catch (error) {
        console.error("Failed to get coach response:", error);
        if (onReceiveMessage) {
          onReceiveMessage("Sorry, I'm having trouble responding right now. Please try again!");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isVisible) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <MessageSquare className="w-5 h-5 mr-2 text-chess-gold" />
          {t("chess.coach")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80 bg-muted rounded-lg p-4 mb-4">
          <div className="space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Start a conversation with your AI coach!</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.sender === "ai" && (
                  <div className="w-8 h-8 gradient-chess-gold rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    AI
                  </div>
                )}
                
                <div
                  className={`max-w-xs rounded-lg p-3 shadow-sm ${
                    message.sender === "user"
                      ? "chat-message-user"
                      : "chat-message-ai"
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                
                {message.sender === "user" && (
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    Y
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t("ask.coach")}
            className="flex-1"
          />
          <Button onClick={handleSend} size="sm" disabled={!inputValue.trim() || isLoading}>
            <Send className="w-4 h-4" />
            {isLoading && <div className="ml-2 w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
