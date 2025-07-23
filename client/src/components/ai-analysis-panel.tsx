import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { GameMode } from "@/types/chess";

interface AIAnalysisPanelProps {
  mode: GameMode;
  feedback?: string;
  score?: string;
  evaluation?: string;
  quality?: "good" | "neutral" | "bad";
  lastMove?: {
    san: string;
    analysis?: {
      score?: number;
      quality?: string;
      feedback?: string;
      evaluation?: string;
    };
  };
}

export function AIAnalysisPanel({ 
  mode, 
  feedback, 
  score, 
  evaluation, 
  quality,
  lastMove 
}: AIAnalysisPanelProps) {
  const { t } = useI18n();

  // Enhanced analysis from last move
  const moveScore = lastMove?.analysis?.score ?? (score ? parseFloat(score) : 0);
  const moveQuality = lastMove?.analysis?.quality ?? quality ?? "neutral";
  const moveFeedback = lastMove?.analysis?.feedback ?? feedback;
  const positionEval = lastMove?.analysis?.evaluation ?? evaluation;

  const getQualityConfig = (quality: string) => {
    switch (quality) {
      case "excellent":
      case "good":
        return {
          icon: CheckCircle,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          borderColor: "border-green-200 dark:border-green-800",
          label: "Excellent Move"
        };
      case "inaccuracy":
      case "neutral":
        return {
          icon: Activity,
          color: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
          borderColor: "border-yellow-200 dark:border-yellow-800",
          label: "Decent Move"
        };
      case "mistake":
      case "bad":
        return {
          icon: AlertTriangle,
          color: "text-orange-600 dark:text-orange-400",
          bgColor: "bg-orange-50 dark:bg-orange-900/20",
          borderColor: "border-orange-200 dark:border-orange-800",
          label: "Questionable"
        };
      case "blunder":
        return {
          icon: TrendingDown,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          borderColor: "border-red-200 dark:border-red-800",
          label: "Blunder"
        };
      default:
        return {
          icon: Activity,
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          borderColor: "border-gray-200 dark:border-gray-800",
          label: "Analysis"
        };
    }
  };

  const qualityConfig = getQualityConfig(moveQuality);
  const QualityIcon = qualityConfig.icon;

  // Score visualization (convert to 0-100 scale)
  const normalizedScore = Math.max(0, Math.min(100, (moveScore + 5) * 10));
  
  // Evaluation meter (-10 to +10 scale)
  const evalNumber = positionEval ? parseFloat(positionEval.replace(/[^-\d.]/g, '')) : 0;
  const evalNormalized = Math.max(-10, Math.min(10, evalNumber));
  const evalPercentage = ((evalNormalized + 10) / 20) * 100;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-sm">
          <Target className="w-4 h-4 mr-2 text-primary" />
          AI Analysis & Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Last Move Quality */}
        {lastMove && (
          <div className={`p-3 rounded-lg border ${qualityConfig.bgColor} ${qualityConfig.borderColor}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <QualityIcon className={`w-4 h-4 mr-2 ${qualityConfig.color}`} />
                <span className="font-medium text-sm">{lastMove.san}</span>
              </div>
              <Badge variant="outline" className={qualityConfig.color}>
                {qualityConfig.label}
              </Badge>
            </div>
            {moveFeedback && (
              <p className="text-xs text-muted-foreground">{moveFeedback}</p>
            )}
          </div>
        )}

        {/* Move Score */}
        {moveScore !== 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Move Accuracy</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(normalizedScore)}%
              </span>
            </div>
            <Progress value={normalizedScore} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>
        )}

        <Separator />

        {/* Position Evaluation */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Position Evaluation</span>
            <div className="flex items-center">
              {evalNumber > 0 ? (
                <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
              ) : evalNumber < 0 ? (
                <TrendingDown className="w-3 h-3 mr-1 text-red-600" />
              ) : (
                <Activity className="w-3 h-3 mr-1 text-gray-600" />
              )}
              <span className="text-sm text-muted-foreground">
                {evalNumber > 0 ? `+${evalNumber.toFixed(1)}` : evalNumber.toFixed(1)}
              </span>
            </div>
          </div>
          
          <div className="relative">
            <Progress value={evalPercentage} className="h-3" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-0.5 h-4 bg-gray-800 dark:bg-gray-200 opacity-50"></div>
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Black advantage</span>
            <span>Equal</span>
            <span>White advantage</span>
          </div>
        </div>

        {/* Strategic Feedback */}
        {(feedback || moveFeedback) && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Strategic Analysis</span>
            <div className="p-2 bg-muted rounded text-xs leading-relaxed">
              {feedback || moveFeedback || "Play your move to get AI analysis..."}
            </div>
          </div>
        )}

        {/* Game Mode Context */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Mode: {mode === "classic" ? "Classic + Analysis" : mode}</span>
            <Badge variant="outline">
              Real-time
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}