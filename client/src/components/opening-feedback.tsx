import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Target, TrendingUp, BookOpen } from "lucide-react";
import { ChessOpening } from "@/types/chess";

interface OpeningFeedbackProps {
  selectedOpening: ChessOpening | null;
  currentMoveIndex: number;
  nextMove: string | null;
  completedMoves: string[];
}

export function OpeningFeedback({ 
  selectedOpening, 
  currentMoveIndex, 
  nextMove, 
  completedMoves 
}: OpeningFeedbackProps) {
  // Early return with safe fallback
  if (!selectedOpening) {
    return (
      <Card className="w-full bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Opening Learning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Select an opening to start learning.</p>
        </CardContent>
      </Card>
    );
  }

  // Ensure safe values to prevent rendering issues
  const safeMoveIndex = Math.max(0, currentMoveIndex || 0);
  const safeCompletedMoves = completedMoves || [];
  const totalMoves = selectedOpening.moves?.length || 0;

  const progress = totalMoves > 0 
    ? Math.min(100, (safeMoveIndex / totalMoves) * 100)
    : 0;

  const isComplete = safeMoveIndex >= totalMoves;

  return (
    <div className="w-full">
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            {selectedOpening.name}
            <Badge variant="outline">{selectedOpening.category}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{safeMoveIndex}/{totalMoves} moves</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          {/* Current Status */}
          <div className="space-y-3">
            {isComplete ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Opening Complete!</span>
              </div>
            ) : nextMove ? (
              <div className="flex items-center gap-2 text-blue-600">
                <Target className="w-5 h-5" />
                <span className="font-medium">Next move: {nextMove}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <Circle className="w-5 h-5" />
                <span className="font-medium">Waiting for your move...</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">{selectedOpening.description}</p>
          </div>

          {/* Move List */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Moves in this opening
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {selectedOpening.moves?.map((move, index) => (
                <div 
                  key={`${selectedOpening.name}-move-${index}`}
                  className={`flex items-center gap-2 text-sm p-2 rounded transition-colors ${
                    index < safeMoveIndex 
                      ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' 
                      : index === safeMoveIndex 
                      ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                      : 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {index < safeMoveIndex ? (
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : index === safeMoveIndex ? (
                    <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-400" />
                  )}
                  <span>{Math.floor(index / 2) + 1}.{index % 2 === 0 ? '' : '..'} {move}</span>
                </div>
              )) || []}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}