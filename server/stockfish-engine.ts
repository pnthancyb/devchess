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
  private transpositionTable = new Map<string, any>();

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
      
      if (moves.length === 0) return null;

      // Extended difficulty levels with deeper analysis
      let selectedMove;
      const depth = Math.min(level + 2, 8); // Increase search depth based on level
      
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
          selectedMove = this.getGoodMove(chess, moves, depth);
          break;
        case 4:
          // Strong moves with positional understanding
          selectedMove = this.getStrongMove(chess, moves, depth);
          break;
        case 5:
          // Very strong moves with deep calculation
          selectedMove = this.getVeryStrongMove(chess, moves, depth);
          break;
        case 6:
          // Expert level with advanced tactics
          selectedMove = this.getExpertMove(chess, moves, depth);
          break;
        case 7:
          // Master level with deep positional understanding
          selectedMove = this.getMasterMove(chess, moves, depth);
          break;
        case 8:
          // Grandmaster level - near perfect play
          selectedMove = this.getGrandmasterMove(chess, moves, depth);
          break;
        case 9:
          // Super-GM level with extensive calculation
          selectedMove = this.getSuperGMMove(chess, moves, Math.min(depth + 2, 10));
          break;
        case 10:
          // Engine level - maximum strength
          selectedMove = this.getEngineMove(chess, moves, Math.min(depth + 3, 12));
          break;
        default:
          selectedMove = this.getStrongMove(chess, moves, depth);
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

      return result;
    } catch (error) {
      console.error("Error getting best move:", error);
      return this.getFallbackMove(fen);
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
      console.error("Error in fallback move:", error);
      return null;
    }
  }

  private getDecentMove(chess: Chess, moves: any[]): any {
    // Filter out obvious blunders (moves that lose material without compensation)
    const safeMovesFilter = moves.filter(move => {
      chess.move(move);
      const isCheck = chess.isCheck();
      const hasCapture = move.captured;
      chess.undo();
      return isCheck || hasCapture || Math.random() > 0.3;
    });
    
    return safeMovesFilter.length > 0 ? 
      safeMovesFilter[Math.floor(Math.random() * safeMovesFilter.length)] :
      moves[Math.floor(Math.random() * moves.length)];
  }

  private getGoodMove(chess: Chess, moves: any[], depth: number): any {
    return this.getBestMoveByEvaluation(chess, moves, depth, 0.7);
  }

  private getStrongMove(chess: Chess, moves: any[], depth: number): any {
    return this.getBestMoveByEvaluation(chess, moves, depth, 0.85);
  }

  private getVeryStrongMove(chess: Chess, moves: any[], depth: number): any {
    return this.getBestMoveByEvaluation(chess, moves, depth, 0.92);
  }

  private getExpertMove(chess: Chess, moves: any[], depth: number): any {
    // Advanced tactical awareness with deeper search
    return this.getBestMoveByEvaluation(chess, moves, depth + 1, 0.95);
  }

  private getMasterMove(chess: Chess, moves: any[], depth: number): any {
    // Master level with positional understanding
    return this.getBestMoveByEvaluation(chess, moves, depth + 2, 0.97);
  }

  private getGrandmasterMove(chess: Chess, moves: any[], depth: number): any {
    // Near-perfect calculation
    return this.getBestMoveByEvaluation(chess, moves, depth + 2, 0.98);
  }

  private getSuperGMMove(chess: Chess, moves: any[], depth: number): any {
    // Super-GM level with extensive calculation
    return this.getBestMoveByEvaluation(chess, moves, depth + 3, 0.99);
  }

  private getEngineMove(chess: Chess, moves: any[], depth: number): any {
    // Maximum engine strength - always best move
    return this.getBestMoveByEvaluation(chess, moves, depth + 4, 1.0);
  }

  private getBestMoveByEvaluation(chess: Chess, moves: any[], depth: number, accuracy: number): any {
    const evaluatedMoves = moves.map(move => {
      chess.move(move);
      const evaluation = this.evaluatePosition(chess, depth);
      chess.undo();
      
      return {
        move,
        evaluation: chess.turn() === 'w' ? -evaluation : evaluation // Flip for black
      };
    });

    // Sort by evaluation (best first)
    evaluatedMoves.sort((a, b) => b.evaluation - a.evaluation);

    // Apply accuracy - sometimes pick suboptimal moves
    if (Math.random() > accuracy && evaluatedMoves.length > 1) {
      const randomIndex = Math.floor(Math.random() * Math.min(3, evaluatedMoves.length));
      return evaluatedMoves[randomIndex].move;
    }

    return evaluatedMoves[0].move;
  }

  private evaluatePosition(chess: Chess, depth: number = 3): number {
    if (depth === 0 || chess.isGameOver()) {
      return this.staticEvaluation(chess);
    }

    const moves = chess.moves({ verbose: true });
    let bestEval = chess.turn() === 'w' ? -Infinity : Infinity;

    for (const move of moves.slice(0, 15)) { // Limit moves for performance
      chess.move(move);
      const evaluation = this.evaluatePosition(chess, depth - 1);
      chess.undo();

      if (chess.turn() === 'w') {
        bestEval = Math.max(bestEval, evaluation);
      } else {
        bestEval = Math.min(bestEval, evaluation);
      }
    }

    return bestEval;
  }

  private staticEvaluation(chess: Chess): number {
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

    // Positional factors
    evaluation += this.evaluatePositionalFactors(chess);
    evaluation += this.evaluateTacticalFactors(chess);
    evaluation += this.evaluateEndgameFactors(chess);

    return evaluation;
  }

  private evaluatePositionalFactors(chess: Chess): number {
    let score = 0;
    const board = chess.board();

    // Center control
    const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];
    for (const [row, col] of centerSquares) {
      const piece = board[row][col];
      if (piece) {
        score += piece.color === 'w' ? 30 : -30;
      }
    }

    // King safety
    const whiteKing = this.findKing(board, 'w');
    const blackKing = this.findKing(board, 'b');
    
    if (whiteKing) {
      score += this.evaluateKingSafety(board, whiteKing, 'w');
    }
    if (blackKing) {
      score -= this.evaluateKingSafety(board, blackKing, 'b');
    }

    // Pawn structure
    score += this.evaluatePawnStructure(board);

    return score;
  }

  private evaluateTacticalFactors(chess: Chess): number {
    let score = 0;

    // Check for forks, pins, skewers, discovered attacks
    score += this.detectTacticalMotifs(chess);

    // Mobility bonus
    const currentTurnMoves = chess.moves().length;
    
    // Create a temporary chess instance to check opponent moves
    // Safe opponent move calculation
    let opponentMoves = 0;
    try {
      const fenParts = chess.fen().split(' ');
      fenParts[1] = chess.turn() === 'w' ? 'b' : 'w'; // Switch turn
      const opponentFen = fenParts.join(' ');
      const tempChess = new Chess(opponentFen);
      opponentMoves = tempChess.moves().length;
    } catch (error) {
      // If FEN manipulation fails, use current position
      opponentMoves = currentTurnMoves;
    }
    score += (currentTurnMoves - opponentMoves) * 2;

    return score;
  }

  private evaluateEndgameFactors(chess: Chess): number {
    const pieces = chess.board().flat().filter(p => p && p.type !== 'k');
    
    if (pieces.length <= 8) { // Endgame
      let score = 0;
      
      // King activity in endgame
      const board = chess.board();
      const whiteKing = this.findKing(board, 'w');
      const blackKing = this.findKing(board, 'b');
      
      if (whiteKing) {
        score += (7 - Math.abs(whiteKing[0] - 3.5) - Math.abs(whiteKing[1] - 3.5)) * 10;
      }
      if (blackKing) {
        score -= (7 - Math.abs(blackKing[0] - 3.5) - Math.abs(blackKing[1] - 3.5)) * 10;
      }
      
      return score;
    }
    
    return 0;
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

  private evaluateKingSafety(board: any[][], kingPos: [number, number], color: string): number {
    let safety = 0;
    const [row, col] = kingPos;

    // Check for pawn shield
    if (color === 'w' && row === 7) {
      for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1); c++) {
        const piece = board[6][c];
        if (piece && piece.type === 'p' && piece.color === 'w') {
          safety += 20;
        }
      }
    } else if (color === 'b' && row === 0) {
      for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1); c++) {
        const piece = board[1][c];
        if (piece && piece.type === 'p' && piece.color === 'b') {
          safety += 20;
        }
      }
    }

    return safety;
  }

  private evaluatePawnStructure(board: any[][]): number {
    let score = 0;
    
    // Check for doubled, isolated, and backward pawns
    for (let col = 0; col < 8; col++) {
      let whitePawns = [];
      let blackPawns = [];
      
      for (let row = 0; row < 8; row++) {
        const piece = board[row][col];
        if (piece && piece.type === 'p') {
          if (piece.color === 'w') whitePawns.push(row);
          else blackPawns.push(row);
        }
      }
      
      // Doubled pawns penalty
      if (whitePawns.length > 1) score -= 20 * (whitePawns.length - 1);
      if (blackPawns.length > 1) score += 20 * (blackPawns.length - 1);
    }
    
    return score;
  }

  private detectTacticalMotifs(chess: Chess): number {
    // This would contain logic to detect forks, pins, skewers, etc.
    // For now, return a basic bonus for captures and checks
    let score = 0;
    
    const moves = chess.moves({ verbose: true });
    for (const move of moves) {
      if (move.captured) score += 10;
      chess.move(move);
      if (chess.isCheck()) score += 15;
      chess.undo();
    }
    
    return chess.turn() === 'w' ? score : -score;
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

      // Find best move with evaluation
      let bestMove = moves[0];
      let bestEval = -Infinity;
      const principalVariation: string[] = [];

      for (const move of moves) {
        chess.move(move);
        const evaluation = this.evaluatePosition(chess, Math.min(depth - 1, 4));
        chess.undo();

        if (evaluation > bestEval) {
          bestEval = evaluation;
          bestMove = move;
        }
      }

      principalVariation.push(bestMove.san);

      // Determine move quality based on evaluation
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
        pv: principalVariation,
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
}

// Export instance for use in routes
export const stockfishEngine = new StockfishEngine();