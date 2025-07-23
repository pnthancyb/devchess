
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

// Enhanced chess engine with extended difficulty levels
export class AIChessEngine {
  private transpositionTable = new Map<string, any>();

  private evaluatePosition(chess: Chess): number {
    const pieceValues: Record<string, number> = {
      p: 100, n: 320, b: 330, r: 500, q: 900, k: 0
    };
    
    let evaluation = 0;
    const board = chess.board();
    
    // Material evaluation
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const value = pieceValues[piece.type as keyof typeof pieceValues] || 0;
          evaluation += piece.color === 'w' ? value : -value;
        }
      }
    }
    
    // Positional bonuses
    evaluation += this.evaluatePositionalFactors(chess);
    
    // Mobility bonus
    const mobilityBonus = chess.moves().length * 3;
    evaluation += chess.turn() === 'w' ? mobilityBonus : -mobilityBonus;
    
    return evaluation;
  }

  private evaluatePositionalFactors(chess: Chess): number {
    let score = 0;
    const board = chess.board();
    
    // Center control bonus
    const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]]; // d4, d5, e4, e5
    for (const [row, col] of centerSquares) {
      const piece = board[row][col];
      if (piece) {
        score += piece.color === 'w' ? 20 : -20;
        if (piece.type === 'p') {
          score += piece.color === 'w' ? 10 : -10;
        }
      }
    }
    
    // King safety in opening/middlegame
    if (chess.moveNumber() < 20) {
      // Penalize exposed king
      const whiteKing = this.findKing(board, 'w');
      const blackKing = this.findKing(board, 'b');
      
      if (whiteKing && whiteKing[0] < 6) score -= 30; // King hasn't castled
      if (blackKing && blackKing[0] > 1) score += 30;
    }
    
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

  private minimax(chess: Chess, depth: number, isMaximizing: boolean, alpha: number = -Infinity, beta: number = Infinity): { value: number, move?: any } {
    const positionKey = `${chess.fen()}-${depth}-${isMaximizing}`;
    if (this.transpositionTable.has(positionKey)) {
      return this.transpositionTable.get(positionKey);
    }

    if (depth === 0 || chess.isGameOver()) {
      const value = this.evaluatePosition(chess);
      const result = { value };
      this.transpositionTable.set(positionKey, result);
      return result;
    }

    const moves = chess.moves({ verbose: true });
    let bestMove;

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        chess.move(move);
        const evaluation = this.minimax(chess, depth - 1, false, alpha, beta).value;
        chess.undo();
        
        if (evaluation > maxEval) {
          maxEval = evaluation;
          bestMove = move;
        }
        
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      const result = { value: maxEval, move: bestMove };
      this.transpositionTable.set(positionKey, result);
      return result;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        chess.move(move);
        const evaluation = this.minimax(chess, depth - 1, true, alpha, beta).value;
        chess.undo();
        
        if (evaluation < minEval) {
          minEval = evaluation;
          bestMove = move;
        }
        
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      const result = { value: minEval, move: bestMove };
      this.transpositionTable.set(positionKey, result);
      return result;
    }
  }

  generateMove(request: AIChessRequest): AIChessResponse {
    try {
      const chess = new Chess(request.fen);
      const moves = chess.moves({ verbose: true });
      
      if (moves.length === 0) {
        return { move: null, reasoning: "No legal moves available" };
      }

      const difficulty = Math.max(1, Math.min(10, request.difficulty));
      let selectedMove;
      let reasoning = "";

      switch (difficulty) {
        case 1:
          // Random move
          selectedMove = moves[Math.floor(Math.random() * moves.length)];
          reasoning = "Random move selection";
          break;
          
        case 2:
          // Avoid obvious blunders
          const safeHoves = moves.filter(move => {
            chess.move(move);
            const isSafe = !this.isObviousBlunder(chess);
            chess.undo();
            return isSafe;
          });
          selectedMove = safeHoves.length > 0 ? 
            safeHoves[Math.floor(Math.random() * safeHoves.length)] : 
            moves[Math.floor(Math.random() * moves.length)];
          reasoning = "Basic safety check";
          break;
          
        case 3:
          // Simple evaluation with depth 1
          const result3 = this.minimax(chess, 1, chess.turn() === 'w');
          selectedMove = result3.move || moves[0];
          reasoning = "Shallow tactical analysis";
          break;
          
        case 4:
          // Deeper search with depth 2
          const result4 = this.minimax(chess, 2, chess.turn() === 'w');
          selectedMove = result4.move || moves[0];
          reasoning = "Moderate tactical analysis";
          break;
          
        case 5:
          // Strong play with depth 3
          const result5 = this.minimax(chess, 3, chess.turn() === 'w');
          selectedMove = result5.move || moves[0];
          reasoning = "Strong tactical analysis";
          break;
          
        case 6:
          // Expert level with depth 4
          const result6 = this.minimax(chess, 4, chess.turn() === 'w');
          selectedMove = result6.move || moves[0];
          reasoning = "Expert level analysis";
          break;
          
        case 7:
          // Master level with depth 5
          const result7 = this.minimax(chess, 5, chess.turn() === 'w');
          selectedMove = result7.move || moves[0];
          reasoning = "Master level analysis";
          break;
          
        case 8:
          // Grandmaster level with depth 6
          const result8 = this.minimax(chess, 6, chess.turn() === 'w');
          selectedMove = result8.move || moves[0];
          reasoning = "Grandmaster level analysis";
          break;
          
        case 9:
          // Super-GM level with depth 7
          const result9 = this.minimax(chess, 7, chess.turn() === 'w');
          selectedMove = result9.move || moves[0];
          reasoning = "Super-GM level analysis";
          break;
          
        case 10:
          // Engine level with depth 8
          const result10 = this.minimax(chess, 8, chess.turn() === 'w');
          selectedMove = result10.move || moves[0];
          reasoning = "Engine level analysis";
          break;
          
        default:
          selectedMove = moves[0];
          reasoning = "Default move selection";
      }

      return {
        move: {
          from: selectedMove.from,
          to: selectedMove.to,
          promotion: selectedMove.promotion
        },
        reasoning,
        confidence: difficulty * 10
      };
      
    } catch (error) {
      console.error("AI move generation error:", error);
      return {
        move: null,
        reasoning: "Error in move generation"
      };
    }
  }

  private isObviousBlunder(chess: Chess): boolean {
    const opponentMoves = chess.moves({ verbose: true });
    
    for (const move of opponentMoves) {
      if (move.captured) {
        const pieceValues: Record<string, number> = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 0 };
        if ((pieceValues[move.captured as keyof typeof pieceValues] || 0) >= 300) {
          return true; // Opponent can capture valuable piece
        }
      }
    }
    
    return false;
  }

  analyzeMove(fen: string, move: any): any {
    try {
      const chess = new Chess(fen);
      
      // Validate the move
      const legalMoves = chess.moves({ verbose: true });
      const isLegal = legalMoves.some(m => 
        m.from === move.from && 
        m.to === move.to && 
        m.promotion === move.promotion
      );
      
      if (!isLegal) {
        return {
          score: 0,
          quality: "illegal",
          explanation: "Illegal move attempted"
        };
      }
      
      // Evaluate position before and after move
      const scoreBefore = this.evaluatePosition(chess);
      chess.move(move);
      const scoreAfter = this.evaluatePosition(chess);
      
      const scoreDiff = scoreAfter - scoreBefore;
      const adjustedScore = chess.turn() === 'b' ? scoreDiff : -scoreDiff; // Adjust for current player
      
      let quality = "good";
      let explanation = "Reasonable move";
      
      if (adjustedScore > 100) {
        quality = "excellent";
        explanation = "Excellent move! Gains significant advantage";
      } else if (adjustedScore > 50) {
        quality = "good";
        explanation = "Good move with clear benefit";
      } else if (adjustedScore > -50) {
        quality = "neutral";
        explanation = "Neutral move, maintains balance";
      } else if (adjustedScore > -150) {
        quality = "inaccuracy";
        explanation = "Inaccurate move, loses some advantage";
      } else if (adjustedScore > -300) {
        quality = "mistake";
        explanation = "Mistake! Loses significant advantage";
      } else {
        quality = "blunder";
        explanation = "Blunder! Major material or positional loss";
      }
      
      return {
        score: Math.round(adjustedScore),
        quality,
        explanation
      };
      
    } catch (error) {
      return {
        score: 0,
        quality: "error",
        explanation: "Could not analyze move"
      };
    }
  }

  generateFeedback(fen: string, moves: any[], model: string): string {
    try {
      const chess = new Chess();
      let feedback = "Game Analysis:\n\n";
      
      if (!moves || moves.length === 0) {
        return "Current position evaluation: The game has just started. Focus on piece development and center control.";
      }
      
      const recentMoves = moves.slice(-4); // Analyze last 4 moves
      let totalScore = 0;
      let moveCount = 0;
      
      for (const move of recentMoves) {
        try {
          const analysis = this.analyzeMove(chess.fen(), move);
          if (analysis.quality !== "illegal" && analysis.quality !== "error") {
            totalScore += analysis.score || 0;
            moveCount++;
          }
          chess.move(move);
        } catch (error) {
          continue;
        }
      }
      
      const averageScore = moveCount > 0 ? totalScore / moveCount : 0;
      
      if (averageScore > 50) {
        feedback += "Excellent play! Your recent moves show strong tactical awareness.";
      } else if (averageScore > 0) {
        feedback += "Good play overall. Keep looking for tactical opportunities.";
      } else if (averageScore > -50) {
        feedback += "Decent play. Focus on improving piece coordination.";
      } else {
        feedback += "Consider slowing down and calculating more carefully before moving.";
      }
      
      // Add position-specific advice
      try {
        const currentChess = new Chess(fen);
        const phase = this.getGamePhase(currentChess);
        
        feedback += `\n\nCurrent phase: ${phase}`;
        
        if (phase === "opening") {
          feedback += "\nFocus on: Piece development, center control, king safety";
        } else if (phase === "middlegame") {
          feedback += "\nFocus on: Tactical combinations, piece activity, pawn structure";
        } else {
          feedback += "\nFocus on: King activity, pawn promotion, precise calculation";
        }
      } catch (error) {
        // Fallback feedback
      }
      
      return feedback;
      
    } catch (error) {
      return "Current position evaluation: Unable to provide detailed analysis at this time.";
    }
  }

  private getGamePhase(chess: Chess): string {
    const board = chess.board();
    let pieceCount = 0;
    let developedPieces = 0;
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece && piece.type !== 'k' && piece.type !== 'p') {
          pieceCount++;
          
          // Check if piece is developed (not on starting squares)
          if (piece.color === 'w') {
            if (piece.type === 'n' && (i !== 7 || (j !== 1 && j !== 6))) developedPieces++;
            if (piece.type === 'b' && (i !== 7 || (j !== 2 && j !== 5))) developedPieces++;
            if (piece.type === 'r' && i !== 7) developedPieces++;
            if (piece.type === 'q' && (i !== 7 || j !== 3)) developedPieces++;
          } else {
            if (piece.type === 'n' && (i !== 0 || (j !== 1 && j !== 6))) developedPieces++;
            if (piece.type === 'b' && (i !== 0 || (j !== 2 && j !== 5))) developedPieces++;
            if (piece.type === 'r' && i !== 0) developedPieces++;
            if (piece.type === 'q' && (i !== 0 || j !== 3)) developedPieces++;
          }
        }
      }
    }
    
    if (chess.moveNumber() < 15 && developedPieces < 6) {
      return "opening";
    } else if (pieceCount > 12) {
      return "middlegame";
    } else {
      return "endgame";
    }
  }
}

export const aiChessEngine = new AIChessEngine();
