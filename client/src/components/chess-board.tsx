
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Download, RotateCw } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/hooks/use-theme";
import type { ChessMove } from "@/types/chess";
import { Chess, type Square } from "chess.js";

interface ChessBoardProps {
  position: string;
  onMove: (from: Square, to: Square, promotion?: string) => Promise<boolean>;
  isPlayerTurn: boolean;
  isAIThinking?: boolean;
  onReset?: () => void;
  onDownloadPGN?: () => void;
  moves?: ChessMove[];
  aiModel?: string;
  difficulty?: number;
  isValidMove?: (from: Square, to: Square) => boolean;
  getValidMoves?: (square: Square) => Square[];
  orientation?: 'white' | 'black';
  lastMove?: ChessMove;
  isCheck?: boolean;
  isGameOver?: boolean;
}

export function ChessBoard({
  position,
  onMove,
  isPlayerTurn,
  isAIThinking = false,
  onReset,
  onDownloadPGN,
  moves = [],
  aiModel = "AI",
  difficulty = 3,
  isValidMove,
  getValidMoves,
  orientation = 'white',
  lastMove,
  isCheck = false,
  isGameOver = false,
}: ChessBoardProps) {
  const { t } = useI18n();
  const { actualTheme } = useTheme();
  const [game, setGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>(orientation);

  // Chess piece Unicode symbols
  const pieceSymbols = {
    'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
    'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
  };

  const getPieceStyle = (piece: any) => {
    const baseStyle = "drop-shadow-lg font-bold transition-all duration-200 hover:scale-110";
    if (piece.color === 'w') {
      return `${baseStyle} text-white filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] stroke-black stroke-2`;
    } else {
      return `${baseStyle} text-gray-900 filter drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]`;
    }
  };

  // Initialize game position
  useEffect(() => {
    if (position && position !== game.fen()) {
      try {
        const newGame = new Chess(position);
        setGame(newGame);
      } catch (error) {
        console.error('Invalid FEN position:', error);
        // Fallback to starting position
        const newGame = new Chess();
        setGame(newGame);
      }
    }
  }, [position]);

  // Update board orientation when prop changes
  useEffect(() => {
    setBoardOrientation(orientation);
  }, [orientation]);

  // Handle square click
  const handleSquareClick = async (square: string) => {
    if (!isPlayerTurn || isAIThinking) return;

    if (selectedSquare === square) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    if (selectedSquare) {
      // Try to make move
      try {
        const success = await onMove(selectedSquare as Square, square as Square, 'q');
        if (success) {
          setSelectedSquare(null);
          setLegalMoves([]);
        } else {
          // Invalid move, select new square if it has a piece
          selectSquare(square);
        }
      } catch (error) {
        console.error("Move error:", error);
        selectSquare(square);
      }
    } else {
      selectSquare(square);
    }
  };

  const selectSquare = (square: string) => {
    const piece = game.get(square as Square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      
      // Use provided getValidMoves function if available, otherwise calculate locally
      if (getValidMoves) {
        setLegalMoves(getValidMoves(square as Square));
      } else {
        try {
          const moves = game.moves({ square: square as Square, verbose: true });
          setLegalMoves(moves.map((move: any) => move.to));
        } catch {
          setLegalMoves([]);
        }
      }
    }
  };

  // Generate board squares
  const generateBoard = () => {
    // Ensure we have a valid game state
    if (!game || !position) {
      return [];
    }

    const squares = [];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = boardOrientation === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];

    for (const rank of ranks) {
      const row = [];
      const fileOrder = boardOrientation === 'white' ? files : files.slice().reverse();

      for (const file of fileOrder) {
        const square = `${file}${rank}`;
        const piece = game.get(square as Square);
        const isLight = (files.indexOf(file) + rank) % 2 === 0;
        const isSelected = selectedSquare === square;
        const isLegalMove = legalMoves.includes(square);
        const isLastMove = lastMove && 
          (lastMove.from === square || lastMove.to === square);

        row.push(
          <div
            key={square}
            className={`
              w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 
              flex items-center justify-center cursor-pointer relative 
              text-lg sm:text-xl md:text-2xl lg:text-3xl select-none
              transition-all duration-200 hover:scale-105
              ${isLight 
                ? 'bg-amber-100 dark:bg-amber-200 hover:bg-amber-200 dark:hover:bg-amber-300' 
                : 'bg-amber-700 dark:bg-amber-800 hover:bg-amber-600 dark:hover:bg-amber-700'
              }
              ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}
              ${isLastMove ? 'bg-yellow-300 dark:bg-yellow-600' : ''}
            `}
            onClick={() => handleSquareClick(square)}
          >
            {piece && (
              <span 
                className={getPieceStyle(piece)} 
                style={{
                  textShadow: piece.color === 'w' 
                    ? '2px 2px 0px #000000, -1px -1px 0px #000000, 1px -1px 0px #000000, -1px 1px 0px #000000'
                    : '2px 2px 0px #ffffff, -1px -1px 0px #ffffff, 1px -1px 0px #ffffff, -1px 1px 0px #ffffff'
                }}
              >
                {pieceSymbols[`${piece.color}${piece.type.toUpperCase()}` as keyof typeof pieceSymbols]}
              </span>
            )}

            {isLegalMove && (
              <div className={`
                absolute inset-0 flex items-center justify-center
                ${piece ? 'border-4 border-green-500 border-opacity-70 rounded-full' : ''}
              `}>
                {!piece && (
                  <div className="w-4 h-4 bg-green-500 bg-opacity-70 rounded-full" />
                )}
              </div>
            )}

            {/* Coordinate labels */}
            {file === (boardOrientation === 'white' ? 'a' : 'h') && (
              <span className="absolute left-0.5 top-0.5 text-xs opacity-70 font-semibold">
                {rank}
              </span>
            )}
            {rank === (boardOrientation === 'white' ? 1 : 8) && (
              <span className="absolute right-0.5 bottom-0.5 text-xs opacity-70 font-semibold">
                {file}
              </span>
            )}
          </div>
        );
      }
      squares.push(<div key={rank} className="flex">{row}</div>);
    }

    return squares;
  };

  // Handle reset
  const handleReset = () => {
    const newGame = new Chess();
    setGame(newGame);
    setSelectedSquare(null);
    setLegalMoves([]);
    onReset?.();
  };

  // Flip board
  const flipBoard = () => {
    setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white');
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      {/* Game Status */}
      <div className="flex flex-wrap items-center justify-center gap-4 min-h-[2rem]">
        {isGameOver && (
          <div className="text-center px-4 py-2 bg-primary/10 rounded-lg border-2 border-primary/20">
            <div className="text-lg font-semibold text-primary">
              {game.isCheckmate() 
                ? `${game.turn() === 'w' ? t('common.black') : t('common.white')} ${t('game.wins')}`
                : game.isDraw() 
                ? t('game.draw')
                : t('game.gameOver')
              }
            </div>
          </div>
        )}
        {isCheck && !isGameOver && (
          <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full border border-red-200 font-semibold">
            {t('game.check')}
          </div>
        )}
        {isAIThinking && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full border border-blue-200 font-semibold">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            {t('game.aiThinking')}
          </div>
        )}
      </div>

      {/* Chess Board */}
      <div className={`
        relative border-4 border-border rounded-xl shadow-2xl
        ${actualTheme === 'dark' ? 'bg-card' : 'bg-card'}
        p-6 max-w-2xl mx-auto transition-all duration-300 hover:shadow-3xl
        bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20
      `}>
        <div className="flex flex-col bg-amber-100/50 dark:bg-amber-900/30 rounded-xl p-3 border border-amber-200 dark:border-amber-700">
          {generateBoard()}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 justify-center">
        {onReset && (
          <Button 
            onClick={handleReset}
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {t('game.reset')}
          </Button>
        )}

        <Button 
          onClick={flipBoard}
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <RotateCw className="w-4 h-4" />
          {t('game.flipBoard')}
        </Button>

        {onDownloadPGN && (
          <Button 
            onClick={onDownloadPGN}
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('game.exportPGN')}
          </Button>
        )}
      </div>

      {/* Current Position Info */}
      <div className="text-sm text-muted-foreground text-center max-w-md">
        <div>{t('game.turn')}: {game.turn() === 'w' ? t('common.white') : t('common.black')}</div>
        <div>{t('game.difficulty')}: {difficulty}/5 | AI: {aiModel}</div>
        <div className="mt-1 font-mono text-xs break-all opacity-50">
          FEN: {game.fen()}
        </div>
      </div>
    </div>
  );
}
