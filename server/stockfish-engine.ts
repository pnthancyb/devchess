
import { Chess } from "chess.js";
import { spawn, ChildProcess } from "child_process";

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
  private engine: ChildProcess | null = null;
  private isReady = false;
  private engineQueue: Array<{
    command: string;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout?: NodeJS.Timeout;
  }> = [];
  private transpositionTable = new Map<string, any>();
  private usingFallback = false;

  constructor() {
    this.initializeEngine();
  }

  private async initializeEngine() {
    try {
      // Try to spawn actual Stockfish binary
      console.log("Attempting to initialize real Stockfish engine...");
      
      // Try common Stockfish binary names and paths
      const stockfishPaths = [
        'stockfish',
        '/usr/bin/stockfish',
        '/usr/local/bin/stockfish',
        'stockfish-16',
        'stockfish16'
      ];

      for (const path of stockfishPaths) {
        try {
          const testEngine = spawn(path, [], { stdio: ['pipe', 'pipe', 'pipe'] });
          
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              testEngine.kill();
              reject(new Error('Timeout'));
            }, 3000);

            testEngine.stdout?.on('data', (data) => {
              const output = data.toString();
              if (output.includes('Stockfish')) {
                clearTimeout(timeout);
                testEngine.kill();
                this.engine = spawn(path, [], { stdio: ['pipe', 'pipe', 'pipe'] });
                this.setupEngineHandlers();
                resolve();
              }
            });

            testEngine.on('error', () => {
              clearTimeout(timeout);
              reject(new Error('Engine error'));
            });

            testEngine.stdin?.write('uci\n');
          });

          console.log(`Stockfish engine initialized successfully with: ${path}`);
          this.isReady = true;
          this.usingFallback = false;
          return;
        } catch (error) {
          continue;
        }
      }

      throw new Error('No Stockfish binary found');
    } catch (error) {
      console.log("Real Stockfish not available, using enhanced simulation mode");
      this.isReady = true;
      this.usingFallback = true;
    }
  }

  private setupEngineHandlers() {
    if (!this.engine) return;

    this.engine.stdout?.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          this.handleEngineOutput(line.trim());
        }
      }
    });

    this.engine.on('error', (error) => {
      console.error('Stockfish engine error:', error);
      this.fallbackToSimulation();
    });

    this.engine.on('close', () => {
      console.log('Stockfish engine closed');
      this.fallbackToSimulation();
    });

    // Initialize engine
    this.sendCommand('uci');
    this.sendCommand('ucinewgame');
  }

  private fallbackToSimulation() {
    this.usingFallback = true;
    this.isReady = true;
    this.engine = null;
    console.log('Falling back to enhanced simulation mode');
  }

  private handleEngineOutput(line: string) {
    // Handle bestmove responses
    const bestmoveMatch = line.match(/^bestmove\s+(\w+)/);
    if (bestmoveMatch && this.engineQueue.length > 0) {
      const pending = this.engineQueue.shift();
      if (pending) {
        if (pending.timeout) clearTimeout(pending.timeout);
        pending.resolve(bestmoveMatch[1]);
      }
    }

    // Handle evaluation responses
    const evalMatch = line.match(/score cp (-?\d+)/);
    if (evalMatch && this.engineQueue.length > 0) {
      const score = parseInt(evalMatch[1]);
      // Store evaluation for later use
    }
  }

  private sendCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.usingFallback || !this.engine) {
        resolve('');
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Engine timeout'));
      }, 5000);

      this.engineQueue.push({ command, resolve, reject, timeout });
      
      try {
        this.engine.stdin?.write(command + '\n');
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
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

      let selectedMove;

      if (!this.usingFallback && this.engine) {
        try {
          // Use real Stockfish
          await this.sendCommand(`position fen ${fen}`);
          const depth = Math.min(level + 5, 20); // Real Stockfish can handle deeper search
          const bestMoveUci = await this.sendCommand(`go depth ${depth}`);
          
          if (bestMoveUci) {
            // Convert UCI move to our format
            const from = bestMoveUci.substring(0, 2);
            const to = bestMoveUci.substring(2, 4);
            const promotion = bestMoveUci.length > 4 ? bestMoveUci.substring(4) : undefined;
            
            const move = chess.move({ from, to, promotion });
            if (move) {
              selectedMove = move;
            }
          }
        } catch (engineError) {
          console.log('Real Stockfish failed, using fallback:', engineError);
          this.fallbackToSimulation();
        }
      }

      // Fallback to enhanced simulation if real Stockfish failed
      if (!selectedMove) {
        selectedMove = this.getEnhancedMove(chess, moves, level);
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

  private getEnhancedMove(chess: Chess, moves: any[], level: number): any {
    const depth = Math.min(level + 2, 8);
    
    switch (level) {
      case 1:
        return moves[Math.floor(Math.random() * moves.length)];
      case 2:
        return this.getDecentMove(chess, moves);
      case 3:
        return this.getGoodMove(chess, moves, depth);
      case 4:
        return this.getStrongMove(chess, moves, depth);
      case 5:
        return this.getVeryStrongMove(chess, moves, depth);
      case 6:
        return this.getExpertMove(chess, moves, depth);
      case 7:
        return this.getMasterMove(chess, moves, depth);
      case 8:
        return this.getGrandmasterMove(chess, moves, depth);
      case 9:
        return this.getSuperGMMove(chess, moves, Math.min(depth + 2, 10));
      case 10:
        return this.getEngineMove(chess, moves, Math.min(depth + 3, 12));
      default:
        return this.getStrongMove(chess, moves, depth);
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
    return this.getBestMoveByEvaluation(chess, moves, depth + 1, 0.95);
  }

  private getMasterMove(chess: Chess, moves: any[], depth: number): any {
    return this.getBestMoveByEvaluation(chess, moves, depth + 2, 0.97);
  }

  private getGrandmasterMove(chess: Chess, moves: any[], depth: number): any {
    return this.getBestMoveByEvaluation(chess, moves, depth + 2, 0.98);
  }

  private getSuperGMMove(chess: Chess, moves: any[], depth: number): any {
    return this.getBestMoveByEvaluation(chess, moves, depth + 3, 0.99);
  }

  private getEngineMove(chess: Chess, moves: any[], depth: number): any {
    return this.getBestMoveByEvaluation(chess, moves, depth + 4, 1.0);
  }

  private getBestMoveByEvaluation(chess: Chess, moves: any[], depth: number, accuracy: number): any {
    const evaluatedMoves = moves.map(move => {
      chess.move(move);
      const evaluation = this.evaluatePosition(chess, depth);
      chess.undo();
      
      return {
        move,
        evaluation: chess.turn() === 'w' ? -evaluation : evaluation
      };
    });

    evaluatedMoves.sort((a, b) => b.evaluation - a.evaluation);

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

    for (const move of moves.slice(0, 15)) {
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

    evaluation += this.evaluatePositionalFactors(chess);
    evaluation += this.evaluateTacticalFactors(chess);
    evaluation += this.evaluateEndgameFactors(chess);

    return evaluation;
  }

  private evaluatePositionalFactors(chess: Chess): number {
    let score = 0;
    const board = chess.board();

    const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];
    for (const [row, col] of centerSquares) {
      const piece = board[row][col];
      if (piece) {
        score += piece.color === 'w' ? 30 : -30;
      }
    }

    const whiteKing = this.findKing(board, 'w');
    const blackKing = this.findKing(board, 'b');
    
    if (whiteKing) {
      score += this.evaluateKingSafety(board, whiteKing, 'w');
    }
    if (blackKing) {
      score -= this.evaluateKingSafety(board, blackKing, 'b');
    }

    score += this.evaluatePawnStructure(board);

    return score;
  }

  private evaluateTacticalFactors(chess: Chess): number {
    let score = 0;

    score += this.detectTacticalMotifs(chess);

    const currentTurnMoves = chess.moves().length;
    
    let opponentMoves = 0;
    try {
      const fenParts = chess.fen().split(' ');
      fenParts[1] = chess.turn() === 'w' ? 'b' : 'w';
      const opponentFen = fenParts.join(' ');
      const tempChess = new Chess(opponentFen);
      opponentMoves = tempChess.moves().length;
    } catch (error) {
      opponentMoves = currentTurnMoves;
    }
    score += (currentTurnMoves - opponentMoves) * 2;

    return score;
  }

  private evaluateEndgameFactors(chess: Chess): number {
    const pieces = chess.board().flat().filter(p => p && p.type !== 'k');
    
    if (pieces.length <= 8) {
      let score = 0;
      
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
      
      if (whitePawns.length > 1) score -= 20 * (whitePawns.length - 1);
      if (blackPawns.length > 1) score += 20 * (blackPawns.length - 1);
    }
    
    return score;
  }

  private detectTacticalMotifs(chess: Chess): number {
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

  public getEngineStatus(): { isReady: boolean; usingFallback: boolean; engineType: string } {
    return {
      isReady: this.isReady,
      usingFallback: this.usingFallback,
      engineType: this.usingFallback ? 'Enhanced Simulation' : 'Real Stockfish'
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
