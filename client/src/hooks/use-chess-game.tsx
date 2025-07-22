
import { useState, useCallback, useRef, useEffect } from "react";
import { Chess, type Move as ChessJSMove, type Square } from "chess.js";
import type { ChessMove, GameMode, GameState, AIFeedback } from "@/types/chess";
import { useAIChess } from "./use-ai-chess";
import { useWebSocket } from "./use-websocket";
import { downloadPGN } from "@/lib/chess-utils";

export interface UseChessGameReturn {
  gameState: GameState & {
    moves: ChessMove[];
    currentFen: string;
    isPlayerTurn: boolean;
    isAIThinking: boolean;
    gameMode: GameMode;
    aiModel: string;
    difficulty: number;
    lastAIFeedback?: AIFeedback;
  };
  connectionState: "connecting" | "connected" | "disconnected";
  makeMove: (from: Square, to: Square, promotion?: string) => Promise<boolean>;
  resetGame: () => void;
  setGameMode: (mode: GameMode) => void;
  updateAISettings: (model: string, difficulty: number) => void;
  sendChatMessage: (message: string) => void;
  downloadGamePGN: () => void;
  isValidMove: (from: Square, to: Square) => boolean;
  getValidMoves: (square: Square) => Square[];
}

export function useChessGame(gameId?: number): UseChessGameReturn {
  const [gameMode, setGameMode] = useState<GameMode>("classic");
  const [aiModel, setAIModel] = useState("llama3-70b-8192");
  const [aiDifficulty, setAIDifficulty] = useState(3);
  const [gameState, setGameState] = useState<GameState>(() => ({
    chess: new Chess(),
    history: [],
    status: "waiting",
    currentPlayer: "white",
    isPlayerTurn: true,
    boardOrientation: "white",
    gameStartTime: new Date(),
  }));

  const gameIdRef = useRef<number | null>(null);
  const moveCountRef = useRef(0);
  
  const { makeAIMove, isAIThinking } = useAIChess();
  
  // Temporarily disable WebSocket to fix connection issues
  const connectionState = "disconnected" as const;
  const sendMessage = useCallback((message: any) => {
    console.log("WebSocket message (disabled):", message);
  }, []);

  const isValidMove = useCallback((from: Square, to: Square): boolean => {
    try {
      const moves = gameState.chess.moves({ square: from, verbose: true });
      return moves.some(move => move.to === to);
    } catch {
      return false;
    }
  }, [gameState.chess]);

  const getValidMoves = useCallback((square: Square): Square[] => {
    try {
      const moves = gameState.chess.moves({ square, verbose: true });
      return moves.map(move => move.to as Square);
    } catch {
      return [];
    }
  }, [gameState.chess]);

  const [moves, setMoves] = useState<ChessMove[]>([]);
  const [lastAIFeedback, setLastAIFeedback] = useState<AIFeedback>();

  const analyzeMove = useCallback(async (move: ChessMove): Promise<any> => {
    try {
      const response = await fetch('/api/chess/analyze-move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fen: move.fen,
          move: {
            from: move.from,
            to: move.to,
            piece: move.piece,
            san: move.san
          },
          gameMode
        }),
      });

      if (response.ok) {
        const analysis = await response.json();
        console.log("Player move analysis:", analysis);
        return analysis;
      }
    } catch (error) {
      console.error("Move analysis error:", error);
    }
    
    return { score: 0, quality: "unknown", explanation: "Analysis not available" };
  }, [gameMode]);

  const requestAIFeedback = useCallback(async (fen: string): Promise<void> => {
    try {
      const response = await fetch('/api/chess/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fen,
          gameMode,
          moveHistory: moves
        }),
      });

      if (response.ok) {
        const feedback = await response.json();
        setLastAIFeedback(feedback);
      }
    } catch (error) {
      console.error("AI feedback error:", error);
    }
  }, [gameMode, moves]);

  const makeMoveFromSquares = useCallback(async (from: Square, to: Square, promotion?: string): Promise<boolean> => {
    try {
      console.log("Player making move from", from, "to", to, promotion ? "promotion: " + promotion : "");
      
      const moveResult = gameState.chess.move({
        from,
        to,
        promotion: promotion as any,
      });

      if (!moveResult) {
        return false;
      }

      const newMove: ChessMove = {
        from: moveResult.from,
        to: moveResult.to,
        piece: moveResult.piece,
        san: moveResult.san,
        fen: gameState.chess.fen(),
        moveNumber: Math.ceil(moveCountRef.current / 2) + 1
      };

      moveCountRef.current += 1;
      const newMoves = [...moves, newMove];
      setMoves(newMoves);

      // Analyze the move
      const analysis = await analyzeMove(newMove);
      console.log("Player move analysis:", analysis);

      setGameState(prev => ({
        ...prev,
        chess: new Chess(gameState.chess.fen()),
        isPlayerTurn: false,
        status: gameState.chess.isGameOver() ? "ended" : "playing",
      }));

      console.log("Player move complete, AI should move next for FEN:", gameState.chess.fen());

      // Check if AI should move
      if (!gameState.chess.isGameOver() && gameState.chess.turn() === 'b') {
        console.log("AI should make move - Black turn detected, position:", gameState.chess.fen());
        
        // Request AI move
        setTimeout(async () => {
          console.log("AI (black) making move for position:", gameState.chess.fen());
          try {
            console.log("Requesting AI move for black pieces");
            const aiMoveResult = await makeAIMove(
              gameState.chess.fen(),
              aiModel,
              aiDifficulty
            );
            
            if (aiMoveResult) {
              console.log("AI move successful:", aiMoveResult);
              
              // Apply AI move
              const aiMove = gameState.chess.move({
                from: aiMoveResult.from,
                to: aiMoveResult.to,
                promotion: aiMoveResult.promotion
              });

              if (aiMove) {
                const aiChessMove: ChessMove = {
                  from: aiMove.from,
                  to: aiMove.to,
                  piece: aiMove.piece,
                  san: aiMove.san,
                  fen: gameState.chess.fen(),
                  moveNumber: Math.ceil((moveCountRef.current + 1) / 2) + 1
                };

                moveCountRef.current += 1;
                setMoves(prev => [...prev, aiChessMove]);

                setGameState(prev => ({
                  ...prev,
                  chess: new Chess(gameState.chess.fen()),
                  isPlayerTurn: true,
                  status: gameState.chess.isGameOver() ? "ended" : "playing",
                }));

                // Request feedback for coach mode
                if (gameMode === "coach") {
                  await requestAIFeedback(gameState.chess.fen());
                }
              }
            }
          } catch (error) {
            console.error("AI move error:", error);
            setGameState(prev => ({ ...prev, isPlayerTurn: true }));
          }
        }, 500);
      }

      // WebSocket disabled for now - moves processed locally

      return true;
    } catch (error) {
      console.error("Move error:", error);
      return false;
    }
  }, [gameState.chess, moves, makeAIMove, aiModel, aiDifficulty, gameMode, analyzeMove, requestAIFeedback, sendMessage]);

  const makeMove = useCallback(async (from: Square, to: Square, promotion?: string): Promise<boolean> => {
    return makeMoveFromSquares(from, to, promotion);
  }, [makeMoveFromSquares]);

  const updateAISettings = useCallback((model: string, difficulty: number) => {
    setAIModel(model);
    setAIDifficulty(difficulty);
  }, []);

  const sendChatMessage = useCallback((message: string) => {
    sendMessage({
      type: 'chat_message',
      data: { message },
    });
  }, [sendMessage]);

  const resetGame = useCallback(() => {
    const newChess = new Chess();
    setGameState({
      chess: newChess,
      history: [],
      status: "waiting",
      currentPlayer: "white",
      isPlayerTurn: true,
      boardOrientation: "white",
      gameStartTime: new Date(),
    });
    setMoves([]);
    setLastAIFeedback(undefined);
    moveCountRef.current = 0;
    gameIdRef.current = Date.now();
  }, []);

  const downloadGamePGN = useCallback(() => {
    const gameResult = gameState.chess.isGameOver() 
      ? gameState.chess.isCheckmate() 
        ? gameState.chess.turn() === 'w' ? '0-1' : '1-0'
        : '1/2-1/2'
      : '*';

    downloadPGN(moves, {
      white: "Player",
      black: `${aiModel} (Level ${aiDifficulty})`,
      mode: gameMode,
      result: gameResult,
      aiModel,
      difficulty: aiDifficulty,
      round: "1",
      event: `Chess Groq Coach - ${gameMode} mode`
    });
  }, [moves, gameMode, aiModel, aiDifficulty, gameState.chess]);

  // Initialize game
  useEffect(() => {
    if (!gameIdRef.current) {
      gameIdRef.current = Date.now(); // Simple game ID
      resetGame();
    }
  }, [resetGame]);

  return {
    gameState: {
      ...gameState,
      moves,
      currentFen: gameState.chess.fen(),
      isPlayerTurn: gameState.isPlayerTurn,
      isAIThinking,
      gameMode,
      aiModel,
      difficulty: aiDifficulty,
      lastAIFeedback,
    },
    connectionState,
    makeMove,
    resetGame,
    setGameMode,
    updateAISettings,
    sendChatMessage,
    downloadGamePGN,
    isValidMove,
    getValidMoves,
  };
}
