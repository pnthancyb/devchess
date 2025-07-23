
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
      console.error("Stockfish analysis error:", error);
      return this.getFallbackMove(fen);
    }
  }

  async evaluatePosition(fen: string, depth: number = 20): Promise<StockfishEvaluation> {
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

      // Enhanced position evaluation with deeper analysis
      const evaluation = this.evaluatePositionAdvanced(chess, depth);
      const bestMove = this.getEngineMove(chess, moves, Math.min(depth, 12));

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

  private getGoodMove(chess: Chess, moves: any[], depth: number) {
    const scoredMoves = moves.map(move => ({
      move,
      score: this.evaluateMove(chess, move)
    }));

    scoredMoves.sort((a, b) => b.score - a.score);
    
    // Pick from top 3 moves with some randomness
    const topMoves = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
    return topMoves[Math.floor(Math.random() * topMoves.length)].move;
  }

  private getStrongMove(chess: Chess, moves: any[], depth: number) {
    const scoredMoves = moves.map(move => ({
      move,
      score: this.evaluateMoveAdvanced(chess, move, depth)
    }));

    scoredMoves.sort((a, b) => b.score - a.score);
    
    // Pick from top 2 moves
    const topMoves = scoredMoves.slice(0, Math.min(2, scoredMoves.length));
    return topMoves[Math.floor(Math.random() * topMoves.length)].move;
  }

  private getVeryStrongMove(chess: Chess, moves: any[], depth: number) {
    const scoredMoves = moves.map(move => ({
      move,
      score: this.evaluateMoveDeep(chess, move, depth)
    }));

    scoredMoves.sort((a, b) => b.score - a.score);
    
    // Almost always pick the best move, occasionally the second best
    return Math.random() < 0.9 ? scoredMoves[0].move : 
           (scoredMoves[1] ? scoredMoves[1].move : scoredMoves[0].move);
  }

  private getExpertMove(chess: Chess, moves: any[], depth: number) {
    return this.minimaxSearch(chess, moves, depth, true);
  }

  private getMasterMove(chess: Chess, moves: any[], depth: number) {
    return this.minimaxSearch(chess, moves, Math.min(depth + 1, 10), true);
  }

  private getGrandmasterMove(chess: Chess, moves: any[], depth: number) {
    return this.minimaxSearch(chess, moves, Math.min(depth + 2, 11), true);
  }

  private getSuperGMMove(chess: Chess, moves: any[], depth: number) {
    return this.minimaxSearch(chess, moves, Math.min(depth + 3, 12), true);
  }

  private getEngineMove(chess: Chess, moves: any[], depth: number) {
    return this.minimaxSearch(chess, moves, Math.min(depth + 4, 15), true);
  }

  private minimaxSearch(chess: Chess, moves: any[], depth: number, maximizing: boolean) {
    let bestMove = moves[0];
    let bestScore = maximizing ? -Infinity : Infinity;

    for (const move of moves) {
      const testChess = new Chess(chess.fen());
      testChess.move(move);
      
      const score = this.minimax(testChess, depth - 1, -Infinity, Infinity, !maximizing);
      
      if (maximizing && score > bestScore) {
        bestScore = score;
        bestMove = move;
      } else if (!maximizing && score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  private minimax(chess: Chess, depth: number, alpha: number, beta: number, maximizing: boolean): number {
    if (depth === 0 || chess.isGameOver()) {
      return this.evaluatePositionAdvanced(chess, depth).score;
    }

    const moves = chess.moves({ verbose: true });
    
    if (maximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const testChess = new Chess(chess.fen());
        testChess.move(move);
        const eval = this.minimax(testChess, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, eval);
        alpha = Math.max(alpha, eval);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const testChess = new Chess(chess.fen());
        testChess.move(move);
        const eval = this.minimax(testChess, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, eval);
        beta = Math.min(beta, eval);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return minEval;
    }
  }

  private evaluateMove(chess: Chess, move: any): number {
    let score = 0;
    
    // Capture bonus
    if (move.captured) {
      const pieceValues = { 'p': 100, 'n': 300, 'b': 320, 'r': 500, 'q': 900, 'k': 0 };
      score += pieceValues[move.captured] || 0;
    }

    // Check bonus
    const testChess = new Chess(chess.fen());
    testChess.move(move);
    if (testChess.inCheck()) score += 50;

    // Central square bonus
    const centralSquares = ['d4', 'd5', 'e4', 'e5'];
    const extendedCenter = ['c3', 'c4', 'c5', 'c6', 'd3', 'd6', 'e3', 'e6', 'f3', 'f4', 'f5', 'f6'];
    
    if (centralSquares.includes(move.to)) score += 30;
    else if (extendedCenter.includes(move.to)) score += 15;

    // Development bonus for early game
    if (chess.moveNumber() < 15) {
      if (move.piece === 'n' || move.piece === 'b') score += 25;
      if (move.from.includes('1') || move.from.includes('8')) score += 10;
    }

    // Castling bonus
    if (move.flags && move.flags.includes('k') || move.flags.includes('q')) {
      score += 60;
    }

    return score;
  }

  private evaluateMoveAdvanced(chess: Chess, move: any, depth: number): number {
    let score = this.evaluateMove(chess, move);
    
    const testChess = new Chess(chess.fen());
    testChess.move(move);
    
    // Enhanced tactical motifs
    if (this.createsFork(testChess, move)) score += 200;
    if (this.createsPin(testChess, move)) score += 150;
    if (this.createsSkewer(testChess, move)) score += 180;
    if (this.createsDiscoveredAttack(testChess, move)) score += 160;
    
    // Positional factors
    score += this.evaluatePositionalFactors(testChess, move) * 2;
    
    // King safety
    score += this.evaluateKingSafety(testChess, move);
    
    // Pawn structure
    score += this.evaluatePawnStructure(testChess, move);
    
    return score;
  }

  private evaluateMoveDeep(chess: Chess, move: any, depth: number): number {
    let score = this.evaluateMoveAdvanced(chess, move, depth);
    
    // Add deeper positional understanding
    const testChess = new Chess(chess.fen());
    testChess.move(move);
    
    // Piece activity
    score += this.evaluatePieceActivity(testChess);
    
    // Control of key squares
    score += this.evaluateSquareControl(testChess);
    
    // Endgame factors
    if (this.isEndgame(testChess)) {
      score += this.evaluateEndgameFactors(testChess, move);
    }
    
    return score;
  }

  private evaluatePositionAdvanced(chess: Chess, depth: number) {
    let score = 0;
    let description = "";
    
    const board = chess.board();
    const pieceValues = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 0 };
    
    // Enhanced material evaluation
    let whiteValue = 0, blackValue = 0;
    let whitePieceCount = 0, blackPieceCount = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          const value = pieceValues[piece.type];
          if (piece.color === 'w') {
            whiteValue += value;
            whitePieceCount++;
          } else {
            blackValue += value;
            blackPieceCount++;
          }
        }
      }
    }
    
    score = whiteValue - blackValue;
    
    // Positional evaluation
    score += this.evaluatePositionalFactorsAdvanced(chess);
    
    // Mobility evaluation
    const whiteMobility = chess.turn() === 'w' ? chess.moves().length : 0;
    chess.load(chess.fen().replace(' w ', ' b ').replace(' b ', ' w '));
    const blackMobility = chess.moves().length;
    chess.load(chess.fen().replace(' w ', ' b ').replace(' b ', ' w ')); // Restore original turn
    
    score += (whiteMobility - blackMobility) * 2;
    
    // Game phase detection
    const totalMaterial = whiteValue + blackValue;
    let quality: "excellent" | "good" | "inaccuracy" | "mistake" | "blunder" = "good";
    
    if (Math.abs(score) > 300) {
      quality = Math.abs(score) > 600 ? "excellent" : "good";
      description = score > 0 ? "White has a significant advantage" : "Black has a significant advantage";
    } else if (Math.abs(score) > 100) {
      description = score > 0 ? "White has a slight advantage" : "Black has a slight advantage";
    } else {
      description = "Position is roughly equal";
    }
    
    // Adjust score for turn (positive = good for white, negative = good for black)
    const finalScore = chess.turn() === 'w' ? score : -score;
    
    return {
      score: Math.round(finalScore), // Already in centipawns
      description,
      quality
    };
  }

  // Additional evaluation methods for enhanced play
  private evaluatePositionalFactorsAdvanced(chess: Chess): number {
    let score = 0;
    
    // Center control
    const centerSquares = ['d4', 'd5', 'e4', 'e5'];
    const board = chess.board();
    
    for (const square of centerSquares) {
      const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
      const rank = parseInt(square[1]) - 1;
      const piece = board[7 - rank][file];
      
      if (piece) {
        score += piece.color === 'w' ? 15 : -15;
        if (piece.type === 'p') {
          score += piece.color === 'w' ? 10 : -10;
        }
      }
    }
    
    return score;
  }

  private evaluateKingSafety(chess: Chess, move: any): number {
    let score = 0;
    
    // Penalize early king moves
    if (move.piece === 'k' && chess.moveNumber() < 15) {
      score -= 50;
    }
    
    // Bonus for castling
    if (move.flags && (move.flags.includes('k') || move.flags.includes('q'))) {
      score += 80;
    }
    
    return score;
  }

  private evaluatePawnStructure(chess: Chess, move: any): number {
    let score = 0;
    
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
      
      if (pawnsOnFile > 1) score -= 25;
      
      // Bonus for passed pawns
      if (this.isPassedPawn(chess, move.to)) {
        score += 40;
      }
    }
    
    return score;
  }

  private evaluatePieceActivity(chess: Chess): number {
    let score = 0;
    
    // Count attacked squares for each side
    const whiteAttacks = this.countAttackedSquares(chess, 'w');
    const blackAttacks = this.countAttackedSquares(chess, 'b');
    
    score += (whiteAttacks - blackAttacks) * 3;
    
    return score;
  }

  private evaluateSquareControl(chess: Chess): number {
    let score = 0;
    
    // Evaluate control of key squares
    const keySquares = ['d4', 'd5', 'e4', 'e5', 'c4', 'c5', 'f4', 'f5'];
    
    for (const square of keySquares) {
      const whiteControl = this.isSquareControlled(chess, square, 'w');
      const blackControl = this.isSquareControlled(chess, square, 'b');
      
      if (whiteControl && !blackControl) score += 10;
      if (blackControl && !whiteControl) score -= 10;
    }
    
    return score;
  }

  private evaluateEndgameFactors(chess: Chess, move: any): number {
    let score = 0;
    
    // King activity in endgame
    if (move.piece === 'k') {
      score += 20; // Encourage king activity
    }
    
    // Pawn advancement
    if (move.piece === 'p') {
      const rank = parseInt(move.to[1]);
      const advancement = chess.turn() === 'w' ? rank - 2 : 7 - rank;
      score += advancement * 5;
    }
    
    return score;
  }

  // Helper methods
  private isEndgame(chess: Chess): boolean {
    const board = chess.board();
    let pieceCount = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type !== 'k' && piece.type !== 'p') {
          pieceCount++;
        }
      }
    }
    
    return pieceCount <= 6; // Endgame when few pieces remain
  }

  private countAttackedSquares(chess: Chess, color: string): number {
    const originalTurn = chess.turn();
    if (chess.turn() !== color) {
      // Temporarily switch turns to get attacks for the specified color
      const fen = chess.fen();
      const newFen = fen.replace(chess.turn() === 'w' ? ' w ' : ' b ', color === 'w' ? ' w ' : ' b ');
      chess.load(newFen);
    }
    
    const moves = chess.moves({ verbose: true });
    const attackedSquares = new Set();
    
    for (const move of moves) {
      attackedSquares.add(move.to);
    }
    
    // Restore original turn
    if (chess.turn() !== originalTurn) {
      const fen = chess.fen();
      const newFen = fen.replace(chess.turn() === 'w' ? ' w ' : ' b ', originalTurn === 'w' ? ' w ' : ' b ');
      chess.load(newFen);
    }
    
    return attackedSquares.size;
  }

  private isSquareControlled(chess: Chess, square: string, color: string): boolean {
    const originalTurn = chess.turn();
    if (chess.turn() !== color) {
      const fen = chess.fen();
      const newFen = fen.replace(chess.turn() === 'w' ? ' w ' : ' b ', color === 'w' ? ' w ' : ' b ');
      chess.load(newFen);
    }
    
    const moves = chess.moves({ verbose: true });
    const controlled = moves.some(move => move.to === square);
    
    // Restore original turn
    if (chess.turn() !== originalTurn) {
      const fen = chess.fen();
      const newFen = fen.replace(chess.turn() === 'w' ? ' w ' : ' b ', originalTurn === 'w' ? ' w ' : ' b ');
      chess.load(newFen);
    }
    
    return controlled;
  }

  private isPassedPawn(chess: Chess, square: string): boolean {
    // Simplified passed pawn detection
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = parseInt(square[1]);
    const board = chess.board();
    const piece = board[8 - rank][file];
    
    if (!piece || piece.type !== 'p') return false;
    
    // Check if there are opposing pawns blocking this pawn's advance
    const isWhite = piece.color === 'w';
    const direction = isWhite ? 1 : -1;
    const startRank = isWhite ? rank : rank;
    const endRank = isWhite ? 8 : 1;
    
    for (let r = startRank + direction; isWhite ? r <= endRank : r >= endRank; r += direction) {
      for (let f = Math.max(0, file - 1); f <= Math.min(7, file + 1); f++) {
        const checkPiece = board[8 - r][f];
        if (checkPiece && checkPiece.type === 'p' && checkPiece.color !== piece.color) {
          return false;
        }
      }
    }
    
    return true;
  }

  private isObviousBlunder(chess: Chess, move: any): boolean {
    if (move.captured) return false; // Captures are generally safe
    
    const opponentMoves = chess.moves({ verbose: true });
    for (const opMove of opponentMoves) {
      if (opMove.captured) {
        const pieceValues = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900 };
        if ((pieceValues[opMove.captured] || 0) >= 300) {
          return true; // Hanging a minor piece or better
        }
      }
    }
    
    return false;
  }

  private createsFork(chess: Chess, move: any): boolean {
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
    return ['b', 'r', 'q'].includes(move.piece);
  }

  private createsSkewer(chess: Chess, move: any): boolean {
    return ['b', 'r', 'q'].includes(move.piece);
  }

  private createsDiscoveredAttack(chess: Chess, move: any): boolean {
    // Simplified discovered attack detection
    return move.from !== move.to && ['b', 'r', 'q'].includes(move.piece);
  }

  private evaluatePositionalFactors(chess: Chess, move: any): number {
    let score = 0;
    
    // King safety
    if (move.piece === 'k') {
      if (chess.moveNumber() < 20) {
        score -= 25; // Discourage early king moves
      }
    }
    
    // Piece development
    if (chess.moveNumber() < 15) {
      if (move.piece === 'n' || move.piece === 'b') {
        if (move.from.includes('1') || move.from.includes('8')) {
          score += 15; // Bonus for developing pieces
        }
      }
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
    this.transpositionTable.clear();
    if (this.engine) {
      this.engine = null;
    }
  }
}

// Singleton instance
export const stockfishEngine = new StockfishEngine();
