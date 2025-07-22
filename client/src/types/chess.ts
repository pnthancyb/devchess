import type { Chess, Move as ChessJSMove, Square } from "chess.js";

export type GameMode = "classic" | "feedback" | "scoring" | "coach" | "opening";

export interface ChessMove {
  from: Square;
  to: Square;
  piece: string;
  san: string;
  fen: string;
  moveNumber: number;
  promotion?: string;
  captured?: string;
  analysis?: {
    score: number;
    quality: string;
    evaluation: string;
    feedback: string;
  };
}

export interface GameState {
  chess: Chess;
  history: ChessJSMove[];
  status: "waiting" | "playing" | "ended" | "check" | "checkmate" | "draw";
  currentPlayer: "white" | "black";
  isPlayerTurn: boolean;
  boardOrientation: "white" | "black";
  gameStartTime: Date;
}

export interface AIFeedback {
  feedback: string;
  score: number;
  evaluation: string;
  quality: "excellent" | "good" | "inaccuracy" | "mistake" | "blunder";
}

export interface WebSocketMessage {
  type: string;
  data: any;
  gameId?: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  message: string;
  timestamp: Date;
  language: string;
}

export interface GameSession {
  gameId: number;
  userId: number;
  language: string;
  mode: GameMode;
  difficulty: number;
  aiModel: string;
}

export interface ChessOpening {
  id: string;
  name: string;
  moves: string[];
  description: string;
  fen?: string;
}

export interface OpeningLearningState {
  selectedOpening: ChessOpening | null;
  currentMoveIndex: number;
  playerColor: "white" | "black";
  completedMoves: string[];
  nextMove: string | null;
}