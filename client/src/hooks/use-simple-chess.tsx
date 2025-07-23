import { useState, useCallback, useRef } from "react";
import { Chess, Square } from "chess.js";
// Simple types to avoid import issues
type GameMode = "classic" | "feedback" | "scoring" | "coach" | "opening";

interface ChessMove {
  id: number;
  gameId: number;
  moveNumber: number;
  from: string;
  to: string;
  piece: string;
  san: string;
  fen: string;
  createdAt: Date;
  evaluation: string | null;
  score: string | null;
  feedback: string | null;
}

export interface UseSimpleChessReturn {
  chess: Chess;
  fen: string;
  moves: ChessMove[];
  isPlayerTurn: boolean;
  isAIThinking: boolean;
  gameMode: GameMode;
  makeMove: (from: Square, to: Square, promotion?: string) => Promise<boolean>;
  resetGame: () => void;
  setGameMode: (mode: GameMode) => void;
  downloadGamePGN: () => void;
  isValidMove: (from: Square, to: Square) => boolean;
  getValidMoves: (square: Square) => Square[];
}

export function useSimpleChess(): UseSimpleChessReturn {
  const [gameMode, setGameMode] = useState<GameMode>("classic");
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [moves, setMoves] = useState<ChessMove[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isAIThinking, setIsAIThinking] = useState(false);
  
  const gameIdRef = useRef(Date.now());

  const isValidMove = useCallback((from: Square, to: Square): boolean => {
    try {
      const validMoves = chess.moves({ square: from, verbose: true });
      return validMoves.some(move => move.to === to);
    } catch {
      return false;
    }
  }, [chess]);

  const getValidMoves = useCallback((square: Square): Square[] => {
    try {
      const validMoves = chess.moves({ square, verbose: true });
      return validMoves.map(move => move.to as Square);
    } catch {
      return [];
    }
  }, [chess]);

  const makeMove = useCallback(async (from: Square, to: Square, promotion?: string): Promise<boolean> => {
    try {
      const moveData = {
        from,
        to,
        promotion: promotion || undefined,
      };

      const move = chess.move(moveData);
      if (!move) return false;

      const newFen = chess.fen();
      setFen(newFen);
      
      const newMove: ChessMove = {
        id: moves.length + 1,
        gameId: gameIdRef.current,
        moveNumber: Math.ceil((moves.length + 1) / 2),
        from: move.from as Square,
        to: move.to as Square,
        piece: move.piece,
        san: move.san,
        fen: newFen,
        createdAt: new Date(),
        evaluation: null,
        score: null,
        feedback: null,
      };

      setMoves(prev => [...prev, newMove]);
      setIsPlayerTurn(false);

      // Auto-play AI move after a short delay
      if (gameMode === "classic" && !chess.isGameOver()) {
        setIsAIThinking(true);
        setTimeout(async () => {
          try {
            const response = await fetch('/api/chess/ai-move', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                fen: newFen, 
                difficulty: 5,
                model: 'stockfish'
              }),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.move) {
                const aiMove = chess.move(data.move);
                if (aiMove) {
                  const aiFen = chess.fen();
                  setFen(aiFen);
                  
                  const aiMoveData: ChessMove = {
                    id: moves.length + 2,
                    gameId: gameIdRef.current,
                    moveNumber: Math.ceil((moves.length + 2) / 2),
                    from: aiMove.from as Square,
                    to: aiMove.to as Square,
                    piece: aiMove.piece,
                    san: aiMove.san,
                    fen: aiFen,
                    createdAt: new Date(),
                    evaluation: null,
                    score: null,
                    feedback: null,
                  };

                  setMoves(prev => [...prev, aiMoveData]);
                }
              }
            }
          } catch (error) {
            console.error("AI move error:", error);
          } finally {
            setIsAIThinking(false);
            setIsPlayerTurn(true);
          }
        }, 1000);
      }

      return true;
    } catch (error) {
      console.error("Move error:", error);
      return false;
    }
  }, [chess, moves.length, gameMode]);

  const resetGame = useCallback(() => {
    chess.reset();
    setFen(chess.fen());
    setMoves([]);
    setIsPlayerTurn(true);
    setIsAIThinking(false);
    gameIdRef.current = Date.now();
  }, [chess]);

  const downloadGamePGN = useCallback(() => {
    const gameResult = chess.isGameOver() 
      ? chess.isCheckmate() 
        ? chess.turn() === 'w' ? '0-1' : '1-0'
        : '1/2-1/2'
      : '*';

    const pgnData = [
      '[Event "Chess Groq Coach"]',
      '[Site "Replit"]',
      '[Date "' + new Date().toISOString().split('T')[0] + '"]',
      '[Round "1"]',
      '[White "Player"]',
      '[Black "AI"]',
      `[Result "${gameResult}"]`,
      '',
      moves.map((move, index) => {
        if (index % 2 === 0) {
          return `${Math.ceil((index + 1) / 2)}. ${move.san}`;
        } else {
          return move.san;
        }
      }).join(' '),
      gameResult
    ].join('\n');

    const blob = new Blob([pgnData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-game-${Date.now()}.pgn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [chess, moves]);

  return {
    chess,
    fen,
    moves,
    isPlayerTurn,
    isAIThinking,
    gameMode,
    makeMove,
    resetGame,
    setGameMode,
    downloadGamePGN,
    isValidMove,
    getValidMoves,
  };
}