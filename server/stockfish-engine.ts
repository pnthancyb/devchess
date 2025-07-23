import { spawn, type ChildProcess } from "child_process";
import { Chess } from "chess.js";

export interface StockfishMove {
  from: string;
  to: string;
  promotion?: string;
  san?: string;
}

export interface StockfishEvaluation {
  score: number;
  depth: number;
  bestMove: string;
  pv: string[];
  evaluation: string;
  quality: "excellent" | "good" | "inaccuracy" | "mistake" | "blunder";
}

class StockfishEngine {
  private engine: ChildProcess | null = null;
  private isReady = false;
  private engineQueue: Array<{
    command: string;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout?: NodeJS.Timeout;
  }> = [];
  private transpositionTable = new Map<string, any>();
  private usingFallback = true; // Start with fallback mode

  constructor() {
    this.initializeEngine();
  }

  private async initializeEngine() {
    console.log("Stockfish engine initialized (enhanced simulation mode)");
    this.isReady = true;
    this.usingFallback = true;
  }

  async getBestMove(fen: string, level: number = 5, timeMs: number = 2000): Promise<StockfishMove | null> {
    if (!this.isReady) {
      console.warn("Stockfish engine not ready, using fallback");
      return this.getFallbackMove(fen);
    }

    try {
      // Check transposition table first
      const tableKey = `${fen}-${level}`;
      if (this.transpositionTable.has(tableKey)) {
        const cached = this.transpositionTable.get(tableKey);
        if (Date.now() - cached.timestamp < 30000) { // 30 second cache
          return cached.move;
        }
      }

      const chess = new Chess(fen);
      const moves = chess.moves({ verbose: true });

      if (moves.length === 0) {
        console.log("No legal moves available");
        return null;
      }

      // Always use enhanced simulation since real Stockfish isn't available
      const selectedMove = this.getEnhancedMove(chess, moves, level);

      if (!selectedMove) {
        console.log("Failed to select enhanced move, using random fallback");
        return this.getFallbackMove(fen);
      }

      const result = {
        from: selectedMove.from,
        to: selectedMove.to,
        promotion: selectedMove.promotion,
        san: selectedMove.san
      };

      // Cache the result
      this.transpositionTable.set(tableKey, {
        move: result,
        timestamp: Date.now()
      });

      console.log(`Stockfish (level ${level}) selected move:`, result);
      return result;
    } catch (error) {
      console.error("Error getting best move:", error);
      return this.getFallbackMove(fen);
    }
  }

  private getEnhancedMove(chess: Chess, moves: any[], level: number): any {
    const depth = Math.min(level + 2, 8);

    try {
      switch (level) {
        case 1:
          return this.getRandomMove(moves);
        case 2:
          return this.getDecentMove(chess, moves);
        case 3:
          return this.getGoodMove(chess, moves, depth);
        case 4:
        case 5:
          return this.getStrongMove(chess, moves, depth);
        case 6:
        case 7:
          return this.getExpertMove(chess, moves, depth);
        case 8:
        case 9:
        case 10:
          return this.getMasterMove(chess, moves, depth);
        default:
          return this.getStrongMove(chess, moves, depth);
      }
    } catch (error) {
      console.error("Error in enhanced move selection:", error);
      return this.getRandomMove(moves);
    }
  }

  private getRandomMove(moves: any[]): any {
    if (moves.length === 0) return null;
    return moves[Math.floor(Math.random() * moves.length)];
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
      console.error("Error in fallback move:", error);
      return null;
    }
  }

  private getDecentMove(chess: Chess, moves: any[]): any {
    try {
      // Prioritize captures and checks
      const tacticalMoves = moves.filter(move => {
        chess.move(move);
        const isCheck = chess.isCheck();
        const hasCapture = move.captured;
        chess.undo();
        return isCheck || hasCapture;
      });

      if (tacticalMoves.length > 0) {
        return tacticalMoves[Math.floor(Math.random() * tacticalMoves.length)];
      }

      // Otherwise random move
      return this.getRandomMove(moves);
    } catch (error) {
      console.error("Error in decent move:", error);
      return this.getRandomMove(moves);
    }
  }

  private getGoodMove(chess: Chess, moves: any[], depth: number): any {
    return this.getBestMoveByEvaluation(chess, moves, depth, 0.7);
  }

  private getStrongMove(chess: Chess, moves: any[], depth: number): any {
    return this.getBestMoveByEvaluation(chess, moves, depth, 0.85);
  }

  private getExpertMove(chess: Chess, moves: any[], depth: number): any {
    return this.getBestMoveByEvaluation(chess, moves, depth + 1, 0.95);
  }

  private getMasterMove(chess: Chess, moves: any[], depth: number): any {
    return this.getBestMoveByEvaluation(chess, moves, depth + 2, 0.98);
  }

  private getBestMoveByEvaluation(chess: Chess, moves: any[], depth: number, accuracy: number): any {
    try {
      const evaluatedMoves = moves.map(move => {
        try {
          chess.move(move);
          const evaluation = this.evaluatePosition(chess, Math.min(depth, 4));
          chess.undo();

          return {
            move,
            evaluation: chess.turn() === 'w' ? -evaluation : evaluation
          };
        } catch (error) {
          chess.undo();
          return {
            move,
            evaluation: -1000
          };
        }
      });

      evaluatedMoves.sort((a, b) => b.evaluation - a.evaluation);

      if (Math.random() > accuracy && evaluatedMoves.length > 1) {
        const randomIndex = Math.floor(Math.random() * Math.min(3, evaluatedMoves.length));
        return evaluatedMoves[randomIndex].move;
      }

      return evaluatedMoves[0].move;
    } catch (error) {
      console.error("Error in move evaluation:", error);
      return this.getRandomMove(moves);
    }
  }

  private evaluatePosition(chess: Chess, depth: number = 3): number {
    try {
      if (depth === 0 || chess.isGameOver()) {
        return this.staticEvaluation(chess);
      }

      const moves = chess.moves({ verbose: true });
      let bestEval = chess.turn() === 'w' ? -Infinity : Infinity;

      for (const move of moves.slice(0, 10)) { // Limit search width
        try {
          chess.move(move);
          const evaluation = this.evaluatePosition(chess, depth - 1);
          chess.undo();

          if (chess.turn() === 'w') {
            bestEval = Math.max(bestEval, evaluation);
          } else {
            bestEval = Math.min(bestEval, evaluation);
          }
        } catch (error) {
          chess.undo();
          continue;
        }
      }

      return bestEval;
    } catch (error) {
      console.error("Error in position evaluation:", error);
      return 0;
    }
  }

  private staticEvaluation(chess: Chess): number {
    try {
      const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
      let evaluation = 0;
      const board = chess.board();

      // Material count
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const piece = board[i][j];
          if (piece) {
            const value = pieceValues[piece.type] || 0;
            evaluation += piece.color === 'w' ? value : -value;
          }
        }
      }

      // Add some positional factors
      evaluation += this.evaluateCenter(board);
      evaluation += this.evaluateKingSafety(board);

      return evaluation;
    } catch (error) {
      console.error("Error in static evaluation:", error);
      return 0;
    }
  }

  private evaluateCenter(board: any[][]): number {
    let score = 0;
    const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];

    for (const [row, col] of centerSquares) {
      const piece = board[row][col];
      if (piece) {
        score += piece.color === 'w' ? 30 : -30;
      }
    }

    return score;
  }

  private evaluateKingSafety(board: any[][]): number {
    let score = 0;

    // Simple king safety evaluation
    const whiteKing = this.findKing(board, 'w');
    const blackKing = this.findKing(board, 'b');

    if (whiteKing && whiteKing[0] === 7) score += 20; // White king on back rank
    if (blackKing && blackKing[0] === 0) score -= 20; // Black king on back rank

    return score;
  }

  private findKing(board: any[][], color: string): [number, number] | null {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece && piece.type === 'k' && piece.color === color) {
          return [i, j];
        }
      }
    }
    return null;
  }

  async evaluatePositionAsync(fen: string, depth: number = 8): Promise<StockfishEvaluation> {
    try {
      const chess = new Chess(fen);
      const moves = chess.moves({ verbose: true });

      if (moves.length === 0) {
        const score = chess.isCheckmate() ? -10000 : 0;
        return {
          score,
          depth,
          bestMove: '',
          pv: [],
          evaluation: chess.isCheckmate() ? 'checkmate' : 'stalemate',
          quality: chess.isCheckmate() ? 'blunder' : 'good'
        };
      }

      let bestMove = moves[0];
      let bestEval = -Infinity;

      for (const move of moves) {
        chess.move(move);
        const evaluation = this.evaluatePosition(chess, Math.min(depth - 1, 4));
        chess.undo();

        if (evaluation > bestEval) {
          bestEval = evaluation;
          bestMove = move;
        }
      }

      let quality: "excellent" | "good" | "inaccuracy" | "mistake" | "blunder";
      if (bestEval > 200) quality = 'excellent';
      else if (bestEval > 50) quality = 'good';
      else if (bestEval > -50) quality = 'inaccuracy';
      else if (bestEval > -200) quality = 'mistake';
      else quality = 'blunder';

      return {
        score: bestEval,
        depth,
        bestMove: bestMove.san,
        pv: [bestMove.san],
        evaluation: `${bestEval > 0 ? '+' : ''}${(bestEval / 100).toFixed(2)}`,
        quality
      };

    } catch (error) {
      console.error("Error evaluating position:", error);
      return {
        score: 0,
        depth: 0,
        bestMove: '',
        pv: [],
        evaluation: '0.00',
        quality: 'good'
      };
    }
  }

  public getEngineStatus(): { isReady: boolean; usingFallback: boolean; engineType: string } {
    return {
      isReady: this.isReady,
      usingFallback: this.usingFallback,
      engineType: 'Enhanced Simulation Engine'
    };
  }

  public cleanup() {
    if (this.engine) {
      this.engine.kill();
      this.engine = null;
    }
    this.isReady = false;
  }
}

export const stockfishEngine = new StockfishEngine();