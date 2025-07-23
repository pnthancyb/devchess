
import { Chess } from "chess.js";
import Groq from "groq-sdk";

export interface GroqAIRequest {
  fen: string;
  model: string;
  difficulty: number;
  gameMode?: string;
  recentMoves?: any[];
  gameMemory?: GameMemory;
}

export interface GameMemory {
  gameId?: string;
  playerStyle?: string;
  commonMistakes?: string[];
  currentStrategy?: string;
  gamePhase: 'opening' | 'middlegame' | 'endgame';
  keyMoments?: string[];
  playerStrengths?: string[];
  playerWeaknesses?: string[];
}

export interface GroqAIResponse {
  move: {
    from: string;
    to: string;
    promotion?: string;
  } | null;
  analysis?: string;
  feedback?: string;
  score?: string;
  reasoning?: string;
}

class GroqAIService {
  private apiKey: string;
  private client: Groq;
  private gameMemories: Map<string, GameMemory> = new Map();

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || "";
    this.client = new Groq({
      apiKey: this.apiKey,
    });
    
    if (!this.apiKey) {
      console.warn("GROQ_API_KEY not found in environment variables. AI features will be limited.");
    }
  }

  private isDeepSeekModel(model: string): boolean {
    return model.includes('deepseek') || model.includes('r1');
  }

  private cleanDeepSeekResponse(content: string): string {
    // Remove <think></think> tags and their content
    return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  }

  private getModelSpecificSettings(model: string, difficulty: number) {
    // Adjust temperature based on difficulty - higher difficulty = lower temperature (more precise)
    const baseTemperature = Math.max(0.1, 1.0 - (difficulty * 0.18));
    
    const modelConfigs = {
      'deepseek-r1-distill-llama-70b': {
        temperature: Math.max(0.05, baseTemperature - 0.1),
        maxTokens: 400,
        systemPromptStyle: 'analytical'
      },
      'llama3-70b-8192': {
        temperature: baseTemperature,
        maxTokens: 350,
        systemPromptStyle: 'strategic'
      },
      'moonshotai/kimi-k2-instruct': {
        temperature: Math.max(0.1, baseTemperature + 0.1),
        maxTokens: 300,
        systemPromptStyle: 'educational'
      }
    };

    return modelConfigs[model as keyof typeof modelConfigs] || modelConfigs['llama3-70b-8192'];
  }

  private buildOptimizedPrompt(request: GroqAIRequest): string {
    const { fen, model, difficulty, gameMode = "classic", recentMoves = [], gameMemory } = request;
    const chess = new Chess(fen);
    const legalMoves = chess.moves({ verbose: true });
    const config = this.getModelSpecificSettings(model, difficulty);

    const difficultyLevels = {
      1: { elo: "1200-1400", style: "beginner player", mistakes: "frequent tactical blunders", focus: "basic piece development", depth: "1-2 moves ahead", errorRate: 0.4 },
      2: { elo: "1400-1600", style: "intermediate player", mistakes: "occasional tactical errors", focus: "simple tactical patterns", depth: "3-4 moves ahead", errorRate: 0.25 },
      3: { elo: "1600-1800", style: "advanced player", mistakes: "positional inaccuracies", focus: "strategic understanding", depth: "5-6 moves ahead", errorRate: 0.15 },
      4: { elo: "1800-2100", style: "expert player", mistakes: "subtle strategic errors", focus: "deep tactical calculation", depth: "7-9 moves ahead", errorRate: 0.08 },
      5: { elo: "2100+", style: "master level", mistakes: "rare calculation errors", focus: "perfect strategic execution", depth: "10+ moves ahead", errorRate: 0.03 }
    };

    const level = difficultyLevels[difficulty as keyof typeof difficultyLevels];
    const gamePhase = chess.moveNumber() <= 10 ? "opening" : chess.moveNumber() <= 25 ? "middlegame" : "endgame";

    // Build memory context
    let memoryContext = "";
    if (gameMemory) {
      memoryContext = `
GAME MEMORY:
- Player Style: ${gameMemory.playerStyle || "Unknown"}
- Current Strategy: ${gameMemory.currentStrategy || "Developing"}
- Game Phase: ${gameMemory.gamePhase}
- Player Strengths: ${gameMemory.playerStrengths?.join(", ") || "Observing"}
- Player Weaknesses: ${gameMemory.playerWeaknesses?.join(", ") || "None noted"}
- Key Moments: ${gameMemory.keyMoments?.slice(-3).join("; ") || "Game start"}
`;
    }

    // Build move history context
    let moveHistory = "";
    if (recentMoves.length > 0) {
      moveHistory = `RECENT MOVES: ${recentMoves.slice(-8).map((m: any) => m.san || `${m.from}-${m.to}`).join(" ")}`;
    }

    const basePrompt = `You are a chess AI playing as Black at ${level.elo} ELO (${level.style}).

GAME ANALYSIS:
- Position: ${fen}
- Phase: ${gamePhase} (Move ${chess.moveNumber()})
- Your level: ${level.style} - calculate ${level.depth}
- Playing style: ${level.focus}
- Error rate: ${level.mistakes}
${memoryContext}
${moveHistory}

CHESS PRINCIPLES TO FOLLOW:
1. Look for tactical shots (pins, forks, skewers, discoveries)
2. Evaluate pawn structure and weaknesses
3. Consider king safety and attack potential  
4. Calculate forcing sequences deeply
5. Assess piece activity and coordination
6. Control key squares and open files

AVAILABLE LEGAL MOVES:
${legalMoves.map(m => `${m.from}->${m.to} (${m.san}) - ${this.evaluateMoveBriefly(chess, m)}`).join("\n")}

ANALYSIS REQUIREMENTS:
- Calculate ${level.depth} minimum
- Consider opponent's best responses
- Look for forcing moves first (checks, captures, threats)
- Evaluate resulting positions objectively
- Play the strongest move, not just "good enough"

RESPONSE FORMAT (JSON ONLY):
{
  "move": {"from": "e7", "to": "e5"},
  "reasoning": "Deep tactical/positional analysis"
}`;

    // Model-specific prompt adjustments
    if (config.systemPromptStyle === 'analytical') {
      return basePrompt + `\n\nAs an analytical AI, consider position evaluation, tactical themes, and strategic plans. Think step-by-step but respond with JSON only.`;
    } else if (config.systemPromptStyle === 'educational') {
      return basePrompt + `\n\nAs an educational AI, balance good chess with instructive play. Make moves that demonstrate chess principles at your skill level.`;
    }

    return basePrompt;
  }

  private extractValidJSON(content: string): any {
    try {
      // Clean DeepSeek thinking tags first
      let cleaned = this.cleanDeepSeekResponse(content);
      
      // Multiple JSON extraction strategies
      const strategies = [
        // Direct parse
        () => JSON.parse(cleaned),
        
        // Find JSON block
        () => {
          const jsonMatch = cleaned.match(/\{[\s\S]*?\}/);
          return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        },
        
        // Remove code blocks and parse
        () => {
          const noCodeBlocks = cleaned.replace(/```[^`]*```/g, '').trim();
          const jsonMatch = noCodeBlocks.match(/\{[\s\S]*?\}/);
          return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        },
        
        // Extract move pattern specifically
        () => {
          const movePattern = /"move"\s*:\s*\{\s*"from"\s*:\s*"([a-h][1-8])"\s*,\s*"to"\s*:\s*"([a-h][1-8])"/;
          const reasoningPattern = /"reasoning"\s*:\s*"([^"]+)"/;
          
          const moveMatch = cleaned.match(movePattern);
          const reasoningMatch = cleaned.match(reasoningPattern);
          
          if (moveMatch) {
            return {
              move: { from: moveMatch[1], to: moveMatch[2] },
              reasoning: reasoningMatch ? reasoningMatch[1] : "AI move"
            };
          }
          return null;
        },
        
        // Extract move from natural language patterns
        () => {
          // Look for common move patterns in natural language
          const patterns = [
            /\b([a-h][1-8])\s*(?:to|->)\s*([a-h][1-8])\b/i,
            /\bmove\s+([a-h][1-8])\s+to\s+([a-h][1-8])\b/i,
            /\b([a-h][1-8])-([a-h][1-8])\b/,
            /\bfrom\s+([a-h][1-8])\s+to\s+([a-h][1-8])\b/i
          ];
          
          for (const pattern of patterns) {
            const match = cleaned.match(pattern);
            if (match && match[1] && match[2]) {
              return {
                move: { from: match[1], to: match[2] },
                reasoning: "Extracted from natural language response"
              };
            }
          }
          return null;
        }
      ];

      for (const strategy of strategies) {
        try {
          const result = strategy();
          if (result && result.move && result.move.from && result.move.to) {
            return result;
          }
        } catch (e) {
          continue;
        }
      }

      throw new Error("No valid JSON found");
    } catch (error) {
      console.error("JSON extraction failed:", error);
      return null;
    }
  }

  private evaluateMoveBriefly(chess: Chess, move: any): string {
    const tempChess = new Chess(chess.fen());
    try {
      const madeMove = tempChess.move(move);
      if (tempChess.isCheck()) return "gives check";
      if (madeMove.captured) return `captures ${madeMove.captured}`;
      if (move.promotion) return "promotes";
      if (move.san.includes('O-O')) return "castles";
      return "develops";
    } catch {
      return "move";
    }
  }

  private updateGameMemory(gameId: string, move: any, position: string, analysis: any): void {
    let memory = this.gameMemories.get(gameId) || {
      gamePhase: 'opening' as const,
      keyMoments: [],
      playerStrengths: [],
      playerWeaknesses: [],
      commonMistakes: []
    };

    const chess = new Chess(position);
    
    // Update game phase
    if (chess.moveNumber() <= 10) memory.gamePhase = 'opening';
    else if (chess.moveNumber() <= 25) memory.gamePhase = 'middlegame';
    else memory.gamePhase = 'endgame';

    // Analyze player style
    if (analysis && analysis.quality) {
      if (analysis.quality === 'excellent') {
        memory.playerStrengths?.push(`Strong ${memory.gamePhase} play`);
      } else if (analysis.quality === 'poor') {
        memory.playerWeaknesses?.push(`${memory.gamePhase} inaccuracies`);
      }
    }

    // Track key moments
    if (chess.isCheck() || chess.isCheckmate() || (move.captured)) {
      memory.keyMoments?.push(`Move ${chess.moveNumber()}: ${move.san || `${move.from}-${move.to}`}`);
    }

    // Limit memory size
    if (memory.keyMoments && memory.keyMoments.length > 10) {
      memory.keyMoments = memory.keyMoments.slice(-10);
    }

    this.gameMemories.set(gameId, memory);
  }

  async generateMove(request: GroqAIRequest): Promise<any> {
    const { fen, model, difficulty, gameMode = "classic" } = request;

    const chess = new Chess(fen);
    const legalMoves = chess.moves({ verbose: true });

    if (legalMoves.length === 0) {
      return { move: null, reasoning: "No legal moves available" };
    }

    try {
      if (!this.apiKey) {
        throw new Error("Groq API key not configured");
      }

      // Validate model exists in Groq
      const validGroqModels = ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'deepseek-r1-distill-llama-70b'];
      if (!validGroqModels.includes(model)) {
        throw new Error(`Model ${model} does not exist or is not supported`);
      }

      const config = this.getModelSpecificSettings(model, difficulty);
      const prompt = this.buildOptimizedPrompt(request);

      console.log(`Optimized AI request for ${model} at difficulty ${difficulty}`);

      const completion = await this.client.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: model || "llama3-70b-8192",
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      });

      const content = completion.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("Empty response from AI");
      }

      console.log(`Raw AI response: ${content.substring(0, 200)}...`);

      const parsedResponse = this.extractValidJSON(content);
      if (!parsedResponse || !parsedResponse.move) {
        console.log("Failed to extract move from JSON, trying smart fallback...");
        
        // Try to extract move from chess notation in the response
        const chess = new Chess(fen);
        const legalMoves = chess.moves({ verbose: true });
        
        // Look for algebraic notation moves
        const sanPattern = /\b([NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?)\b/g;
        const sanMatches = content.match(sanPattern) || [];
        
        for (const sanMove of sanMatches) {
          try {
            const testChess = new Chess(fen);
            const move = testChess.move(sanMove);
            if (move) {
              return {
                move: { from: move.from, to: move.to, promotion: move.promotion },
                reasoning: `Extracted from SAN notation: ${sanMove}`,
                analysis: "Smart fallback extraction",
                score: "0.0"
              };
            }
          } catch (e) {
            continue;
          }
        }
        
        throw new Error("Failed to extract valid move from response");
      }

      // Validate move
      const { from, to } = parsedResponse.move;
      const isLegalMove = legalMoves.some(legal => 
        legal.from === from && legal.to === to
      );

      if (!isLegalMove) {
        console.log(`AI suggested illegal move: ${from} to ${to}`);
        console.log(`Legal moves: ${legalMoves.map(m => `${m.from}-${m.to}`).join(', ')}`);
        
        // Intelligent fallback: pick move based on difficulty and position
        let bestMove;
        const gamePhase = chess.moveNumber() <= 10 ? 'opening' : chess.moveNumber() <= 25 ? 'middlegame' : 'endgame';
        
        if (difficulty >= 4) {
          // Expert level: prioritize tactical moves
          const tacticalMoves = legalMoves.filter(m => {
            const testChess = new Chess(fen);
            const testMove = testChess.move(m);
            return testMove && (testMove.captured || testMove.san.includes('+') || testMove.promotion);
          });
          
          if (tacticalMoves.length > 0) {
            bestMove = tacticalMoves[0];
          } else {
            // Find development or central control moves
            const strategicMoves = legalMoves.filter(m => {
              if (gamePhase === 'opening') {
                return ['e4', 'e5', 'd4', 'd5', 'f4', 'f5', 'c4', 'c5'].includes(m.to) || 
                       !m.piece.includes('p');
              }
              return ['e4', 'e5', 'd4', 'd5', 'f4', 'f5'].includes(m.to);
            });
            bestMove = strategicMoves.length > 0 ? strategicMoves[0] : legalMoves[0];
          }
        } else if (difficulty >= 2) {
          // Intermediate: good moves with some variety
          bestMove = legalMoves[Math.floor(Math.random() * Math.min(3, legalMoves.length))];
        } else {
          // Beginner: more random selection
          bestMove = legalMoves[Math.floor(Math.random() * Math.min(6, legalMoves.length))];
        }
        
        const moveObj = { from: bestMove.from, to: bestMove.to, promotion: bestMove.promotion };
        const move = chess.move(moveObj);
        
        return {
          move: { from: move.from, to: move.to, promotion: move.promotion },
          reasoning: `AI fallback: ${move.san} - Strategic move selection`,
          analysis: `Strategic fallback (Level ${difficulty}/5)`,
          score: difficulty >= 4 ? "0.3" : difficulty >= 2 ? "0.1" : "-0.1"
        };
      }

      // Execute and return the move
      const moveObj: any = { from, to };
      if (parsedResponse.move.promotion) {
        moveObj.promotion = parsedResponse.move.promotion;
      }
      
      const move = chess.move(moveObj);
      if (!move) {
        throw new Error("Move validation failed");
      }

      // Update game memory if gameId provided
      if (request.gameMemory && request.gameMemory.gameId) {
        this.updateGameMemory(request.gameMemory.gameId, move, fen, { quality: 'good' });
      }

      const gamePhase = chess.moveNumber() <= 10 ? "opening" : 
                       chess.moveNumber() <= 25 ? "middlegame" : "endgame";

      return {
        move: { from: move.from, to: move.to, promotion: move.promotion },
        reasoning: parsedResponse.reasoning || `${model} level ${difficulty} move: ${move.san}`,
        analysis: `${move.san} - ${gamePhase} play optimized for difficulty ${difficulty}/5`,
        score: parsedResponse.score || "0.0"
      };

    } catch (error) {
      console.error("AI generation error:", error);
      throw error;
    }
  }

  async analyzeMove(fen: string, move: any, model: string): Promise<any> {
    const systemPrompt = `Analyze this chess move and provide constructive feedback.

Respond with valid JSON only:
{
  "score": 75,
  "quality": "good",
  "explanation": "Specific analysis of the move",
  "evaluation": "+0.2",
  "feedback": "Helpful feedback for the player"
}`;

    try {
      const completion = await this.client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Position: ${fen}\nMove: ${move.san || move.from + move.to}\nAnalyze this move.` }
        ],
        model: model || "llama3-70b-8192",
        temperature: 0.3,
        max_tokens: 200,
      });

      const content = completion.choices[0]?.message?.content?.trim();
      if (!content) throw new Error("Empty analysis response");

      const analysis = this.extractValidJSON(content);
      return analysis || {
        score: 60,
        quality: "neutral",
        explanation: "Move analyzed successfully",
        evaluation: "0.0",
        feedback: "Continue with your strategy"
      };
    } catch (error) {
      console.error("Move analysis failed:", error);
      return {
        score: 50,
        quality: "neutral", 
        explanation: "Analysis temporarily unavailable",
        evaluation: "0.0",
        feedback: "Keep developing your pieces"
      };
    }
  }

  async generateFeedback(fen: string, moves: any[], model: string): Promise<string> {
    try {
      const recentMoves = moves.slice(-5).map(m => m.san || `${m.from}-${m.to}`).join(" ");
      const chess = new Chess(fen);
      
      const prompt = `You are a chess coach. Provide encouraging, specific feedback about the recent moves.

Game Position: ${fen}
Recent moves: ${recentMoves}
Game phase: ${chess.moveNumber() <= 10 ? "opening" : chess.moveNumber() <= 25 ? "middlegame" : "endgame"}

Give constructive feedback in 2-3 sentences focusing on what the player did well and one area for improvement.`;

      const completion = await this.client.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: model || "llama3-70b-8192",
        temperature: 0.5,
        max_tokens: 150,
      });

      const content = completion.choices[0]?.message?.content?.trim();
      return content || "Good strategic thinking! Keep focusing on piece development and center control.";
    } catch (error) {
      console.error("Feedback generation failed:", error);
      return "Nice moves! Continue developing your pieces and look for tactical opportunities.";
    }
  }

  async generateCoachResponse(message: string, fen: string, model: string, gameMemory?: GameMemory): Promise<string> {
    try {
      const chess = new Chess(fen);
      const isDeepSeek = this.isDeepSeekModel(model);
      const gamePhase = chess.moveNumber() <= 10 ? "opening" : chess.moveNumber() <= 25 ? "middlegame" : "endgame";
      const legalMoves = chess.moves({ verbose: true });
      const evaluation = this.evaluatePosition(chess);
      
      // Analyze current position for live context
      const positionAnalysis = this.analyzeCurrentPosition(chess, evaluation);
      
      let memoryContext = "";
      if (gameMemory) {
        memoryContext = `
PLAYER PROFILE:
- Style: ${gameMemory.playerStyle || "Developing"}
- Phase expertise: ${gameMemory.gamePhase}
- Strengths: ${gameMemory.playerStrengths?.join(", ") || "Learning"}
- Improvement areas: ${gameMemory.playerWeaknesses?.join(", ") || "All aspects"}
- Recent highlights: ${gameMemory.keyMoments?.slice(-2).join("; ") || "Starting journey"}
`;
      }

      const prompt = `You are a world-class chess coach analyzing a live game position.

LIVE POSITION ANALYSIS:
- FEN: ${fen}
- Phase: ${gamePhase} (Move ${chess.moveNumber()})
- Evaluation: ${evaluation > 1 ? "Advantage" : evaluation < -1 ? "Disadvantage" : "Equal"}
- Key features: ${positionAnalysis.features}
- Immediate concerns: ${positionAnalysis.concerns}
- Tactical opportunities: ${positionAnalysis.tactics}

${memoryContext}

Player asks: "${message}"

Respond as an expert coach with:
1. 💡 TIP: One specific tactical/strategic tip for this exact position
2. Live analysis of WHY their recent moves make sense (or suggest improvements)
3. What they should focus on NEXT in this position
4. Encourage their thought process

Format: Start with "💡 TIP:" then provide concise, position-specific guidance.
Keep under 120 words. Be encouraging but precise.

${isDeepSeek ? "Analyze the position thoroughly, then give actionable coaching advice." : "Provide immediate, practical chess coaching."}`;

      const completion = await this.client.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: model || "llama3-70b-8192",
        temperature: 0.5,
        max_tokens: 250,
      });

      let content = completion.choices[0]?.message?.content?.trim();
      if (!content) throw new Error("Empty coach response");

      // Clean DeepSeek response if needed
      if (isDeepSeek) {
        content = this.cleanDeepSeekResponse(content);
      }

      // Ensure response starts with TIP if not already formatted
      if (!content.includes("💡 TIP:")) {
        content = `💡 TIP: ${content}`;
      }

      return content || `💡 TIP: In this ${gamePhase} position, focus on piece activity and king safety. Look for tactics like pins, forks, and discovered attacks!`;
    } catch (error) {
      console.error("Coach response failed:", error);
      const chess = new Chess(fen);
      const gamePhase = chess.moveNumber() <= 10 ? "opening" : chess.moveNumber() <= 25 ? "middlegame" : "endgame";
      return `💡 TIP: Great question! In this ${gamePhase} position, focus on improving your piece coordination and looking for tactical opportunities. What's your main concern right now?`;
    }
  }

  private evaluatePosition(chess: Chess): number {
    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
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
    
    return evaluation;
  }

  private analyzeCurrentPosition(chess: Chess, evaluation: number) {
    const features = [];
    const concerns = [];
    const tactics = [];

    if (chess.isCheck()) {
      concerns.push("King in check");
    }
    
    if (Math.abs(evaluation) > 3) {
      features.push(evaluation > 0 ? "Major material advantage" : "Material deficit");
    }
    
    const moves = chess.moves({ verbose: true });
    const captureMoves = moves.filter(m => m.captured);
    const checkMoves = moves.filter(m => m.san.includes('+'));
    
    if (captureMoves.length > 3) {
      tactics.push("Multiple capture opportunities");
    }
    
    if (checkMoves.length > 0) {
      tactics.push("Checking moves available");
    }

    const gamePhase = chess.moveNumber() <= 10 ? "opening" : chess.moveNumber() <= 25 ? "middlegame" : "endgame";
    
    if (gamePhase === "opening") {
      features.push("Development phase");
      concerns.push("King safety and center control");
    } else if (gamePhase === "endgame") {
      features.push("Endgame precision required");
      concerns.push("King activity and pawn promotion");
    }

    return {
      features: features.join(", ") || "Balanced position",
      concerns: concerns.join(", ") || "Standard play",
      tactics: tactics.join(", ") || "Positional maneuvering"
    };
  }

  getGameMemory(gameId: string): GameMemory | undefined {
    return this.gameMemories.get(gameId);
  }

  clearGameMemory(gameId: string): void {
    this.gameMemories.delete(gameId);
  }
}

export const groqAIService = new GroqAIService();
