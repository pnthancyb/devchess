import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, BookOpen, ArrowRight, RotateCcw } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { ChessOpening, OpeningLearningState } from "@/types/chess";
import { Chess } from "chess.js";

interface OpeningLearningProps {
  opening: ChessOpening;
  learningState: OpeningLearningState;
  onMoveAttempt: (move: string) => boolean;
  onReset: () => void;
  currentFen: string;
}

export function OpeningLearningFixed({
  opening,
  learningState,
  onMoveAttempt,
  onReset,
  currentFen
}: OpeningLearningProps) {
  const { t } = useI18n();
  const [feedback, setFeedback] = useState<string>("");
  const [showHint, setShowHint] = useState(false);

  const progress = (learningState.completedMoves.length / opening.moves.length) * 100;
  const isComplete = learningState.completedMoves.length >= opening.moves.length;

  // Get current expected move
  const expectedMove = opening.moves[learningState.currentMoveIndex];
  const nextMove = opening.moves[learningState.currentMoveIndex + 1];

  // Validate current position against expected moves
  useEffect(() => {
    try {
      const chess = new Chess();
      
      // Play all completed moves to verify position
      for (let i = 0; i < learningState.completedMoves.length; i++) {
        const move = learningState.completedMoves[i];
        const result = chess.move(move);
        if (!result) {
          console.error(`Invalid move in sequence: ${move} at position ${i}`);
          setFeedback("Position error - resetting opening");
          return;
        }
      }
      
      // Check if current FEN matches expected position
      if (chess.fen() !== currentFen && learningState.completedMoves.length > 0) {
        setFeedback("Position mismatch detected");
      } else {
        setFeedback("");
      }
    } catch (error) {
      console.error("Opening validation error:", error);
      setFeedback("Opening validation failed");
    }
  }, [currentFen, learningState.completedMoves]);

  const handleShowHint = () => {
    setShowHint(true);
    setTimeout(() => setShowHint(false), 3000);
  };

  const getMoveColor = (moveIndex: number) => {
    if (moveIndex < learningState.completedMoves.length) {
      return "text-green-600 dark:text-green-400";
    } else if (moveIndex === learningState.currentMoveIndex) {
      return "text-blue-600 dark:text-blue-400 font-bold";
    } else {
      return "text-gray-500 dark:text-gray-400";
    }
  };

  // Safe move display - ensure moves are properly converted to strings
  const formatMove = (move: any): string => {
    if (typeof move === 'string') {
      return move;
    }
    if (move && typeof move === 'object' && move.san) {
      return move.san;
    }
    return move?.toString() || '';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-primary" />
            <span>{t('opening.title')}: {opening.name}</span>
          </div>
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="w-4 h-4 mr-1" />
            {t('common.reset')}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t('opening.progress')}</span>
            <span>{learningState.completedMoves.length}/{opening.moves.length}</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Opening Description */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">{opening.description}</p>
        </div>

        {/* Current Move Display */}
        {!isComplete && expectedMove && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t('opening.nextMove')}:</h4>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                Move {learningState.currentMoveIndex + 1}
              </Badge>
              {showHint ? (
                <Badge className="bg-yellow-100 text-yellow-800">
                  {formatMove(expectedMove)}
                </Badge>
              ) : (
                <Button variant="outline" size="sm" onClick={handleShowHint}>
                  {t('opening.showHint')}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Move Sequence */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t('opening.sequence')}:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {opening.moves.map((move, index) => (
              <div
                key={index}
                className={`p-2 rounded text-center text-sm border ${getMoveColor(index)}`}
              >
                <div className="text-xs text-muted-foreground">
                  {Math.floor(index / 2) + 1}{index % 2 === 0 ? '.' : '...'}
                </div>
                <div className="font-mono">
                  {formatMove(move)}
                </div>
                {index < learningState.completedMoves.length && (
                  <CheckCircle className="w-3 h-3 mx-auto mt-1 text-green-600" />
                )}
                {index === learningState.currentMoveIndex && (
                  <ArrowRight className="w-3 h-3 mx-auto mt-1 text-blue-600" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-600 dark:text-red-400">
            {feedback}
          </div>
        )}

        {/* Completion Message */}
        {isComplete && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <h4 className="text-lg font-semibold text-green-800 dark:text-green-300">
              {t('opening.completed')}
            </h4>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              {t('opening.completedMessage')}
            </p>
          </div>
        )}

        {/* Next Move Preview */}
        {!isComplete && nextMove && (
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
            <strong>{t('opening.upcoming')}:</strong> {formatMove(nextMove)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}