import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Play, Pause, RotateCcw, CheckCircle, AlertTriangle, Target, Brain } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { ChessOpening } from "@/types/chess";

interface OpeningLearningEnhancedProps {
  opening: ChessOpening;
  learningState: {
    selectedOpening: ChessOpening | null;
    currentMoveIndex: number;
    completedMoves: string[];
    nextMove: string | null;
  };
  onMoveAttempt: (move: string) => boolean;
  onReset: () => void;
  currentFen: string;
  aiModel: string;
  aiDifficulty: number;
  onAIMove: () => void;
}

const SAMPLE_OPENINGS: ChessOpening[] = [
  {
    id: "1",
    name: "Italian Game",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"],
    description: "A classical opening focusing on quick development",
    difficulty: "beginner",
    category: "King's Pawn"
  },
  {
    id: "2", 
    name: "Ruy Lopez",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
    description: "One of the oldest and most respected openings",
    difficulty: "intermediate",
    category: "King's Pawn"
  },
  {
    id: "3",
    name: "Queen's Gambit",
    moves: ["d4", "d5", "c4"],
    description: "A positional opening offering the c-pawn",
    difficulty: "intermediate", 
    category: "Queen's Pawn"
  }
];

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
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [feedback, setFeedback] = useState<string>("");

  const currentOpening = opening;
  const progress = currentOpening ? (learningState.currentMoveIndex / currentOpening.moves.length) * 100 : 0;
  const isCompleted = currentOpening && learningState.currentMoveIndex >= currentOpening.moves.length;

  const handleAutoPlay = async () => {
    if (!currentOpening || isCompleted) return;
    
    setIsAutoPlaying(true);
    setFeedback("Auto-playing opening moves...");
    
    // Auto-play remaining moves with delay
    for (let i = learningState.currentMoveIndex; i < currentOpening.moves.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (!isAutoPlaying) break; // Allow stopping
      
      const move = currentOpening.moves[i];
      const success = onMoveAttempt(move);
      
      if (!success) {
        setFeedback(`Failed to make move: ${move}`);
        break;
      }
      
      // Let AI respond if it's their turn (for openings with opponent moves)
      if (i % 2 === 1) {
        setTimeout(() => {
          onAIMove();
        }, 800);
      }
    }
    
    setIsAutoPlaying(false);
    setFeedback("");
  };

  const stopAutoPlay = () => {
    setIsAutoPlaying(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "advanced": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const getNextExpectedMove = () => {
    if (!currentOpening || learningState.currentMoveIndex >= currentOpening.moves.length) return null;
    return currentOpening.moves[learningState.currentMoveIndex];
  };

  const nextMove = learningState.nextMove || getNextExpectedMove();

  return (
    <div className="space-y-6">
      {/* Opening Info Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <BookOpen className="w-5 h-5 mr-2 text-primary" />
              {currentOpening.name}
            </CardTitle>
            <Badge className={getDifficultyColor(currentOpening.difficulty)}>
              {currentOpening.difficulty}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{currentOpening.description}</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Learning Progress</span>
              <span className="text-sm text-muted-foreground">
                {learningState.currentMoveIndex}/{currentOpening.moves.length} moves
              </span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Start</span>
              <span className="font-medium">
                {Math.round(progress)}% Complete
              </span>
              <span>Mastered</span>
            </div>
          </div>

          <Separator />

          {/* Current Move Guidance */}
          {!isCompleted && nextMove && (
            <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Target className="w-4 h-4 mr-2 text-primary" />
                  <span className="font-medium text-sm">Next Move</span>
                </div>
                <Badge variant="outline" className="text-primary border-primary/50">
                  Move {learningState.currentMoveIndex + 1}
                </Badge>
              </div>
              <div className="text-lg font-mono bg-white dark:bg-gray-900 px-3 py-2 rounded border">
                {nextMove}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Make this move on the board to continue the opening sequence
              </p>
            </div>
          )}

          {/* Completion Status */}
          {isCompleted && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Opening Complete!
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    You've successfully learned the {currentOpening.name}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Move Sequence Display */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Opening Sequence</span>
            <div className="flex flex-wrap gap-1">
              {currentOpening.moves.map((move, index) => (
                <Badge
                  key={index}
                  variant={index < learningState.currentMoveIndex ? "default" : "outline"}
                  className={`
                    ${index < learningState.currentMoveIndex 
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" 
                      : index === learningState.currentMoveIndex 
                        ? "bg-primary text-primary-foreground animate-pulse" 
                        : "opacity-50"
                    }
                  `}
                >
                  {index + 1}. {move}
                </Badge>
              ))}
            </div>
          </div>

          {/* Feedback Display */}
          {feedback && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">{feedback}</p>
            </div>
          )}
          </div>

          {/* Control Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            
            {!isCompleted && (
              <>
                {!isAutoPlaying ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAutoPlay}
                    className="flex-1"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Auto Play
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopAutoPlay}
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Stop
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAIPlay}
                  className="flex-1"
                >
                  <Brain className="w-4 h-4 mr-1" />
                  AI Move
                </Button>
              </>
            )}
          </div>

          {/* Learning Tips */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Learning Tips</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Try to make each move before using hints</li>
              <li>• Understand the purpose behind each move</li>
              <li>• Practice the complete sequence multiple times</li>
              <li>• Study how opponents might respond</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Opening Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Other Openings to Learn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {SAMPLE_OPENINGS.map((opening) => (
              <Button
                key={opening.id}
                variant={currentOpening.id === opening.id ? "default" : "outline"}
                size="sm"
                className="justify-start h-auto p-3"
                onClick={() => setSelectedOpeningLocal(opening)}
              >
                <div className="text-left">
                  <div className="font-medium">{opening.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {opening.category} • {opening.moves.length} moves
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}