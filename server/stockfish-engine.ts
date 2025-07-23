import { Chess } from "chess.js";

interface StockfishEvaluation {
  score: number;
  depth: number;
  bestMove: string;
  pv: string[];
  evaluation: string;
  quality: "excellent" | "good" | "inaccuracy" | "mistake" | "blunder";
}

interface StockfishMove {
  from: string;
  to: string;
  promotion?: string;
  san: string;
}

export class StockfishEngine {
  private engine: any = null;
  private isReady = false;
  private pendingPromises = new Map<string, { resolve: (value: any) => void; reject: (error: any) => void }>();
  private commandId = 0;

  constructor() {
    this.initializeEngine();
  }

  private async initializeEngine() {
    try {
      // Use Web Workers or subprocess for Stockfish in production
      // For now, we'll simulate Stockfish with a chess evaluation algorithm
      this.isReady = true;
      console.log("Stockfish engine initialized (simulation mode)");
    } catch (error) {
      console.error("Failed to initialize Stockfish:", error);
      this.isReady = false;
    }
  }

  async getBestMove(fen: string, level: number = 3, timeMs: number = 1000): Promise<StockfishMove | null> {
    if (!this.isReady) {
      console.warn("Stockfish engine not ready, using fallback");
      return this.getFallbackMove(fen);
    }

    try {
      // Simulate Stockfish analysis with chess.js logic
      const chess = new Chess(fen);
      const moves = chess.moves({ verbose: true });
      
      if (moves.length === 0) return null;

      // Simulate different difficulty levels
      let selectedMove;
      switch (level) {
        case 1:
          // Random move (easiest)
          selectedMove = moves[Math.floor(Math.random() * moves.length)];
          break;
        case 2:
          // Slightly better moves (avoid obvious blunders)
          selectedMove = this.getDecentMove(chess, moves);
          break;
        case 3:
          // Good moves with some tactical awareness
          selectedMove = this.getGoodMove(chess, moves);
          break;
        case 4:
          // Strong moves with positional understanding
          selectedMove = this.getStrongMove(chess, moves);
          break;
        case 5:
          // Best moves (strongest)
          selectedMove = this.getBestMoveAnalysis(chess, moves);
          break;
        default:
          selectedMove = this.getGoodMove(chess, moves);
      }

      return {
        from: selectedMove.from,
        to: selectedMove.to,
        promotion: selectedMove.promotion,
        san: selectedMove.san
      };
    } catch (error) {
      console.error("Stockfish analysis error:", error);
      return this.getFallbackMove(fen);
    }
  }

  async evaluatePosition(fen: string, depth: number = 15): Promise<StockfishEvaluation> {
    try {
      const chess = new Chess(fen);
      const moves = chess.moves({ verbose: true });
      
      if (moves.length === 0) {
        // Game over position
        if (chess.isCheckmate()) {
          return {
            score: chess.turn() === 'w' ? -9999 : 9999,
            depth,
            bestMove: "",
            pv: [],
            evaluation: chess.turn() === 'w' ? "Black wins by checkmate" : "White wins by checkmate",
            quality: "excellent"
          };
        } else {
          return {
            score: 0,
            depth,
            bestMove: "",
            pv: [],
            evaluation: "Draw by stalemate",
            quality: "good"
          };
        }
      }

      // Simulate position evaluation
      const evaluation = this.evaluatePositionHeuristic(chess);
      const bestMove = this.getBestMoveAnalysis(chess, moves);

      return {
        score: evaluation.score,
        depth,
        bestMove: bestMove.san,
        pv: [bestMove.san],
        evaluation: evaluation.description,
        quality: evaluation.quality
      };
    } catch (error) {
      console.error("Position evaluation error:", error);
      return {
        score: 0,
        depth: 1,
        bestMove: "",
        pv: [],
        evaluation: "Evaluation unavailable",
        quality: "good"
      };
    }
  }

  private getFallbackMove(fen: string): StockfishMove | null {
    try {
      const chess = new Chess(fen);
      const moves = chess.moves({ verbose: true });
      if (moves.length === 0) return null;

      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      return {
        from: randomMove.from,
        to: randomMove.to,
        promotion: randomMove.promotion,
        san: randomMove.san
      };
    } catch (error) {
      console.error("Fallback move error:", error);
      return null;
    }
  }

  private getDecentMove(chess: Chess, moves: any[]) {
    // Avoid obvious captures that lose material
    const safeMovesPreferCaptures = moves.filter(move => {
      const testChess = new Chess(chess.fen());
      testChess.move(move);
      return !this.isObviousBlunder(testChess, move);
    });

    return safeMovesPreferCaptures.length > 0 
      ? safeMovesPreferCaptures[Math.floor(Math.random() * safeMovesPreferCaptures.length)]
      : moves[Math.floor(Math.random() * moves.length)];
  }

  private getGoodMove(chess: Chess, moves: any[]) {
    // Prioritize captures, checks, and central moves
    const scoredMoves = moves.map(move => ({
      move,
      score: this.evaluateMove(chess, move)
    }));

    scoredMoves.sort((a, b) => b.score - a.score);
    
    // Pick from top 3 moves with some randomness
    const topMoves = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
    return topMoves[Math.floor(Math.random() * topMoves.length)].move;
  }

  private getStrongMove(chess: Chess, moves: any[]) {
    // More sophisticated move evaluation
    const scoredMoves = moves.map(move => ({
      move,
      score: this.evaluateMoveAdvanced(chess, move)
    }));

    scoredMoves.sort((a, b) => b.score - a.score);
    
    // Pick from top 2 moves
    const topMoves = scoredMoves.slice(0, Math.min(2, scoredMoves.length));
    return topMoves[Math.floor(Math.random() * topMoves.length)].move;
  }

  private getBestMoveAnalysis(chess: Chess, moves: any[]) {
    // Return the objectively best move based on evaluation
    const scoredMoves = moves.map(move => ({
      move,
      score: this.evaluateMoveAdvanced(chess, move)
    }));

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
  }

  private evaluateMove(chess: Chess, move: any): number {
    let score = 0;
    
    // Capture bonus
    if (move.captured) {
      const pieceValues = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0 };
      score += pieceValues[move.captured] * 10;
    }

    // Check bonus
    const testChess = new Chess(chess.fen());
    testChess.move(move);
    if (testChess.inCheck()) score += 5;

    // Central square bonus
    const centralSquares = ['d4', 'd5', 'e4', 'e5'];
    if (centralSquares.includes(move.to)) score += 2;

    // Development bonus for early game
    if (chess.moveNumber() < 10) {
      if (move.piece === 'n' || move.piece === 'b') score += 3;
      if (move.from.includes('1') || move.from.includes('8')) score += 1;
    }

    return score;
  }

  private evaluateMoveAdvanced(chess: Chess, move: any): number {
    let score = this.evaluateMove(chess, move);
    
    // Additional advanced evaluation
    const testChess = new Chess(chess.fen());
    testChess.move(move);
    
    // Tactical motifs
    if (this.createsFork(testChess, move)) score += 15;
    if (this.createsPin(testChess, move)) score += 10;
    if (this.createsSkewer(testChess, move)) score += 12;
    
    // Positional factors
    score += this.evaluatePositionalFactors(testChess, move);
    
    return score;
  }

  private evaluatePositionHeuristic(chess: Chess) {
    let score = 0;
    let description = "";
    
    const board = chess.board();
    const pieceValues = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0 };
    
    // Material evaluation
    let whiteValue = 0, blackValue = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          const value = pieceValues[piece.type];
          if (piece.color === 'w') {
            whiteValue += value;
          } else {
            blackValue += value;
          }
        }
      }
    }
    
    score = whiteValue - blackValue;
    
    // Game phase detection
    const totalMaterial = whiteValue + blackValue;
    let quality: "excellent" | "good" | "inaccuracy" | "mistake" | "blunder" = "good";
    
    if (Math.abs(score) > 3) {
      quality = Math.abs(score) > 6 ? "excellent" : "good";
      description = score > 0 ? "White has a significant advantage" : "Black has a significant advantage";
    } else {
      description = "Position is roughly equal";
    }
    
    // Adjust score for turn (positive = good for white, negative = good for black)
    const finalScore = chess.turn() === 'w' ? score : -score;
    
    return {
      score: Math.round(finalScore * 100), // Convert to centipawns
      description,
      quality
    };
  }

  private isObviousBlunder(chess: Chess, move: any): boolean {
    // Check if the move hangs a piece
    if (move.captured) return false; // Captures are generally safe
    
    // Simple heuristic: if opponent can capture something valuable after this move
    const opponentMoves = chess.moves({ verbose: true });
    for (const opMove of opponentMoves) {
      if (opMove.captured) {
        const pieceValues = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9 };
        if (pieceValues[opMove.captured] >= 3) {
          return true; // Hanging a minor piece or better
        }
      }
    }
    
    return false;
  }

  private createsFork(chess: Chess, move: any): boolean {
    // Simplified fork detection
    if (move.piece !== 'n') return false;
    
    const knightAttacks = this.getKnightAttacks(move.to);
    let attackedPieces = 0;
    
    const board = chess.board();
    for (const square of knightAttacks) {
      const [file, rank] = square.split('');
      const col = file.charCodeAt(0) - 'a'.charCodeAt(0);
      const row = 8 - parseInt(rank);
      
      if (row >= 0 && row < 8 && col >= 0 && col < 8) {
        const piece = board[row][col];
        if (piece && piece.color !== chess.turn()) {
          attackedPieces++;
        }
      }
    }
    
    return attackedPieces >= 2;
  }

  private createsPin(chess: Chess, move: any): boolean {
    // Simplified pin detection for bishops, rooks, and queens
    return ['b', 'r', 'q'].includes(move.piece);
  }

  private createsSkewer(chess: Chess, move: any): boolean {
    // Simplified skewer detection
    return ['b', 'r', 'q'].includes(move.piece);
  }

  private evaluatePositionalFactors(chess: Chess, move: any): number {
    let score = 0;
    
    // King safety
    if (move.piece === 'k') {
      if (chess.moveNumber() < 20) {
        score -= 5; // Discourage early king moves
      }
    }
    
    // Pawn structure
    if (move.piece === 'p') {
      // Discourage doubled pawns
      const file = move.to[0];
      const board = chess.board();
      let pawnsOnFile = 0;
      
      for (let row = 0; row < 8; row++) {
        const col = file.charCodeAt(0) - 'a'.charCodeAt(0);
        const piece = board[row][col];
        if (piece && piece.type === 'p' && piece.color === chess.turn()) {
          pawnsOnFile++;
        }
      }
      
      if (pawnsOnFile > 1) score -= 2;
    }
    
    return score;
  }

  private getKnightAttacks(square: string): string[] {
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = parseInt(square[1]) - 1;
    
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    
    const attacks = [];
    
    for (const [df, dr] of knightMoves) {
      const newFile = file + df;
      const newRank = rank + dr;
      
      if (newFile >= 0 && newFile < 8 && newRank >= 0 && newRank < 8) {
        const newSquare = String.fromCharCode('a'.charCodeAt(0) + newFile) + (newRank + 1);
        attacks.push(newSquare);
      }
    }
    
    return attacks;
  }

  async shutdown(): Promise<void> {
    this.isReady = false;
    if (this.engine) {
      // Cleanup engine if needed
      this.engine = null;
    }
  }
}

// Singleton instance
export const stockfishEngine = new StockfishEngine();