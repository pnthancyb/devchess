import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight, RotateCcw, CheckCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { ChessOpening, OpeningLearningState } from "@/types/chess";

interface OpeningFeedbackProps {
  opening: ChessOpening;
  learningState: OpeningLearningState;
  onReset?: () => void;
}

export function OpeningFeedback({ opening, learningState, onReset }: OpeningFeedbackProps) {
  const { t } = useI18n();
  
  const progress = (learningState.currentMoveIndex / opening.moves.length) * 100;
  const isComplete = learningState.currentMoveIndex >= opening.moves.length;
  const currentMove = opening.moves[learningState.currentMoveIndex];
  const nextMove = opening.moves[learningState.currentMoveIndex + 1];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <BookOpen className="w-5 h-5 mr-2 text-chess-gold" />
          Learning: {opening.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {learningState.currentMoveIndex}/{opening.moves.length} moves
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Status */}
        <div className="p-4 bg-muted rounded-lg">
          {isComplete ? (
            <div className="text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
              <p className="font-semibold text-green-700 dark:text-green-400">
                Opening Complete!
              </p>
              <p className="text-sm text-muted-foreground">
                You've successfully learned the {opening.name} opening.
              </p>
            </div>
          ) : (
            <div>
              <h4 className="font-semibold mb-2">Next Move:</h4>
              {learningState.nextMove ? (
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="font-mono">
                    {learningState.nextMove}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Move {learningState.currentMoveIndex + 1}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Make your move to continue the opening...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Completed Moves */}
        {learningState.completedMoves.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Completed Moves:</h4>
            <div className="flex flex-wrap gap-1">
              {learningState.completedMoves.map((move, index) => (
                <Badge key={index} variant="secondary" className="text-xs font-mono">
                  {index + 1}. {move}
                </Badge>
              ))}
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onReset} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}