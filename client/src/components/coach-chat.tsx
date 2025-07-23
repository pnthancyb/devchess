
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Bot, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  message: string;
  timestamp: Date;
}

interface CoachChatProps {
  currentPosition?: string;
  gameMode?: string;
  isVisible?: boolean;
  aiModel?: string;
  messages?: ChatMessage[];
  onSendMessage?: (message: string) => void;
  currentFen?: string;
}

export function CoachChat({ 
  currentPosition, 
  gameMode = "coach", 
  isVisible = true, 
  aiModel = "llama3-70b-8192",
  messages: externalMessages,
  onSendMessage,
  currentFen
}: CoachChatProps) {
  const { t } = useI18n();
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      message: t("coach.welcome") || "💡 Welcome! I'm your AI chess coach. I analyze positions live and provide tips based on your current game situation. Ask me about tactics, strategy, or specific moves!",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use external messages if provided, otherwise use local messages
  const messages = externalMessages || localMessages;

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    
    // Also ensure the scroll area is at the bottom
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 100);
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-scroll when new messages arrive with slight delay
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 150);
    
    return () => clearTimeout(timer);
  }, [messages.length]);

  // Focus input after sending message
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message: inputMessage,
      timestamp: new Date()
    };

    // Use external message handler if available
    if (onSendMessage) {
      onSendMessage(inputMessage);
      setInputMessage('');
      return;
    }

    // Fallback to local message handling
    setLocalMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send request to AI coach with current position context
      const response = await fetch('/api/chess/coach-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          fen: currentFen || currentPosition || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          model: aiModel,
          gameMode: gameMode,
          gameId: 1
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          message: data.response || generateCoachResponse(currentInput, currentFen || currentPosition),
          timestamp: new Date()
        };
        setLocalMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Coach API failed');
      }
    } catch (error) {
      console.error('Coach chat error:', error);
      // Fallback response system
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        message: generateCoachResponse(currentInput, currentFen || currentPosition),
        timestamp: new Date()
      };
      setLocalMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced fallback coach responses with live position analysis
  const generateCoachResponse = (userMessage: string, position?: string): string => {
    const message = userMessage.toLowerCase();
    const fen = position || currentFen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    
    // Try to determine game phase from FEN
    const moveCount = fen.split(' ')[5] ? parseInt(fen.split(' ')[5]) : 1;
    const gamePhase = moveCount <= 10 ? "opening" : moveCount <= 25 ? "middlegame" : "endgame";
    
    if (message.includes('opening') || message.includes(t("opening").toLowerCase())) {
      return `💡 TIP: ${t("coach.opening.advice") || `In this ${gamePhase}, focus on controlling center squares (e4, e5, d4, d5), develop knights before bishops, castle early for king safety, and avoid moving the same piece twice. What's your opening strategy?`}`;
    }
    
    if (message.includes('tactics') || message.includes('combination')) {
      return `💡 TIP: ${t("coach.tactics.advice") || "Look for tactical patterns in your current position: pins, forks, skewers, and discovered attacks. Can you spot any loose pieces or weak squares to exploit right now?"}`;
    }
    
    if (message.includes('endgame') || message.includes('ending')) {
      return `💡 TIP: ${t("coach.endgame.advice") || `In ${gamePhase} positions like this, activate your king, push passed pawns, and centralize pieces. King activity becomes crucial - is your king helping or hiding?`}`;
    }
    
    if (message.includes('position') || message.includes('analyze')) {
      return `💡 TIP: ${t("coach.position.advice") || `Analyzing this ${gamePhase} position: Check king safety, piece activity, center control, and pawn structure. What's your biggest concern in the current position?`}`;
    }
    
    if (message.includes('mistake') || message.includes('blunder') || message.includes('why')) {
      return `💡 TIP: ${t("coach.mistake.advice") || "Understanding your moves is key to improvement! Before each move ask: Is my king safe? Are pieces defended? Does this improve my position? What was your reasoning for the last move?"}`;
    }
    
    if (message.includes('improve') || message.includes('better')) {
      return `💡 TIP: ${t("coach.improve.advice") || `To improve from this ${gamePhase}: Study similar positions, practice tactics daily, analyze your games, and focus on one aspect at a time. What area do you want to work on most?`}`;
    }
    
    // Context-aware responses based on game phase
    const phaseResponses = {
      opening: [
        `💡 TIP: In this opening position, prioritize development and center control. What's your next development move?`,
        `💡 TIP: Early game focus: Castle quickly, develop with purpose, and control central squares. How's your king safety?`,
        `💡 TIP: Opening principles apply here - develop pieces toward the center and prepare castling. Which piece needs attention?`
      ],
      middlegame: [
        `💡 TIP: Middlegame tactics time! Look for pins, forks, and weak pieces. Do you see any tactical opportunities?`,
        `💡 TIP: In this complex position, improve your worst piece and look for pawn breaks. What's your strategic plan?`,
        `💡 TIP: Middlegame mastery: Coordinate pieces, create threats, and exploit weaknesses. What's your biggest advantage?`
      ],
      endgame: [
        `💡 TIP: Endgame precision! Activate your king, push passed pawns, and calculate precisely. Every move counts now!`,
        `💡 TIP: In this endgame, piece activity trumps material. Is your king helping the cause?`,
        `💡 TIP: Endgame keys: King activity, pawn promotion, and opposition. What's your winning plan?`
      ]
    };
    
    const responses = phaseResponses[gamePhase as keyof typeof phaseResponses] || phaseResponses.middlegame;
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="flex flex-col h-[600px] shadow-lg border-2">
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardTitle className="flex items-center text-lg">
          <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
          {t("coach.chat.title") || "AI Chess Coach"}
          <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
            LIVE
          </span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("coach.chat.subtitle") || "Live position analysis • Tips • Move explanations"}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 p-0">
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-3" style={{ maxHeight: 'calc(600px - 200px)' }}>
          <div className="space-y-4 pb-4 min-h-full">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-start space-x-3 max-w-[88%] ${
                    msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 dark:from-blue-900/40 dark:to-indigo-900/40 dark:text-blue-300 shadow-md'
                  }`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`rounded-xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white dark:bg-gray-800 text-foreground border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{msg.message}</div>
                    <div className={`text-xs mt-2 ${
                      msg.sender === 'user' ? 'opacity-70' : 'opacity-60'
                    }`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 dark:from-blue-900/40 dark:to-indigo-900/40 dark:text-blue-300 flex items-center justify-center shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="border-t p-4 bg-white dark:bg-gray-900/50">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t("coach.chat.placeholder") || "Ask about this position, tactics, or why you should make a move..."}
              disabled={isLoading}
              className="flex-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !inputMessage.trim()}
              size="default"
              className="rounded-lg shadow-sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {t("coach.chat.help") || "💡 Get live tips • Press Enter to send • Ask 'Why should I move here?'"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
