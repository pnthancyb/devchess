import { useState, useCallback } from "react";
import { Chess } from "chess.js";
import { apiRequest } from "@/lib/queryClient";
import type { ChessMove } from "@/types/chess";
import type { Square } from "chess.js";

export interface AIModel {
  name: string;
  id: string;
  minDifficulty: number;
  maxDifficulty: number;
  description: string;
}

export const AI_MODELS: AIModel[] = [
  {
    name: "Kimi-K2 Instruct",
    id: "moonshotai/kimi-k2-instruct",
    minDifficulty: 1,
    maxDifficulty: 3,
    description: "Club to tournament strength (1000-1600 ELO) with solid tactical play"
  },
  {
    name: "DeepSeek R1 Distill",
    id: "deepseek-r1-distill-llama-70b",
    minDifficulty: 2,
    maxDifficulty: 4,
    description: "Expert to master strength (1700-2300 ELO) with deep calculation"
  },
  {
    name: "Llama 3 70B",
    id: "llama3-70b-8192",
    minDifficulty: 3,
    maxDifficulty: 5,
    description: "Master to grandmaster level (2000-2400+ ELO) with perfect technique"
  }
];

interface AIMove {
  from: Square;
  to: Square;
  promotion?: string;
  evaluation?: string;
  analysis?: string;
}

export interface UseAIChessReturn {
  makeAIMove: (fen: string, model: string, difficulty: number) => Promise<AIMove | null>;
  analyzeMove: (fen: string, move: ChessMove, model: string) => Promise<any>;
  getAIFeedback: (fen: string, moves: ChessMove[], model: string) => Promise<string>;
  isAIThinking: boolean;
  error: string | null;
  selectAIModel: (difficulty: number) => AIModel;
  getDifficultyRange: () => number[];
}

export function useAIChess(): UseAIChessReturn {
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectAIModel = useCallback((difficulty: number): AIModel => {
    // Find the best model for the given difficulty level
    const suitableModels = AI_MODELS.filter(
      model => difficulty >= model.minDifficulty && difficulty <= model.maxDifficulty
    );

    if (suitableModels.length === 0) {
      // Fallback to the closest model
      return difficulty <= 2 ? AI_MODELS[0] : difficulty <= 4 ? AI_MODELS[1] : AI_MODELS[2];
    }

    // Return the model that best fits the difficulty
    return suitableModels[Math.floor(Math.random() * suitableModels.length)];
  }, []);

  const makeAIMove = useCallback(async (
    fen: string,
    model: string,
    difficulty: number
  ): Promise<AIMove | null> => {
    setIsAIThinking(true);
    setError(null);

    try {
      const response = await fetch('/api/chess/ai-move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          fen,
          model,
          difficulty,
          gameMode: 'classic',
          gameId: Date.now().toString() // Simple gameId for memory tracking
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Ensure we return the move object with proper structure
      if (data && data.move && data.move.from && data.move.to) {
        return {
          from: data.move.from,
          to: data.move.to,
          promotion: data.move.promotion,
          evaluation: data.evaluation || "0.0",
          analysis: data.reasoning || "AI move"
        };
      } else if (data && data.from && data.to) {
         return {
          from: data.from,
          to: data.to,
          promotion: data.promotion,
          evaluation: data.evaluation || "0.0",
          analysis: data.reasoning || "AI move"
        };
      } else {
        console.error('Invalid AI move response structure:', data);
        return null;
      }
    } catch (error) {
      console.error('AI move error:', error);
      setError("Failed to generate AI move");
      return null;
    } finally {
      setIsAIThinking(false);
    }
  }, []);

  const analyzeMove = useCallback(async (fen: string, move: ChessMove, model: string) => {
    try {
      const response = await fetch('/api/chess/analyze-move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ fen, move, model })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Move analysis error:", err);
      return {
        score: 0,
        quality: "unknown",
        explanation: "Analysis not available"
      };
    }
  }, []);

  const getAIFeedback = useCallback(async (fen: string, moves: ChessMove[], model: string): Promise<string> => {
    try {
      const response = await fetch('/api/chess/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ fen, moves, model })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.feedback || "No feedback available";
    } catch (err) {
      console.error("AI feedback error:", err);
      return "Feedback not available at the moment.";
    }
  }, []);

  const getDifficultyRange = useCallback((): number[] => {
    return [1, 2, 3, 4, 5];
  }, []);

  return {
    makeAIMove,
    analyzeMove,
    getAIFeedback,
    isAIThinking,
    error,
    selectAIModel,
    getDifficultyRange
  };
}