import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Cpu, Zap, Brain, Target } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export interface AIModel {
  id: string;
  name: string;
  description: string;
  strength: number;
  speed: "fast" | "medium" | "slow";
  type: "groq" | "stockfish";
}

const AI_MODELS: AIModel[] = [
  {
    id: "stockfish-16",
    name: "Stockfish Engine",
    description: "World's strongest chess engine",
    strength: 10,
    speed: "medium",
    type: "stockfish"
  },
  {
    id: "llama3-70b-8192",
    name: "Llama 3 70B",
    description: "Large language model for human-like play",
    strength: 7,
    speed: "fast",
    type: "groq"
  },
  {
    id: "llama3-8b-8192",
    name: "Llama 3 8B",
    description: "Faster, more creative play style",
    strength: 6,
    speed: "fast",
    type: "groq"
  },
  {
    id: "mixtral-8x7b-32768",
    name: "Mixtral 8x7B",
    description: "Balanced strategic play",
    strength: 7,
    speed: "medium",
    type: "groq"
  }
];

interface AIModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  difficulty: number;
  onDifficultyChange: (level: number) => void;
  className?: string;
}

export function AIModelSelector({ 
  selectedModel, 
  onModelChange, 
  difficulty, 
  onDifficultyChange,
  className = "" 
}: AIModelSelectorProps) {
  const { t } = useI18n();

  const currentModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];

  const getSpeedIcon = (speed: string) => {
    switch (speed) {
      case "fast": return <Zap className="w-3 h-3 text-green-500" />;
      case "medium": return <Target className="w-3 h-3 text-yellow-500" />;
      case "slow": return <Brain className="w-3 h-3 text-red-500" />;
      default: return <Cpu className="w-3 h-3" />;
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 9) return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
    if (strength >= 7) return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
    if (strength >= 5) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
    return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-sm font-medium">
          <Cpu className="w-4 h-4 mr-2" />
          AI Opponent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Model Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Model</label>
          <Select value={selectedModel} onValueChange={onModelChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center space-x-2 py-1">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">{model.name}</span>
                      {getSpeedIcon(model.speed)}
                    </div>
                    <Badge variant="outline" className={`text-xs ${getStrengthColor(model.strength)}`}>
                      {model.strength}/10
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{currentModel.description}</p>
        </div>

        {/* Difficulty Level */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Difficulty Level</label>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onDifficultyChange(Math.max(1, difficulty - 1))}
              disabled={difficulty <= 1}
            >
              -
            </Button>
            <div className="flex-1 text-center">
              <span className="text-sm font-medium">Level {difficulty}</span>
              <div className="flex justify-center space-x-1 mt-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`w-2 h-2 rounded-full ${
                      level <= difficulty
                        ? "bg-primary"
                        : "bg-muted-foreground/20"
                    }`}
                  />
                ))}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onDifficultyChange(Math.min(5, difficulty + 1))}
              disabled={difficulty >= 5}
            >
              +
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {difficulty === 1 && "Beginner - Makes some mistakes"}
            {difficulty === 2 && "Casual - Decent play with occasional blunders"}
            {difficulty === 3 && "Intermediate - Good tactical awareness"}
            {difficulty === 4 && "Advanced - Strong positional play"}
            {difficulty === 5 && "Expert - Near-perfect play"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}