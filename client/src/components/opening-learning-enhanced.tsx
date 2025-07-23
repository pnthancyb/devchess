import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, BookOpen, ArrowRight, RotateCcw, Play, Pause, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { ChessOpening, OpeningLearningState } from "@/types/chess";
import { Chess } from "chess.js";

interface OpeningLearningEnhancedProps {
  opening: ChessOpening;
  learningState: OpeningLearningState;
  onMoveAttempt: (move: string) => boolean;
  onReset: () => void;
  currentFen: string;
  aiModel: string;
  aiDifficulty: number;
  onAIMove?: () => void;
}

interface MoveAttempt {
  move: string;
  correct: boolean;
  timestamp: number;
}

export function OpeningLearningEnhanced({
  opening,
  learningState,
  onMoveAttempt,
  onReset,
  currentFen,
  aiModel,
  aiDifficulty,
  onAIMove
}: OpeningLearningEnhancedProps) {
  const { t } = useI18n();
  const [feedback, setFeedback] = useState<string>("");
  const [showHint, setShowHint] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [attempts, setAttempts] = useState<MoveAttempt[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');

  const progress = (learningState.completedMoves.length / opening.moves.length) * 100;
  const isComplete = learningState.completedMoves.length >= opening.moves.length;

  // Get current expected move
  const expectedMove = opening.moves[learningState.currentMoveIndex];
  const nextMove = opening.moves[learningState.currentMoveIndex + 1];

  // Timer for tracking time spent
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isComplete) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isComplete]);

  // Determine whose turn it is
  useEffect(() => {
    const moveNumber = learningState.currentMoveIndex;
    setCurrentPlayer(moveNumber % 2 === 0 ? 'white' : 'black');
  }, [learningState.currentMoveIndex]);

  // Auto-play AI moves for opponent
  useEffect(() => {
    if (autoPlay && !isComplete && expectedMove) {
      const isAITurn = (currentPlayer === 'black' && opening.color === 'white') || 
                       (currentPlayer === 'white' && opening.color === 'black');
      
      if (isAITurn && onAIMove) {
        const timer = setTimeout(() => {
          // AI plays the expected move from the opening
          const success = onMoveAttempt(formatMove(expectedMove));
          if (success) {
            setAttempts(prev => [...prev, {
              move: formatMove(expectedMove),
              correct: true,
              timestamp: Date.now()
            }]);
          }
        }, 1500); // Delay for realistic AI thinking time
        
        return () => clearTimeout(timer);
      }
    }
  }, [autoPlay, currentPlayer, isComplete, expectedMove, onMoveAttempt, onAIMove, opening.color]);

  // Validate current position against expected moves
  useEffect(() => {
    try {
      const chess = new Chess();
      
      // Play all completed moves to verify position
      for (let i = 0; i < learningState.completedMoves.length; i++) {
        const move = learningState.completedMoves[i];
        const result = chess.move(formatMove(move));
        if (!result) {
          console.error(`Invalid move in sequence: ${move} at position ${i}`);
          setFeedback("Position error detected - please reset");
          return;
        }
      }
      
      // Check if current FEN matches expected position
      if (chess.fen() !== currentFen && learningState.completedMoves.length > 0) {
        setFeedback("Position mismatch - moves may be out of order");
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
    setTimeout(() => setShowHint(false), 4000);
  };

  const handleMoveAttempt = (move: string) => {
    const success = onMoveAttempt(move);
    setAttempts(prev => [...prev, {
      move,
      correct: success,
      timestamp: Date.now()
    }]);
    
    if (success) {
      setFeedback("");
    } else {
      setFeedback(`Incorrect move: ${move}. Expected: ${formatMove(expectedMove)}`);
    }
    
    return success;
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setAutoPlay(true);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setAutoPlay(false);
    setTimeSpent(0);
    setAttempts([]);
    setFeedback("");
    setShowHint(false);
    onReset();
  };

  const getMoveColor = (moveIndex: number) => {
    if (moveIndex < learningState.completedMoves.length) {
      return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
    } else if (moveIndex === learningState.currentMoveIndex) {
      return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-bold";
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPlayerToMove = () => {
    return currentPlayer === 'white' ? 'White' : 'Black';
  };

  const isUserTurn = () => {
    return (currentPlayer === 'white' && opening.color === 'white') || 
           (currentPlayer === 'black' && opening.color === 'black');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-primary" />
            <span>{t('opening.title')}: {opening.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={togglePlay}
              disabled={isComplete}
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1" />
              {t('common.reset')}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress and Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('opening.progress')}</span>
              <span>{learningState.completedMoves.length}/{opening.moves.length}</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">{formatTime(timeSpent)}</span>
            </div>
            <div className="text-xs text-muted-foreground">Time</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm font-semibold">
              {attempts.filter(a => a.correct).length} / {attempts.length}
            </div>
            <div className="text-xs text-muted-foreground">Accuracy</div>
          </div>
        </div>

        {/* Opening Description */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">{opening.description}</p>
          <div className="flex items-center justify-between mt-2">
            <Badge variant="secondary">
              Playing as {opening.color}
            </Badge>
            <Badge variant="outline">
              {aiModel} (Level {aiDifficulty})
            </Badge>
          </div>
        </div>

        {/* Current Move Display */}
        {!isComplete && expectedMove && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Move {learningState.currentMoveIndex + 1}: {getPlayerToMove()} to play
              </h4>
              <Badge className={isUserTurn() ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}>
                {isUserTurn() ? "Your turn" : "AI turn"}
              </Badge>
            </div>
            
            {isUserTurn() && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  Expected move
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
            )}
          </div>
        )}

        {/* Move Sequence */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t('opening.sequence')}:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {opening.moves.map((move, index) => (
              <div
                key={index}
                className={`p-2 rounded text-center text-sm border transition-all ${getMoveColor(index)}`}
              >
                <div className="text-xs text-muted-foreground">
                  {Math.floor(index / 2) + 1}{index % 2 === 0 ? '.' : '...'}
                </div>
                <div className="font-mono font-semibold">
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
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center">
              <XCircle className="w-4 h-4 mr-2 text-red-600" />
              <span className="text-sm text-red-800 dark:text-red-300">{feedback}</span>
            </div>
          </div>
        )}

        {/* Recent Attempts */}
        {attempts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Attempts:</h4>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {attempts.slice(-3).map((attempt, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="font-mono">{attempt.move}</span>
                  {attempt.correct ? (
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completion Message */}
        {isComplete && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center border border-green-200 dark:border-green-800">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <h4 className="text-lg font-semibold text-green-800 dark:text-green-300">
              {t('opening.completed')}
            </h4>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Completed in {formatTime(timeSpent)} with {attempts.filter(a => a.correct).length}/{attempts.length} accuracy
            </p>
            <div className="mt-3 space-x-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Practice Again
              </Button>
            </div>
          </div>
        )}

        {/* Next Move Preview */}
        {!isComplete && nextMove && (
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs border border-blue-200 dark:border-blue-800">
            <strong>{t('opening.upcoming')}:</strong> {formatMove(nextMove)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}