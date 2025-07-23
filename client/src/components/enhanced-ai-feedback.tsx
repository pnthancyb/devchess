import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Equal, Target, Brain, Star } from "lucide-react";
// Enhanced AI Feedback Component

interface EnhancedAIFeedbackProps {
  lastMove?: any;
  currentPosition?: string;
  aiModel: string;
  gameMode: string;
}

export function EnhancedAIFeedback({ lastMove, currentPosition, aiModel, gameMode }: EnhancedAIFeedbackProps) {
  if (!lastMove?.analysis) return null;

  const { score, quality, reasoning, bestMove, alternatives } = lastMove.analysis;
  
  // Convert centipawn score to visual indicators
  const getScoreColor = (score: number) => {
    if (score > 100) return "text-green-600";
    if (score > 50) return "text-green-500";
    if (score > -50) return "text-yellow-600";
    if (score > -100) return "text-orange-600";
    return "text-red-600";
  };

  const getQualityBadge = (quality: string) => {
    const qualityConfig = {
      excellent: { color: "bg-green-100 text-green-800", icon: Star },
      good: { color: "bg-blue-100 text-blue-800", icon: TrendingUp },
      inaccuracy: { color: "bg-yellow-100 text-yellow-800", icon: Equal },
      mistake: { color: "bg-orange-100 text-orange-800", icon: TrendingDown },
      blunder: { color: "bg-red-100 text-red-800", icon: TrendingDown }
    };
    
    const config = qualityConfig[quality as keyof typeof qualityConfig] || qualityConfig.good;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {quality.charAt(0).toUpperCase() + quality.slice(1)}
      </Badge>
    );
  };

  const scorePercentage = Math.max(0, Math.min(100, (score + 500) / 10));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="w-4 h-4 mr-2 text-purple-600" />
            AI Analysis
          </div>
          {getQualityBadge(quality)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Move Evaluation */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Position Evaluation</span>
            <span className={`text-sm font-bold ${getScoreColor(score)}`}>
              {score > 0 ? '+' : ''}{(score / 100).toFixed(2)}
            </span>
          </div>
          <Progress value={scorePercentage} className="h-2" />
          <div className="text-xs text-muted-foreground text-center">
            {score > 200 ? "White is winning" : 
             score > 50 ? "White is better" : 
             score > -50 ? "Equal position" : 
             score > -200 ? "Black is better" : "Black is winning"}
          </div>
        </div>

        {/* AI Reasoning */}
        {reasoning && (
          <div className="space-y-2">
            <div className="flex items-center">
              <Target className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-sm font-medium">Analysis</span>
            </div>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              {reasoning}
            </p>
          </div>
        )}

        {/* Best Move Suggestion */}
        {bestMove && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Suggested Move</div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="font-mono text-sm font-bold text-green-800 dark:text-green-300">
                {bestMove}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                {aiModel === 'stockfish-16' ? 'Engine recommendation' : 'AI suggestion'}
              </div>
            </div>
          </div>
        )}

        {/* Alternative Moves */}
        {alternatives && alternatives.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Alternative Moves</div>
            <div className="space-y-1">
              {alternatives.slice(0, 3).map((alt, index) => (
                <div key={index} className="flex justify-between items-center bg-muted p-2 rounded text-xs">
                  <span className="font-mono">{alt.move}</span>
                  <span className="text-muted-foreground">
                    {alt.score > 0 ? '+' : ''}{(alt.score / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Model Info */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Analyzed by {aiModel === 'stockfish-16' ? 'Stockfish 16' : aiModel} in {gameMode} mode
        </div>
      </CardContent>
    </Card>
  );
}