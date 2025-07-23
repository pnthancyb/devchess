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
      return "text-muted-foreground";
    }
  };

  const getPlayerToMove = () => {
    // In chess, move 1 is white, move 2 is black, etc.
    return (learningState.currentMoveIndex % 2 === 0) ? "White" : "Black";
  };

  if (isComplete) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center text-green-700 dark:text-green-300">
            <CheckCircle className="w-5 h-5 mr-2" />
            Opening Mastered!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">{opening.name}</h3>
            <p className="text-sm text-muted-foreground">{opening.description}</p>
            <div className="mt-4">
              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                {opening.moves.length} moves completed
              </Badge>
            </div>
          </div>
          
          <div className="flex justify-center space-x-2">
            <Button onClick={onReset} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Practice Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-primary" />
          Learning: {opening.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {learningState.completedMoves.length} / {opening.moves.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Move Info */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Move {learningState.currentMoveIndex + 1}
            </span>
            <Badge variant="outline">
              {getPlayerToMove()} to play
            </Badge>
          </div>
          
          {expectedMove && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Expected move: 
                <span className={`ml-2 font-mono font-bold ${showHint ? 'text-primary' : 'text-transparent bg-muted-foreground rounded px-1'}`}>
                  {expectedMove}
                </span>
              </div>
              
              {!showHint && (
                <Button 
                  onClick={handleShowHint} 
                  variant="outline" 
                  size="sm"
                  className="h-7 text-xs"
                >
                  Show Hint
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Move Sequence */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Opening Sequence</span>
          <div className="grid grid-cols-2 gap-1 text-xs p-2 bg-muted rounded">
            {opening.moves.map((move, index) => (
              <div 
                key={index}
                className={`flex items-center ${getMoveColor(index)}`}
              >
                {index < learningState.completedMoves.length && (
                  <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                )}
                {index === learningState.currentMoveIndex && (
                  <ArrowRight className="w-3 h-3 mr-1 text-blue-500" />
                )}
                <span className="font-mono">
                  {Math.floor(index / 2) + 1}{index % 2 === 0 ? '.' : '...'} {move}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
            <div className="flex items-center">
              <XCircle className="w-4 h-4 mr-2 text-yellow-600" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">{feedback}</span>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
          {opening.description}
        </div>

        {/* Reset Button */}
        <div className="flex justify-center">
          <Button onClick={onReset} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Opening
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}