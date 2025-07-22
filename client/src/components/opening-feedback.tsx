
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight, RotateCcw, CheckCircle, Target, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { ChessOpening, OpeningLearningState } from "@/types/chess";
import { useEffect, useRef } from "react";

interface OpeningFeedbackProps {
  opening: ChessOpening;
  learningState: OpeningLearningState;
  onReset?: () => void;
}

export function OpeningFeedback({ opening, learningState, onReset }: OpeningFeedbackProps) {
  const { t } = useI18n();
  const contentRef = useRef<HTMLDivElement>(null);

  const progress = (learningState.currentMoveIndex / opening.moves.length) * 100;
  const isComplete = learningState.currentMoveIndex >= opening.moves.length;
  const currentMove = opening.moves[learningState.currentMoveIndex];
  const remainingMoves = opening.moves.slice(learningState.currentMoveIndex);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  }, [learningState.currentMoveIndex, isComplete]);

  if (isComplete) {
    return (
      <Card className="max-h-[70vh] flex flex-col border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardContent className="p-6 text-center space-y-4" ref={contentRef}>
          <div className="space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
                Opening Mastered! 🎉
              </h3>
              <p className="text-green-600 dark:text-green-300 mb-4">
                Congratulations! You've successfully learned the <strong>{opening.name}</strong> opening.
              </p>
            </div>

            {/* Completion Stats */}
            <div className="bg-white dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <Target className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <div className="font-semibold">{opening.moves.length}</div>
                  <div className="text-green-600 dark:text-green-400">Moves Learned</div>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <div className="font-semibold">100%</div>
                  <div className="text-green-600 dark:text-green-400">Complete</div>
                </div>
              </div>
            </div>

            {/* Move Sequence Review */}
            <div className="bg-white dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-700">
              <h4 className="font-semibold mb-3 text-green-700 dark:text-green-300">Complete Sequence:</h4>
              <div className="flex flex-wrap gap-1 justify-center">
                {opening.moves.map((move, index) => (
                  <Badge key={index} variant="secondary" className="text-xs font-mono bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                    {index + 1}. {move}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Opening Description */}
            <div className="bg-white dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-700">
              <h4 className="font-semibold mb-2 text-green-700 dark:text-green-300">About this Opening:</h4>
              <p className="text-sm text-green-600 dark:text-green-400 leading-relaxed">
                {opening.description}
              </p>
            </div>

            {/* Actions */}
            {onReset && (
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  onClick={onReset} 
                  className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Practice Again
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-h-[70vh] flex flex-col">
      <CardHeader className="flex-shrink-0 pb-4">
        <CardTitle className="flex items-center text-lg">
          <BookOpen className="w-5 h-5 mr-2 text-chess-gold" />
          Learning: {opening.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 overflow-y-auto flex-1" ref={contentRef}>
        {/* Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {learningState.currentMoveIndex}/{opening.moves.length} moves
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Next Move to Learn */}
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <ArrowRight className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-primary">Next Move:</h4>
          </div>
          {currentMove ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Badge variant="default" className="font-mono text-base px-3 py-1">
                  {currentMove}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Move {learningState.currentMoveIndex + 1}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Make this move on the board to continue learning the opening.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No more moves to learn!
            </p>
          )}
        </div>

        {/* Completed Moves */}
        {learningState.completedMoves.length > 0 && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Completed Moves:
            </h4>
            <div className="flex flex-wrap gap-1">
              {learningState.completedMoves.map((move, index) => (
                <Badge key={index} variant="secondary" className="text-xs font-mono bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                  {index + 1}. {move}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Remaining Moves Preview */}
        {remainingMoves.length > 1 && (
          <div className="p-4 bg-background border rounded-lg">
            <h4 className="font-semibold mb-2 text-sm flex items-center">
              <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
              Upcoming Moves:
            </h4>
            <div className="flex flex-wrap gap-1">
              {remainingMoves.slice(1, 4).map((move, index) => (
                <Badge key={index} variant="outline" className="text-xs font-mono">
                  {learningState.currentMoveIndex + index + 2}. {move}
                </Badge>
              ))}
              {remainingMoves.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{remainingMoves.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Opening Description */}
        <div className="p-3 bg-background border rounded-lg">
          <h4 className="font-semibold mb-1 text-sm">About this Opening:</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {opening.description}
          </p>
        </div>

        {/* Actions */}
        {onReset && (
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={onReset} className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
