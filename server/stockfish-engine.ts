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
    try {
      // Validate FEN first
      const chess = new Chess(fen);
      const moves = chess.moves({ verbose: true });

      if (moves.length === 0) {
        return null;
      }

      // Check transposition table first for instant response
      const tableKey = `${fen}-${level}`;
      if (this.transpositionTable.has(tableKey)) {
        const cached = this.transpositionTable.get(tableKey);
        if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
          return cached.move;
        }
      }

      // Fast move selection based on level
      const selectedMove = this.getFastMove(chess, moves, level);

      if (!selectedMove) {
        return this.getInstantMove(moves);
      }

      const result = {
        from: selectedMove.from,
        to: selectedMove.to,
        promotion: selectedMove.promotion,
        san: selectedMove.san
      };

      // Quick validation
      const testChess = new Chess(fen);
      const validatedMove = testChess.move(result);
      
      if (!validatedMove) {
        return this.getInstantMove(moves);
      }

      // Cache the result
      this.transpositionTable.set(tableKey, {
        move: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error("Error in getBestMove:", error);
      return this.getInstantMove(chess.moves({ verbose: true }));
    }
  }

  private getFastMove(chess: Chess, moves: any[], level: number): any {
    try {
      switch (level) {
        case 1:
          return this.getRandomMove(moves);
        case 2:
          return this.getBasicTacticalMove(chess, moves);
        case 3:
          return this.getQuickGoodMove(chess, moves);
        case 4:
        case 5:
          return this.getQuickStrongMove(chess, moves);
        case 6:
        case 7:
        case 8:
        case 9:
        case 10:
          return this.getQuickBestMove(chess, moves);
        default:
          return this.getQuickGoodMove(chess, moves);
      }
    } catch (error) {
      return this.getRandomMove(moves);
    }
  }

  private getInstantMove(moves: any[]): StockfishMove | null {
    if (moves.length === 0) return null;
    const move = moves[Math.floor(Math.random() * moves.length)];
    return {
      from: move.from,
      to: move.to,
      promotion: move.promotion,
      san: move.san
    };
  }

  private getBasicTacticalMove(chess: Chess, moves: any[]): any {
    // Quick check for captures and checks only
    const captures = moves.filter(move => move.captured);
    if (captures.length > 0 && Math.random() > 0.3) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return this.getRandomMove(moves);
  }

  private getQuickGoodMove(chess: Chess, moves: any[]): any {
    // Fast heuristic evaluation - no deep calculation
    const scoredMoves = moves.map(move => {
      let score = Math.random() * 10; // Base randomness
      
      // Quick bonuses
      if (move.captured) score += 30;
      if (['d4', 'e4', 'd5', 'e5'].includes(move.to)) score += 10;
      if (move.piece === 'n' || move.piece === 'b') score += 5;
      
      return { move, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    
    // Pick from top 3 moves with some randomness
    const topMoves = scoredMoves.slice(0, 3);
    return topMoves[Math.floor(Math.random() * topMoves.length)].move;
  }

  private getQuickStrongMove(chess: Chess, moves: any[]): any {
    // Slightly better evaluation but still fast
    const scoredMoves = moves.map(move => {
      let score = 0;
      
      // Material gain
      if (move.captured) {
        const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9 };
        score += (pieceValues[move.captured] || 0) * 10;
      }
      
      // Central control
      if (['d4', 'e4', 'd5', 'e5', 'c4', 'f4', 'c5', 'f5'].includes(move.to)) {
        score += 8;
      }
      
      // Development
      if ((move.piece === 'n' || move.piece === 'b') && 
          ['b1', 'g1', 'b8', 'g8', 'c1', 'f1', 'c8', 'f8'].includes(move.from)) {
        score += 6;
      }
      
      // Quick check evaluation
      chess.move(move);
      if (chess.isCheck()) score += 5;
      chess.undo();
      
      return { move, score: score + Math.random() * 2 };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    
    // Pick from top 5 moves with weighted randomness
    const weights = [0.5, 0.25, 0.15, 0.06, 0.04];
    const rand = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < Math.min(5, scoredMoves.length); i++) {
      cumulative += weights[i];
      if (rand < cumulative) {
        return scoredMoves[i].move;
      }
    }
    
    return scoredMoves[0].move;
  }

  private getQuickBestMove(chess: Chess, moves: any[]): any {
    // Best move with minimal calculation time
    return this.getBestMoveByQuickEvaluation(chess, moves);
  }

  private getBestMoveByQuickEvaluation(chess: Chess, moves: any[]): any {
    const evaluatedMoves = moves.map(move => {
      try {
        chess.move(move);
        const evaluation = this.quickEvaluatePosition(chess);
        chess.undo();
        
        return {
          move,
          evaluation: chess.turn() === 'w' ? -evaluation : evaluation
        };
      } catch (error) {
        chess.undo();
        return { move, evaluation: -1000 };
      }
    });

    evaluatedMoves.sort((a, b) => b.evaluation - a.evaluation);
    
    // Add some randomness to top moves to avoid predictability
    const topCount = Math.min(3, evaluatedMoves.length);
    const selectedIndex = Math.floor(Math.random() * topCount);
    
    return evaluatedMoves[selectedIndex].move;
  }

  private quickEvaluatePosition(chess: Chess): number {
    // Ultra-fast position evaluation
    const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
    let evaluation = 0;
    const board = chess.board();

    // Material count only - no complex positional evaluation
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const value = pieceValues[piece.type] || 0;
          evaluation += piece.color === 'w' ? value : -value;
        }
      }
    }

    return evaluation;
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

      return this.getSmartFallbackMove(chess, moves);
    } catch (error) {
      console.error("Error in fallback move:", error);
      return null;
    }
  }

  private getSmartFallbackMove(chess: Chess, moves: any[]): StockfishMove | null {
    try {
      if (moves.length === 0) return null;

      // Prioritize captures, checks, and central moves
      const captureMoves = moves.filter(move => move.captured);
      const checkMoves = moves.filter(move => {
        chess.move(move);
        const isCheck = chess.isCheck();
        chess.undo();
        return isCheck;
      });
      const centralMoves = moves.filter(move => {
        const to = move.to;
        return ['d4', 'e4', 'd5', 'e5', 'c4', 'f4', 'c5', 'f5'].includes(to);
      });

      let candidateMoves = [];
      
      if (captureMoves.length > 0) {
        candidateMoves = captureMoves;
      } else if (checkMoves.length > 0) {
        candidateMoves = checkMoves;
      } else if (centralMoves.length > 0) {
        candidateMoves = centralMoves;
      } else {
        candidateMoves = moves;
      }

      const selectedMove = candidateMoves[Math.floor(Math.random() * candidateMoves.length)];
      
      return {
        from: selectedMove.from,
        to: selectedMove.to,
        promotion: selectedMove.promotion,
        san: selectedMove.san
      };
    } catch (error) {
      console.error("Error in smart fallback:", error);
      // Ultimate fallback - just pick the first legal move
      const firstMove = moves[0];
      return firstMove ? {
        from: firstMove.from,
        to: firstMove.to,
        promotion: firstMove.promotion,
        san: firstMove.san
      } : null;
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
          depth: 1,
          bestMove: '',
          pv: [],
          evaluation: chess.isCheckmate() ? 'checkmate' : 'stalemate',
          quality: chess.isCheckmate() ? 'blunder' : 'good'
        };
      }

      // Quick evaluation - just pick a reasonable move
      const bestMove = this.getQuickBestMove(chess, moves);
      const bestEval = this.quickEvaluatePosition(chess);

      let quality: "excellent" | "good" | "inaccuracy" | "mistake" | "blunder";
      if (bestEval > 200) quality = 'excellent';
      else if (bestEval > 50) quality = 'good';
      else if (bestEval > -50) quality = 'inaccuracy';
      else if (bestEval > -200) quality = 'mistake';
      else quality = 'blunder';

      return {
        score: bestEval,
        depth: 1,
        bestMove: bestMove.san,
        pv: [bestMove.san],
        evaluation: `${bestEval > 0 ? '+' : ''}${(bestEval / 100).toFixed(2)}`,
        quality
      };

    } catch (error) {
      console.error("Error evaluating position:", error);
      return {
        score: 0,
        depth: 1,
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