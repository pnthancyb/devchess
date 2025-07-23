import { useState, useCallback, useRef, useEffect } from "react";
import { Chess, type Move as ChessJSMove, type Square } from "chess.js";
import type { ChessMove, GameMode, GameState, AIFeedback, OpeningLearningState, ChessOpening, ChatMessage } from "@/types/chess";
import { getOpeningMoves } from "@/data/openings";
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
  updateAIModel: (model: string) => void;
  sendChatMessage: (message: string) => void;
  downloadGamePGN: () => void;
  isValidMove: (from: Square, to: Square) => boolean;
  getValidMoves: (square: Square) => Square[];
  openingLearningState: OpeningLearningState;
  setSelectedOpening: (opening: ChessOpening) => void;
  chatMessages: ChatMessage[];
}

export function useChessGame(gameId?: number): UseChessGameReturn {
  const [gameMode, setGameMode] = useState<GameMode>("classic");
  const [openingLearningState, setOpeningLearningState] = useState<OpeningLearningState>({
    selectedOpening: null,
    currentMoveIndex: 0,
    playerColor: "white",
    completedMoves: [],
    nextMove: null,
  });
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

  // Disable WebSocket completely to fix connection issues and black screen
  const connectionState = "disconnected" as const;
  const sendMessage = useCallback((message: any) => {
    // WebSocket disabled - all functionality is local
    return;
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const analyzeMove = useCallback(async (move: ChessMove): Promise<any> => {
    try {
      const currentFen = gameState.chess.fen();
      const response = await fetch('/api/chess/analyze-move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          fen: currentFen, 
          move: {
            from: move.from,
            to: move.to,
            piece: move.piece,
            san: move.san,
            promotion: move.promotion
          }, 
          model: aiModel 
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
  }, [gameMode, aiModel, gameState.chess]);

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

      // Handle opening learning mode
      if (gameMode === "opening" && openingLearningState.selectedOpening) {
        const expectedMove = openingLearningState.selectedOpening.moves[openingLearningState.currentMoveIndex];
        if (moveResult.san === expectedMove) {
          // Correct move made
          setOpeningLearningState(prev => ({
            ...prev,
            currentMoveIndex: prev.currentMoveIndex + 1,
            completedMoves: [...prev.completedMoves, moveResult.san],
            nextMove: prev.selectedOpening?.moves[prev.currentMoveIndex + 1] || null,
          }));
        } else {
          // Incorrect move - revert it
          gameState.chess.undo();
          console.log("Incorrect move in opening learning mode. Expected:", expectedMove, "Got:", moveResult.san);
          return false;
        }
      }

      moveCountRef.current += 1;
      const newMoves = [...moves, newMove];
      setMoves(newMoves);

      // Analyze the move (skip for opening mode)
      if (gameMode !== "opening") {
        const analysis = await analyzeMove(newMove);
        console.log("Player move analysis:", analysis);
      }

      setGameState(prev => ({
        ...prev,
        chess: new Chess(gameState.chess.fen()),
        isPlayerTurn: gameMode === "opening" ? 
          (openingLearningState.currentMoveIndex >= openingLearningState.selectedOpening?.moves.length! ? true : false) : 
          false, // In opening mode, alternate turns until opening is complete
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

                // Request feedback for appropriate modes
                if (gameMode === "feedback" || gameMode === "scoring" || gameMode === "coach") {
                  const currentFen = gameState.chess.fen();
                  if (currentFen && currentFen.trim() !== '') {
                    await requestAIFeedback(currentFen);
                  }
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

  const updateAIModel = useCallback((model: string) => {
    setAIModel(model);
  }, []);

  const sendChatMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      message: message.trim(),
      timestamp: new Date(),
      language: "en",
    };

    setChatMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch("/api/chess/coach-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          fen: gameState.chess.fen(),
          model: aiModel,
          gameId: gameIdRef.current?.toString() || "1",
        }),
      });

      const data = await response.json();

      if (data.response) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          message: data.response,
          timestamp: new Date(),
          language: "en",
        };

        setChatMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("Coach chat error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        message: "Sorry, I'm having trouble responding right now. Please try again!",
        timestamp: new Date(),
        language: "en",
      };

      setChatMessages(prev => [...prev, errorMessage]);
    }
  }, [gameState.chess, aiModel]);

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

  const setSelectedOpening = useCallback((opening: ChessOpening) => {
    setOpeningLearningState(prev => ({
      ...prev,
      selectedOpening: opening,
      currentMoveIndex: 0,
      completedMoves: [],
      nextMove: opening.moves[0] || null,
    }));

    // Reset the chess board for the opening
    resetGame();
    setGameMode("opening");
  }, [resetGame]);

  // Handle opening learning logic - fixed to detect opponent moves
  useEffect(() => {
    if (gameMode === "opening" && openingLearningState.selectedOpening) {
      const currentMoveCount = moves.length;
      const { nextMove, isComplete, playerMove } = getOpeningMoves(
        openingLearningState.selectedOpening,
        currentMoveCount // Use actual move count instead of currentMoveIndex
      );

      setOpeningLearningState(prev => ({
        ...prev,
        nextMove,
        currentMoveIndex: currentMoveCount, // Update move index to match actual moves
        completedMoves: moves.slice(0, currentMoveCount)
      }));

      // After opponent move, check if we need to continue with next player move
      if (currentMoveCount > 0 && currentMoveCount % 2 === 0 && !isComplete) {
        // It's white's turn after black's move - show next expected move
        const { nextMove: nextPlayerMove } = getOpeningMoves(
          openingLearningState.selectedOpening,
          currentMoveCount
        );

        setOpeningLearningState(prev => ({
          ...prev,
          nextMove: nextPlayerMove
        }));
      }
    }
  }, [gameMode, openingLearningState.selectedOpening, moves.length]);

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
    updateAIModel,
    sendChatMessage,
    downloadGamePGN,
    isValidMove,
    getValidMoves,
    openingLearningState,
    setSelectedOpening,
    chatMessages,
  };
}