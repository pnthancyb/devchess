import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ChessMove, ChessPiece, ChessPosition } from "@/types/chess";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface PGNOptions {
  white?: string;
  black?: string;
  mode?: string;
  result?: string;
  site?: string;
  event?: string;
  round?: string;
  date?: string;
  aiModel?: string;
  difficulty?: number;
}

export function generatePGNContent(moves: ChessMove[], options: PGNOptions = {}): string {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '.');

  // PGN headers
  let pgn = `[Event "${options.event || 'Casual Game'}"]\n`;
  pgn += `[Site "${options.site || 'Chess Groq Coach'}"]\n`;
  pgn += `[Date "${options.date || today}"]\n`;
  pgn += `[Round "${options.round || '1'}"]\n`;
  pgn += `[White "${options.white || 'Player'}"]\n`;
  pgn += `[Black "${options.black || 'AI'}"]\n`;
  pgn += `[Result "${options.result || '*'}"]\n`;

  if (options.aiModel) {
    pgn += `[AIModel "${options.aiModel}"]\n`;
  }
  if (options.difficulty) {
    pgn += `[Difficulty "${options.difficulty}"]\n`;
  }
  if (options.mode) {
    pgn += `[Mode "${options.mode}"]\n`;
  }

  pgn += '\n';

  // Move notation
  let moveText = '';
  for (let i = 0; i < moves.length; i++) {
    if (i % 2 === 0) {
      moveText += `${Math.floor(i / 2) + 1}. `;
    }
    moveText += `${moves[i].san} `;

    // Add line break every 8 moves for readability
    if ((i + 1) % 8 === 0) {
      moveText += '\n';
    }
  }

  pgn += moveText;
  pgn += ` ${options.result || '*'}`;

  return pgn;
}

export function downloadPGN(moves: ChessMove[], options: PGNOptions = {}) {
  // Enhanced PGN generation with complete metadata and analysis
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '.');
  const timeStr = now.toTimeString().split(' ')[0];
  
  // Determine game result (only * for ongoing games as requested)
  const result = options.result || "*";
  
  let pgn = `[Event "Chess Groq Coach - ${options.mode || 'Classic'}"]\n`;
  pgn += `[Site "Replit Chess Training Platform"]\n`;
  pgn += `[Date "${options.date || dateStr}"]\n`;
  pgn += `[Time "${timeStr}"]\n`;
  pgn += `[Round "1"]\n`;
  pgn += `[White "${options.white || 'Player'}"]\n`;
  pgn += `[Black "${options.black || 'AI Opponent'}"]\n`;
  pgn += `[Result "${result}"]\n`;
  pgn += `[TimeControl "-"]\n`;
  pgn += `[Mode "${options.mode || 'classic'}"]\n`;
  
  if (options.aiModel) {
    pgn += `[AI_Engine "${options.aiModel}"]\n`;
  }
  if (options.difficulty) {
    pgn += `[AI_Level "${options.difficulty}/5"]\n`;
  }
  
  pgn += `[Annotator "Chess Groq Coach AI"]\n`;
  pgn += `[Generated "${now.toISOString()}"]\n\n`;
  
  // Enhanced move notation with analysis
  let moveText = "";
  for (let i = 0; i < moves.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1;
    const whiteMove = moves[i];
    const blackMove = moves[i + 1];
    
    moveText += `${moveNumber}.`;
    
    if (whiteMove) {
      moveText += ` ${whiteMove.san}`;
      
      // Add evaluation comments for analysis
      if (whiteMove.analysis?.score !== undefined) {
        const score = whiteMove.analysis.score / 100;
        moveText += ` {${score > 0 ? '+' : ''}${score.toFixed(2)}}`;
      }
      
      if (blackMove) {
        moveText += ` ${blackMove.san}`;
        
        if (blackMove.analysis?.score !== undefined) {
          const score = blackMove.analysis.score / 100;
          moveText += ` {${score > 0 ? '+' : ''}${score.toFixed(2)}}`;
        }
      }
    }
    
    moveText += " ";
    
    // Line break every 4 full moves for readability
    if (moveNumber % 4 === 0) {
      moveText += "\n";
    }
  }
  
  pgn += moveText.trim();
  pgn += ` ${result}\n`;
  
  // Create optimized download
  const blob = new Blob([pgn], { type: 'application/x-chess-pgn;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
  const filename = `chess-${options.mode || 'game'}-${timestamp}.pgn`;
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function calculateMoveAccuracy(score: number): number {
  // Convert score to accuracy percentage
  if (score >= 90) return 95;
  if (score >= 80) return 85;
  if (score >= 70) return 75;
  if (score >= 60) return 65;
  if (score >= 50) return 55;
  return 45;
}

export function parseMove(moveString: string): Partial<ChessMove> {
  // Parse algebraic notation to move object
  // This is a simplified implementation
  const match = moveString.match(/^([NBRQK]?)([a-h]?)([1-8]?)x?([a-h][1-8])(=[NBRQ])?[+#]?$/);
  
  if (!match) {
    throw new Error(`Invalid move notation: ${moveString}`);
  }

  return {
    san: moveString,
    to: match[4],
  };
}

export function getSquareColor(square: string): "light" | "dark" {
  const file = square.charCodeAt(0) - "a".charCodeAt(0);
  const rank = parseInt(square[1]) - 1;
  return (file + rank) % 2 === 0 ? "dark" : "light";
}

export function isValidSquare(square: string): boolean {
  return /^[a-h][1-8]$/.test(square);
}

export function squareDistance(square1: string, square2: string): number {
  if (!isValidSquare(square1) || !isValidSquare(square2)) {
    return 0;
  }

  const file1 = square1.charCodeAt(0) - "a".charCodeAt(0);
  const rank1 = parseInt(square1[1]) - 1;
  const file2 = square2.charCodeAt(0) - "a".charCodeAt(0);
  const rank2 = parseInt(square2[1]) - 1;

  return Math.max(Math.abs(file1 - file2), Math.abs(rank1 - rank2));
}

export function formatMoveNumber(moveNumber: number, isWhite: boolean): string {
  if (isWhite) {
    return `${moveNumber}.`;
  }
  return `${moveNumber}...`;
}

export function getPieceSymbol(piece: string): string {
  const symbols = {
    K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
    k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
  };
  return symbols[piece as keyof typeof symbols] || piece;
}

export function evaluationToText(evaluation: number): string {
  if (evaluation > 3) return "White is winning";
  if (evaluation > 1) return "White is better";
  if (evaluation > 0.5) return "White is slightly better";
  if (evaluation > -0.5) return "Equal position";
  if (evaluation > -1) return "Black is slightly better";
  if (evaluation > -3) return "Black is better";
  return "Black is winning";
}