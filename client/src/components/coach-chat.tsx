
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
      message: t("coach.welcome") || "Hello! I'm your AI chess coach. I can help you analyze positions, suggest moves, explain tactics, and answer any chess questions you have. What would you like to work on?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Use external messages if provided, otherwise use local messages
  const messages = externalMessages || localMessages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

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

  // Intelligent fallback coach responses with internationalization
  const generateCoachResponse = (userMessage: string, position?: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('opening') || message.includes(t("opening").toLowerCase())) {
      return t("coach.opening.advice") || "Great question about openings! Focus on controlling the center squares (e4, e5, d4, d5), develop your knights before bishops, castle early for king safety, and don't move the same piece twice in the opening. Popular openings like 1.e4 or 1.d4 are excellent starting points.";
    }
    
    if (message.includes('tactics') || message.includes('combination')) {
      return t("coach.tactics.advice") || "Chess tactics are crucial! Look for common patterns: pins (attacking through one piece to hit a more valuable one), forks (attacking two pieces at once), skewers (forcing a valuable piece to move and capturing what's behind), and discovered attacks. Practice tactical puzzles daily to improve pattern recognition.";
    }
    
    if (message.includes('endgame') || message.includes('ending')) {
      return t("coach.endgame.advice") || "Endgames are where games are won! Key principles: activate your king (it becomes a strong piece), push passed pawns, centralize your pieces, and learn basic checkmate patterns. King and queen vs king, king and rook vs king, and pawn endgames are essential to master.";
    }
    
    if (message.includes('position') || message.includes('analyze')) {
      return t("coach.position.advice") || "When analyzing positions, ask: Who controls the center? Which king is safer? Who has better piece activity? Are there tactical opportunities? Think about pawn structure and piece coordination. In this position, focus on improving your worst-placed piece and look for tactical shots.";
    }
    
    if (message.includes('mistake') || message.includes('blunder')) {
      return t("coach.mistake.advice") || "Don't worry about mistakes - they're how we learn! Before each move, ask: Is my king safe? Am I leaving pieces undefended? Does this move improve my position? Take your time, calculate forcing moves (checks, captures, threats), and trust your preparation.";
    }
    
    if (message.includes('improve') || message.includes('better')) {
      return t("coach.improve.advice") || "To improve at chess: 1) Solve tactical puzzles daily, 2) Study master games in your favorite openings, 3) Play regularly and analyze your games, 4) Learn basic endgames, 5) Read chess books or watch instructional videos. Consistency beats intensity!";
    }
    
    // Default responses based on context with language support
    const responses = [
      t("coach.default.1") || "Excellent question! In chess, every move should have a purpose. Consider: does this move improve your position, defend against threats, or create opportunities?",
      t("coach.default.2") || "That's a thoughtful observation. Remember the three key phases: opening (develop and control center), middlegame (execute plans and tactics), endgame (utilize king and push pawns).",
      t("coach.default.3") || "Good thinking! Always look for forcing moves first - checks, captures, and threats. Then consider positional improvements like piece development and pawn structure.",
      t("coach.default.4") || "I like your approach! Chess improvement comes from pattern recognition. The more positions you study, the faster you'll recognize similar patterns in your games.",
      t("coach.default.5") || "Great point! Remember that chess is about creating and exploiting weaknesses. Look for loose pieces, weak squares, and pawn weaknesses in your opponent's position."
    ];
    
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
    <Card className="flex flex-col h-[520px] shadow-lg">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          {t("coach.chat.title") || "AI Coach Chat"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("coach.chat.subtitle") || "Get personalized chess guidance and analysis"}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 p-0">
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-2">
          <div className="space-y-4 pb-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-[85%] ${
                    msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  }`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground border'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.message}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-3 border">
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
        <div className="border-t p-4 bg-card">
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t("coach.chat.placeholder") || "Ask about tactics, strategy, this position..."}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !inputMessage.trim()}
              size="default"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {t("coach.chat.help") || "Press Enter to send • Ask about the current position or general chess advice"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
