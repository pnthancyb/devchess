
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, Target, Crown, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface AIModelSelectorProps {
  currentModel: string;
  currentDifficulty: number;
  onModelChange: (model: string) => void;
  onDifficultyChange: (difficulty: number) => void;
}

const AI_MODELS = [
  {
    id: "stockfish-16",
    name: "Stockfish 16",
    description: "World's strongest chess engine with 10 difficulty levels",
    icon: Crown,
    maxDifficulty: 10,
    color: "text-purple-600",
    category: "Engine"
  },
  {
    id: "llama3-70b-8192",
    name: "Llama 3 70B",
    description: "Advanced reasoning and human-like strategy",
    icon: Brain,
    maxDifficulty: 5,
    color: "text-blue-600",
    category: "AI Model"
  },
  {
    id: "llama3-8b-8192",
    name: "Llama 3 8B",
    description: "Fast and efficient creative play",
    icon: Zap,
    maxDifficulty: 5,
    color: "text-green-600",
    category: "AI Model"
  },
  {
    id: "mixtral-8x7b-32768",
    name: "Mixtral 8x7B",
    description: "Creative tactical and positional play",
    icon: Sparkles,
    maxDifficulty: 5,
    color: "text-orange-600",
    category: "AI Model"
  },
  {
    id: "gemma-7b-it",
    name: "Gemma 7B",
    description: "Balanced and instructive gameplay",
    icon: Target,
    maxDifficulty: 5,
    color: "text-indigo-600",
    category: "AI Model"
  }
];

const DIFFICULTY_LABELS = {
  1: { label: "Beginner", description: "Random moves, perfect for learning", color: "bg-green-100 text-green-800" },
  2: { label: "Casual", description: "Avoids obvious mistakes", color: "bg-green-100 text-green-800" },
  3: { label: "Amateur", description: "Basic tactical awareness", color: "bg-blue-100 text-blue-800" },
  4: { label: "Club Player", description: "Good positional understanding", color: "bg-blue-100 text-blue-800" },
  5: { label: "Expert", description: "Strong tactical play", color: "bg-yellow-100 text-yellow-800" },
  6: { label: "Candidate Master", description: "Advanced strategic thinking", color: "bg-orange-100 text-orange-800" },
  7: { label: "Master", description: "Deep positional understanding", color: "bg-red-100 text-red-800" },
  8: { label: "Grandmaster", description: "Near-perfect calculation", color: "bg-purple-100 text-purple-800" },
  9: { label: "Super-GM", description: "World championship level", color: "bg-gray-100 text-gray-800" },
  10: { label: "Engine", description: "Maximum strength", color: "bg-black text-white" }
};

export function AIModelSelector({ 
  currentModel, 
  currentDifficulty, 
  onModelChange, 
  onDifficultyChange 
}: AIModelSelectorProps) {
  const { t } = useI18n();
  
  const selectedModel = AI_MODELS.find(model => model.id === currentModel) || AI_MODELS[0];
  const maxDifficulty = selectedModel.maxDifficulty;
  
  // Ensure difficulty is within bounds and properly adjusted
  const adjustedDifficulty = Math.max(1, Math.min(currentDifficulty, maxDifficulty));
  
  // Update parent if adjustment was needed
  if (adjustedDifficulty !== currentDifficulty) {
    onDifficultyChange(adjustedDifficulty);
  }
  
  const difficultyInfo = DIFFICULTY_LABELS[adjustedDifficulty as keyof typeof DIFFICULTY_LABELS];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="w-5 h-5 mr-2 text-primary" />
          {t('ai.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('ai.model')}</label>
          <Select value={currentModel} onValueChange={onModelChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((model) => {
                const Icon = model.icon;
                return (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center space-x-2">
                      <Icon className={`w-4 h-4 ${model.color}`} />
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {model.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Difficulty Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t('ai.difficulty')}</label>
            <Badge className={difficultyInfo.color}>
              Level {adjustedDifficulty}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Slider
              value={[adjustedDifficulty]}
              onValueChange={(value) => onDifficultyChange(value[0])}
              max={maxDifficulty}
              min={1}
              step={1}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Beginner</span>
              <span>{maxDifficulty === 10 ? "Engine" : "Expert"}</span>
            </div>
          </div>

          {/* Difficulty Info */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">{difficultyInfo.label}</span>
              <Badge variant="outline" className="text-xs">
                {selectedModel.name}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {difficultyInfo.description}
            </p>
          </div>

          {/* Model-specific info */}
          {currentModel === 'stockfish-16' && (
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-xs">
              <strong>Stockfish 16:</strong> World's strongest chess engine with extended difficulty levels (1-10).
              Levels 8-10 represent superhuman strength.
            </div>
          )}
          
          {currentModel !== 'stockfish-16' && (
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
              <strong>AI Models:</strong> Human-like creative chess with natural playing styles.
              Levels 1-5 offer balanced gameplay without engine-level calculation.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
