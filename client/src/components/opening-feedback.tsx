import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, BookOpen, Target, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { ChessMove } from "@/types/chess";

interface OpeningFeedbackProps {
  moves: ChessMove[];
  currentFen: string;
  targetOpening?: {
    name: string;
    moves: string[];
    description: string;
  };
}

export function OpeningFeedback({ moves, currentFen, targetOpening }: OpeningFeedbackProps) {
  const { t } = useI18n();

  // Convert moves to string format for comparison
  const moveStrings = moves.map(move => {
    if (typeof move === 'string') return move;
    if (move && typeof move === 'object' && 'san' in move) return move.san;
    return '';
  }).filter(Boolean);

  const progress = targetOpening ? 
    Math.min(moveStrings.length, targetOpening.moves.length) / targetOpening.moves.length * 100 : 0;

  const isComplete = targetOpening && moveStrings.length >= targetOpening.moves.length;
  const isOnTrack = targetOpening && moveStrings.every((move, index) => 
    index < targetOpening.moves.length && move === targetOpening.moves[index]
  );

  if (!targetOpening) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
            {t('opening.feedback')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {t('opening.selectToStart')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isComplete ? "border-green-200 bg-green-50 dark:bg-green-900/20" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
            {targetOpening.name}
          </div>
          <Badge variant={isOnTrack ? "default" : "secondary"}>
            {Math.round(progress)}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t('opening.progress')}</span>
            <span>{moveStrings.length}/{targetOpening.moves.length}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isOnTrack ? 'bg-green-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Move comparison */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">{t('opening.moves')}</h4>
          <div className="grid grid-cols-1 gap-1 text-xs">
            {targetOpening.moves.map((expectedMove, index) => {
              const playerMove = moveStrings[index];
              const isCorrect = playerMove === expectedMove;
              const isCurrent = index === moveStrings.length;

              return (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-2 rounded ${
                    isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200' :
                    isCorrect ? 'bg-green-50 dark:bg-green-900/20' :
                    playerMove ? 'bg-red-50 dark:bg-red-900/20' :
                    'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-mono w-6">
                      {Math.floor(index / 2) + 1}{index % 2 === 0 ? '.' : '...'}
                    </span>
                    <span className="font-mono">
                      {expectedMove}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {playerMove && (
                      <>
                        {isCorrect ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        {!isCorrect && (
                          <span className="font-mono text-red-600 dark:text-red-400">
                            {playerMove}
                          </span>
                        )}
                      </>
                    )}
                    {isCurrent && (
                      <Target className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status message */}
        {isComplete ? (
          <div className="flex items-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                {t('opening.completed')}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {t('opening.wellDone')}
              </p>
            </div>
          </div>
        ) : isOnTrack ? (
          <div className="flex items-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">
                {t('opening.onTrack')}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t('opening.nextMove')}: {targetOpening.moves[moveStrings.length]}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <XCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                {t('opening.deviation')}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {t('opening.expectedMove')}: {targetOpening.moves[moveStrings.length - 1]}
              </p>
            </div>
          </div>
        )}

        {/* Opening description */}
        <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
          {targetOpening.description}
        </div>
      </CardContent>
    </Card>
  );
}