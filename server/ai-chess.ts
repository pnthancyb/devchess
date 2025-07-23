import { Chess } from "chess.js";

export interface AIChessRequest {
  fen: string;
  model: string;
  difficulty: number;
  legalMoves?: Array<{
    from: string;
    to: string;
    piece: string;
    san: string;
  }>;
}

export interface AIChessResponse {
  move: {
    from: string;
    to: string;
    promotion?: string;
  } | null;
  reasoning?: string;
  confidence?: number;
}

// Simple chess engine with difficulty levels
export class AIChessEngine {
  private evaluatePosition(chess: Chess): number {
    const pieceValues = {
      p: 1, n: 3, b: 3, r: 5, q: 9, k: 0
    };
    
    let evaluation = 0;
    const board = chess.board();
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const value = pieceValues[piece.type] || 0;
          evaluation += piece.color === 'w' ? value : -value;
        }
      }
    }
    
    // Add position bonuses
    if (chess.isCheck()) {
      evaluation += chess.turn() === 'w' ? -0.5 : 0.5;
    }
    
    return evaluation;
  }

  private minimax(chess: Chess, depth: number, isMaximizing: boolean, alpha: number = -Infinity, beta: number = Infinity): { value: number, move?: any } {
    if (depth === 0 || chess.isGameOver()) {
      return { value: this.evaluatePosition(chess) };
    }

    const moves = chess.moves({ verbose: true });
    let bestMove;
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        chess.move(move);
        const evaluation = this.minimax(chess, depth - 1, false, alpha, beta);
        chess.undo();
        
        if (evaluation.value > maxEval) {
          maxEval = evaluation.value;
          bestMove = move;
        }
        
        alpha = Math.max(alpha, evaluation.value);
        if (beta <= alpha) break;
      }
      return { value: maxEval, move: bestMove };
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        chess.move(move);
        const evaluation = this.minimax(chess, depth - 1, true, alpha, beta);
        chess.undo();
        
        if (evaluation.value < minEval) {
          minEval = evaluation.value;
          bestMove = move;
        }
        
        beta = Math.min(beta, evaluation.value);
        if (beta <= alpha) break;
      }
      return { value: minEval, move: bestMove };
    }
  }

  generateMove(request: AIChessRequest): AIChessResponse {
    const chess = new Chess(request.fen);
    const moves = chess.moves({ verbose: true });
    
    if (moves.length === 0) {
      return { move: null, reasoning: "No legal moves available" };
    }

    // Increased difficulty: higher depth, less randomness
    const depthMap = { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7 };
    const randomnessMap = { 1: 0.3, 2: 0.2, 3: 0.1, 4: 0.05, 5: 0.02 };
    
    const depth = depthMap[request.difficulty as keyof typeof depthMap] || 5;
    const randomness = randomnessMap[request.difficulty as keyof typeof randomnessMap] || 0.1;

    // Add some randomness based on difficulty
    if (Math.random() < randomness) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      return {
        move: {
          from: randomMove.from,
          to: randomMove.to,
          promotion: randomMove.promotion
        },
        reasoning: `Random move (difficulty ${request.difficulty})`,
        confidence: 0.5
      };
    }

    // Use minimax for better moves
    const isMaximizing = chess.turn() === 'b'; // AI plays as black
    const result = this.minimax(chess, depth, isMaximizing);
    
    if (result.move) {
      return {
        move: {
          from: result.move.from,
          to: result.move.to,
          promotion: result.move.promotion
        },
        reasoning: `Minimax evaluation: ${result.value.toFixed(2)} (depth ${depth})`,
        confidence: Math.min(0.9, 0.5 + Math.abs(result.value) * 0.1)
      };
    }

    // Fallback to random move
    const fallbackMove = moves[Math.floor(Math.random() * moves.length)];
    return {
      move: {
        from: fallbackMove.from,
        to: fallbackMove.to,
        promotion: fallbackMove.promotion
      },
      reasoning: "Fallback random move",
      confidence: 0.3
    };
  }

  analyzeMove(fen: string, move: any): { score: number, quality: string, explanation: string } {
    const chess = new Chess(fen);
    const beforeEval = this.evaluatePosition(chess);
    
    try {
      chess.move(move);
      const afterEval = this.evaluatePosition(chess);
      const scoreDiff = afterEval - beforeEval;
      
      let quality: string;
      let score: number;
      
      if (Math.abs(scoreDiff) >= 3) {
        quality = scoreDiff > 0 ? "excellent" : "blunder";
        score = scoreDiff > 0 ? 95 : 15;
      } else if (Math.abs(scoreDiff) >= 1) {
        quality = scoreDiff > 0 ? "good" : "mistake";
        score = scoreDiff > 0 ? 80 : 30;
      } else if (Math.abs(scoreDiff) >= 0.5) {
        quality = scoreDiff > 0 ? "good" : "inaccuracy";
        score = scoreDiff > 0 ? 70 : 45;
      } else {
        quality = "neutral";
        score = 60;
      }
      
      return {
        score,
        quality,
        explanation: `Move evaluation: ${scoreDiff.toFixed(2)}. ${quality.charAt(0).toUpperCase() + quality.slice(1)} move.`
      };
    } catch (error) {
      return {
        score: 0,
        quality: "illegal",
        explanation: "Illegal move attempted"
      };
    }
  }

  generateFeedback(fen: string, recentMoves: any[], model: string): string {
    // Ensure fen is a string
    const fenString = typeof fen === 'string' ? fen : String(fen);
    const chess = new Chess(fenString);
    const evaluation = this.evaluatePosition(chess);
    
    let feedback = `Current position evaluation: ${evaluation.toFixed(2)}. `;
    
    if (recentMoves.length > 0) {
      const lastMove = recentMoves[recentMoves.length - 1];
      const analysis = this.analyzeMove(fen, lastMove);
      feedback += `Your last move was ${analysis.quality}. ${analysis.explanation} `;
    }
    
    if (chess.isCheck()) {
      feedback += "You are in check! ";
    }
    
    if (chess.isCheckmate()) {
      feedback += "Checkmate! Game over.";
    } else if (chess.isDraw()) {
      feedback += "The game is a draw.";
    } else {
      // Suggest strategy based on position
      if (evaluation > 2) {
        feedback += "You have a significant advantage. Look for ways to convert it.";
      } else if (evaluation < -2) {
        feedback += "You are at a disadvantage. Focus on defense and tactics.";
      } else {
        feedback += "The position is roughly equal. Look for tactical opportunities.";
      }
    }
    
    return feedback;
  }
}

export const aiChessEngine = new AIChessEngine();