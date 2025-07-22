import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { GameMode } from "@/hooks/use-chess-game";

interface AIFeedbackProps {
  mode: GameMode;
  feedback?: string;
  score?: string;
  evaluation?: string;
  quality?: "good" | "neutral" | "bad";
}

export function AIFeedback({ mode, feedback, score, evaluation, quality = "neutral" }: AIFeedbackProps) {
  const { t } = useI18n();

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "good":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
      case "bad":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800";
    }
  };

  const getQualityText = (quality: string) => {
    switch (quality) {
      case "good":
        return "Good";
      case "bad":
        return "Inaccurate";
      default:
        return "Neutral";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Lightbulb className="w-5 h-5 mr-2 text-primary" />
          {t("ai.analysis")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === "feedback" && feedback && (
          <div className={`feedback-card feedback-${quality}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t("last.move.analysis")}</span>
              <Badge variant="outline" className={getQualityColor(quality)}>
                {getQualityText(quality)}
              </Badge>
            </div>
            <p className="text-sm text-foreground">{feedback}</p>
          </div>
        )}

        {mode === "scoring" && (score || feedback) && (
          <div className={`feedback-card feedback-${quality}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t("move.score")}</span>
              {score && (
                <span className="text-lg font-bold flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {score}
                </span>
              )}
            </div>
            {feedback && <p className="text-sm text-foreground">{feedback}</p>}
          </div>
        )}

        {mode === "classic" && (
          <div className="feedback-card feedback-neutral">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Game Status</span>
              <Badge variant="outline" className={getQualityColor("neutral")}>
                Playing
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Playing against AI in classic mode. Make your moves to continue the game.
            </p>
          </div>
        )}

        {mode === "coach" && (
          <div className="feedback-card feedback-good">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Coach Available</span>
              <Badge variant="outline" className={getQualityColor("good")}>
                Ready
              </Badge>
            </div>
            <p className="text-sm text-foreground">
              Your AI coach is ready to help. Use the chat below to ask questions about the position or general chess strategy.
            </p>
          </div>
        )}

        {!feedback && mode !== "classic" && mode !== "coach" && (
          <div className="text-center text-muted-foreground py-8">
            <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Make a move to get AI analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
