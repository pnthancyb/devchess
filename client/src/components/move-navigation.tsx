import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, SkipBack, SkipForward, Play, Pause } from "lucide-react";
import { Chess } from "chess.js";
import type { ChessMove } from "@/types/chess";

interface MoveNavigationProps {
  moves: ChessMove[];
  currentMoveIndex?: number;
  onMoveSelect: (index: number) => void;
  onPositionChange: (fen: string) => void;
  className?: string;
}

export function MoveNavigation({
  moves,
  currentMoveIndex = moves.length - 1,
  onMoveSelect,
  onPositionChange,
  className = ""
}: MoveNavigationProps) {
  const [selectedMoveIndex, setSelectedMoveIndex] = useState(currentMoveIndex);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  useEffect(() => {
    setSelectedMoveIndex(currentMoveIndex);
  }, [currentMoveIndex]);

  useEffect(() => {
    if (moves.length > 0 && selectedMoveIndex >= 0 && selectedMoveIndex < moves.length) {
      onPositionChange(moves[selectedMoveIndex].fen);
    }
  }, [selectedMoveIndex, moves, onPositionChange]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoPlaying && selectedMoveIndex < moves.length - 1) {
      interval = setInterval(() => {
        setSelectedMoveIndex(prev => {
          const next = prev + 1;
          if (next >= moves.length - 1) {
            setIsAutoPlaying(false);
            return moves.length - 1;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, selectedMoveIndex, moves.length]);

  const handleMoveSelect = (index: number) => {
    setSelectedMoveIndex(index);
    onMoveSelect(index);
    setIsAutoPlaying(false);
  };

  const goToStart = () => {
    setSelectedMoveIndex(-1);
    onPositionChange("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    setIsAutoPlaying(false);
  };

  const goToPreviousMove = () => {
    if (selectedMoveIndex > -1) {
      const newIndex = selectedMoveIndex - 1;
      setSelectedMoveIndex(newIndex);
      if (newIndex === -1) {
        onPositionChange("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
      } else {
        onPositionChange(moves[newIndex].fen);
      }
    }
    setIsAutoPlaying(false);
  };

  const goToNextMove = () => {
    if (selectedMoveIndex < moves.length - 1) {
      const newIndex = selectedMoveIndex + 1;
      setSelectedMoveIndex(newIndex);
      onPositionChange(moves[newIndex].fen);
    }
    setIsAutoPlaying(false);
  };

  const goToEnd = () => {
    if (moves.length > 0) {
      const lastIndex = moves.length - 1;
      setSelectedMoveIndex(lastIndex);
      onPositionChange(moves[lastIndex].fen);
    }
    setIsAutoPlaying(false);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  if (moves.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Game Navigation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Navigation Controls */}
        <div className="flex items-center justify-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={goToStart}
            disabled={selectedMoveIndex === -1}
          >
            <SkipBack className="w-3 h-3" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={goToPreviousMove}
            disabled={selectedMoveIndex === -1}
          >
            <ChevronLeft className="w-3 h-3" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={toggleAutoPlay}
            disabled={selectedMoveIndex >= moves.length - 1}
          >
            {isAutoPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={goToNextMove}
            disabled={selectedMoveIndex >= moves.length - 1}
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={goToEnd}
            disabled={selectedMoveIndex >= moves.length - 1}
          >
            <SkipForward className="w-3 h-3" />
          </Button>
        </div>

        {/* Move Counter */}
        <div className="text-center text-xs text-muted-foreground">
          {selectedMoveIndex === -1 ? "Starting position" : `Move ${selectedMoveIndex + 1} of ${moves.length}`}
        </div>

        {/* Current Move Info */}
        {selectedMoveIndex >= 0 && selectedMoveIndex < moves.length && (
          <div className="text-center p-2 bg-muted rounded text-sm">
            <div className="font-medium">
              {Math.ceil((selectedMoveIndex + 1) / 2)}. {moves[selectedMoveIndex].san}
            </div>
            {moves[selectedMoveIndex].analysis?.feedback && (
              <div className="text-xs text-muted-foreground mt-1">
                {moves[selectedMoveIndex].analysis?.feedback}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}