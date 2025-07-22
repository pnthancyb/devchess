import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertGameSchema, insertMoveSchema, insertChatMessageSchema } from "@shared/schema";
import { aiChessEngine } from "./ai-chess";
import { groqAIService } from "./groq-ai";
import { Chess } from "chess.js";

interface WebSocketMessage {
  type: string;
  data: any;
  gameId?: number;
}

interface GameSession {
  gameId: number;
  userId: number;
  language: string;
  mode: string;
  aiMemory: any[];
  game?: any;
  ws: WebSocket;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time chess gameplay
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store active game sessions
  const gameSessions = new Map<WebSocket, GameSession>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    ws.on('message', async (data: string) => {
      try {
        const message: WebSocketMessage = JSON.parse(data);
        await handleWebSocketMessage(ws, message);
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', data: { message: 'Invalid message format' } }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      gameSessions.delete(ws);
    });
  });

  async function handleWebSocketMessage(ws: WebSocket, message: WebSocketMessage) {
    const { type, data, gameId } = message;

    switch (type) {
      case 'join_game':
        await handleJoinGame(ws, data);
        break;
      case 'make_move':
        await handleMakeMove(ws, data);
        break;
      case 'chat_message':
        try {
          const session = gameSessions.get(ws);
          if (!session) {
              ws.send(JSON.stringify({ type: 'error', data: { message: 'Not in a game session' } }));
              return;
          }
          const { message } = data;

          // Get current game position for context
          const currentFen = session.game?.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

          // Get game memory for personalized coaching
          const gameMemory = groqAIService.getGameMemory(session.gameId.toString());

          // Use Groq AI for coach response
          let aiResponse;
          try {
            aiResponse = await groqAIService.generateCoachResponse(message, currentFen, "moonshotai/kimi-k2-instruct", gameMemory);
          } catch (groqError) {
            console.log('Groq coach failed, using fallback:', groqError instanceof Error ? groqError.message : String(groqError));
            aiResponse = `Great question about "${message}"! Based on your current position, focus on piece development and tactical opportunities. What specific move or idea interests you?`;
          }

          ws.send(JSON.stringify({
            type: "chat_response",
            data: {
              userMessage: message,
              aiResponse,
            },
          }));
        } catch (error) {
          console.error("Coach chat error:", error);
          ws.send(JSON.stringify({
            type: "error",
            data: { message: "Failed to get coach response" },
          }));
        }
        break;
      case 'get_ai_suggestion':
        await handleAISuggestion(ws, data);
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', data: { message: 'Unknown message type' } }));
    }
  }

  async function handleJoinGame(ws: WebSocket, data: any) {
    try {
      const { gameId, userId = 1, language = 'en', gameMode = 'classic' } = data;
      
      // Check if already in a game session
      const existingSession = gameSessions.get(ws);
      if (existingSession) {
        ws.send(JSON.stringify({
          type: 'game_joined',
          data: { gameId: existingSession.gameId, userId, language, mode: existingSession.mode },
        }));
        return;
      }
      
      let game;
      let actualGameId = gameId;
      
      if (gameId) {
        // Try to join existing game
        game = await storage.getGame(gameId);
        if (!game) {
          ws.send(JSON.stringify({ type: 'error', data: { message: 'Game not found' } }));
          return;
        }
      } else {
        // Create new game
        actualGameId = Date.now(); // Simple game ID for now
        try {
          game = await storage.createGame({
            status: 'waiting',
            mode: gameMode,
            aiMemory: [],
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            currentPlayer: 'white',
            result: null,
          });
          actualGameId = game.id;
        } catch (storageError) {
          // If storage fails, use in-memory session
          console.log('Storage failed, using in-memory session');
          game = {
            id: actualGameId,
            status: 'waiting',
            mode: gameMode,
            aiMemory: [],
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            currentPlayer: 'white',
            result: null,
          };
        }
      }

      const session: GameSession = {
        gameId: actualGameId,
        userId,
        language,
        mode: game.mode,
        aiMemory: (game.aiMemory as any[]) || [],
        game: game,
        ws: ws,
      };

      gameSessions.set(ws, session);

      // Send game state
      let moves = [];
      let chatMessages = [];
      
      try {
        moves = await storage.getGameMoves(actualGameId);
        chatMessages = await storage.getGameChatMessages(actualGameId);
      } catch (storageError) {
        console.log('Could not load moves/chat, starting fresh');
      }

      ws.send(JSON.stringify({
        type: 'game_joined',
        data: {
          gameId: actualGameId,
          userId,
          language,
          mode: game.mode,
          game,
          moves,
          chatMessages,
        },
      }));
      
      console.log(`Player ${userId} joined game ${actualGameId} in ${game.mode} mode`);
    } catch (error) {
      console.error('Join game error:', error);
      ws.send(JSON.stringify({ type: 'error', data: { message: 'Failed to join game' } }));
    }
  }

  async function handleMakeMove(ws: WebSocket, data: any) {
    try {
      const session = gameSessions.get(ws);
      if (!session) {
        ws.send(JSON.stringify({ type: 'error', data: { message: 'Not in a game session' } }));
        return;
      }

      const { from, to, piece, san, fen, moveNumber } = data;

      // Create move record
      const move = await storage.createMove({
        gameId: session.gameId,
        moveNumber,
        from,
        to,
        piece,
        san,
        fen,
      });

      // Update game state
      await storage.updateGame(session.gameId, { fen });

      // Get AI analysis based on game mode
      let aiResponse;
      switch (session.mode) {
        case 'feedback':
          aiResponse = await getAIFeedback(move, session);
          break;
        case 'scoring':
          aiResponse = await getAIScoring(move, session);
          break;
        case 'coach':
          aiResponse = await getAICoaching(move, session);
          break;
        default:
          aiResponse = await getAIMove(move, session);
      }

      // Update move with AI analysis  
      if ('feedback' in aiResponse && aiResponse.feedback) {
        await storage.createMove({
          gameId: session.gameId,
          moveNumber: moveNumber,
          from: move.from,
          to: move.to,
          piece: move.piece,
          san: move.san,
          fen: move.fen,
          feedback: aiResponse.feedback,
          score: 'score' in aiResponse ? String(aiResponse.score) : undefined,
          evaluation: 'evaluation' in aiResponse ? aiResponse.evaluation : undefined,
        });
      }

      // Send move confirmation and AI response
      ws.send(JSON.stringify({
        type: 'move_made',
        data: {
          move,
          aiResponse,
        },
      }));

      // If classic mode, make AI move
      if (session.mode === 'classic' && 'aiMove' in aiResponse && aiResponse.aiMove) {
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: 'ai_move',
            data: aiResponse.aiMove,
          }));
        }, 1000);
      }

       if (fen) {
            session.game = { fen: fen }; // Update game fen in session
        }

    } catch (error) {
      console.error('Make move error:', error);
      ws.send(JSON.stringify({ type: 'error', data: { message: 'Failed to make move' } }));
    }
  }

  async function handleChatMessage(ws: WebSocket, data: any) {
    try {
      const session = gameSessions.get(ws);
      if (!session) {
        ws.send(JSON.stringify({ type: 'error', data: { message: 'Not in a game session' } }));
        return;
      }

      const { message } = data;

      // Save user message
      await storage.createChatMessage({
        gameId: session.gameId,
        sender: 'user',
        message,
        language: session.language,
      });

      // Get AI coach response
      const aiResponse = await getAICoachResponse(message, session);

      // Save AI response
      await storage.createChatMessage({
        gameId: session.gameId,
        sender: 'ai',
        message: aiResponse,
        language: session.language,
      });

      ws.send(JSON.stringify({
        type: 'chat_response',
        data: {
          userMessage: message,
          aiResponse,
        },
      }));

    } catch (error) {
      console.error('Chat message error:', error);
      ws.send(JSON.stringify({ type: 'error', data: { message: 'Failed to send chat message' } }));
    }
  }

  async function handleAISuggestion(ws: WebSocket, data: any) {
    try {
      const session = gameSessions.get(ws);
      if (!session) {
        ws.send(JSON.stringify({ type: 'error', data: { message: 'Not in a game session' } }));
        return;
      }

      const { fen } = data;

      // Get AI suggestions (simulated - would integrate with Stockfish/Groq)
      const suggestions = await getAISuggestions(fen, session);

      ws.send(JSON.stringify({
        type: 'ai_suggestions',
        data: suggestions,
      }));

    } catch (error) {
      console.error('AI suggestion error:', error);
      ws.send(JSON.stringify({ type: 'error', data: { message: 'Failed to get AI suggestions' } }));
    }
  }

  // API Routes
  app.post('/api/games', async (req, res) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(gameData);
      res.json(game);
    } catch (error) {
      res.status(400).json({ error: 'Invalid game data' });
    }
  });

  app.get('/api/games/:id', async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);

      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const moves = await storage.getGameMoves(gameId);
      const chatMessages = await storage.getGameChatMessages(gameId);

      res.json({ game, moves, chatMessages });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch game' });
    }
  });

  app.get('/api/users/:id/games', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const games = await storage.getUserGames(userId);
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user games' });
    }
  });

  // AI Integration Functions
  async function getAIFeedback(move: any, session: GameSession) {
    try {
      const analysis = aiChessEngine.analyzeMove(move.fen, move);
      return {
        feedback: analysis.explanation,
        quality: analysis.quality,
        score: analysis.score,
      };
    } catch (error) {
      console.error('AI feedback error:', error);
      return {
        feedback: "Move analysis unavailable",
        quality: "neutral",
      };
    }
  }

  async function getAIScoring(move: any, session: GameSession) {
    try {
      const analysis = aiChessEngine.analyzeMove(move.fen, move);
      return {
        score: analysis.score > 70 ? `+${(analysis.score/20).toFixed(1)}` : `-${((100-analysis.score)/20).toFixed(1)}`,
        feedback: analysis.explanation,
        evaluation: analysis.quality,
      };
    } catch (error) {
      console.error('AI scoring error:', error);
      return {
        score: "0.0",
        feedback: "Scoring unavailable",
        evaluation: "neutral",
      };
    }
  }

  async function getAICoaching(move: any, session: GameSession) {
    try {
      const feedback = aiChessEngine.generateFeedback(move.fen, [move], 'coach');
      return {
        feedback,
        suggestions: ["Focus on piece development", "Look for tactical opportunities", "Ensure king safety"],
      };
    } catch (error) {
      console.error('AI coaching error:', error);
      return {
        feedback: "Coaching feedback unavailable",
        suggestions: [],
      };
    }
  }

  async function getAIMove(move: any, session: GameSession) {
    try {
      // Try Groq AI first, fallback to local engine
      let aiResponse;
      try {
        aiResponse = await groqAIService.generateMove({
          fen: move.fen,
          model: 'llama3-70b-8192',
          difficulty: 3,
          gameMode: 'classic',
          recentMoves: []
        });
      } catch (groqError) {
        console.log('Groq AI unavailable, using local engine');
        aiResponse = aiChessEngine.generateMove({
          fen: move.fen,
          model: 'local',
          difficulty: 3
        });
      }

      if (aiResponse.move) {
        const chess = new Chess(move.fen);
        const aiMove = chess.move(aiResponse.move);

        if (aiMove) {
          return {
            aiMove: {
              from: aiMove.from,
              to: aiMove.to,
              piece: aiMove.piece,
              captured: aiMove.captured,
              promotion: aiMove.promotion,
              san: aiMove.san,
              fen: chess.fen(),
              moveNumber: move.moveNumber + 1
            },
            reasoning: aiResponse.reasoning,
          };
        }
      }

      throw new Error('No valid AI move generated');
    } catch (error) {
      console.error('AI move generation error:', error);
      return {
        aiMove: null,
        reasoning: "AI move generation failed",
      };
    }
  }

  async function getAICoachResponse(message: string, session: GameSession) {
    // Integrate with Groq API for chat response in coach mode
    return "That's a great question! In this position, you should focus on controlling the center squares...";
  }

  async function getAISuggestions(fen: string, session: GameSession) {
    // Integrate with Stockfish to get top 3 moves
    return {
      suggestions: [
        { move: "Nf3", evaluation: "+0.2", explanation: "Develops knight and controls center" },
        { move: "e4", evaluation: "+0.1", explanation: "Opens up the position" },
        { move: "d4", evaluation: "0.0", explanation: "Solid central control" },
      ],
    };
  }

  // AI Chess Routes
  app.post('/api/chess/ai-move', async (req, res) => {
    try {
      const { fen, model, difficulty, gameMode = "classic", recentMoves, gameId } = req.body;

      // Validate the FEN first
      try {
        const chess = new Chess(fen);
        if (chess.moves().length === 0) {
          return res.status(400).json({ error: 'No legal moves available' });
        }
      } catch (fenError) {
        return res.status(400).json({ error: 'Invalid FEN position' });
      }

      // Build game memory context
      let gameMemory;
      if (gameId) {
        gameMemory = groqAIService.getGameMemory(gameId) || {
          gameId,
          gamePhase: 'opening' as const,
          keyMoments: [],
          playerStrengths: [],
          playerWeaknesses: [],
          commonMistakes: []
        };
      }

      // Try Groq AI first, fallback to local engine
      let aiResponse;
      try {
        console.log(`Optimized AI move generation for ${model} at difficulty ${difficulty}`);
        aiResponse = await groqAIService.generateMove({ 
          fen, 
          model, 
          difficulty, 
          gameMode,
          recentMoves,
          gameMemory
        });
        console.log('AI move successful:', aiResponse.move);
      } catch (groqError) {
        console.log('Groq AI failed, using local engine:', groqError instanceof Error ? groqError.message : String(groqError));
        try {
          aiResponse = aiChessEngine.generateMove({ fen, model, difficulty });
        } catch (localError) {
          console.error('Local engine also failed:', localError);
          return res.status(500).json({ error: 'Both AI engines failed to generate move' });
        }
      }

      res.json(aiResponse);
    } catch (error) {
      console.error('AI move error:', error);
      res.status(500).json({ error: 'Failed to generate AI move' });
    }
  });

  app.post('/api/chess/analyze-move', async (req, res) => {
    try {
      const { fen, move, model } = req.body;
      const analysis = aiChessEngine.analyzeMove(fen, move);
      res.json(analysis);
    } catch (error) {
      console.error('Move analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze move' });
    }
  });

  app.post('/api/chess/feedback', async (req, res) => {
    try {
      const { fen, moves, model } = req.body;
      const feedback = aiChessEngine.generateFeedback(fen, moves, model);
      res.json({ feedback });
    } catch (error) {
      console.error('AI feedback error:', error);
      res.status(500).json({ error: 'Failed to generate feedback' });
    }
  });

  

  app.post('/api/chess/coach-response', async (req, res) => {
    try {
      const { message, fen, model, gameId } = req.body;

      // Get game memory for personalized coaching
      let gameMemory;
      if (gameId) {
        gameMemory = groqAIService.getGameMemory(gameId);
      }

      // Try Groq AI first, fallback to basic response
      try {
        const response = await groqAIService.generateCoachResponse(message, fen, model, gameMemory);
        res.json({ response });
      } catch (groqError) {
        console.log('Groq coach failed, using fallback:', groqError instanceof Error ? groqError.message : String(groqError));
        const fallbackResponse = `Great question about "${message}"! In this position, focus on piece development and tactical awareness. What specific move or concept would you like help with?`;
        res.json({ response: fallbackResponse });
      }
    } catch (error) {
      console.error('Coach response error:', error);
      res.status(500).json({ error: 'Failed to generate coach response' });
    }
  });

  // User Stats API endpoint
  app.get('/api/users/:id/stats', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      // Try to get from storage
      const games = await storage.getUserGames(userId);

      const stats = {
        gamesPlayed: games.length,
        totalWins: games.filter(g => g.result === 'win').length,
        totalLosses: games.filter(g => g.result === 'loss').length,  
        totalDraws: games.filter(g => g.result === 'draw').length,
        averageRating: games.reduce((sum, g) => sum + 1200, 0) / Math.max(games.length, 1),
        currentStreak: calculateCurrentStreak(games),
        bestStreak: calculateBestStreak(games),
        winRate: 0
      };

      stats.winRate = stats.gamesPlayed > 0 ? (stats.totalWins / stats.gamesPlayed) * 100 : 0;

      res.json(stats);
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      res.status(500).json({ error: 'Failed to fetch user stats' });
    }
  });

  function calculateCurrentStreak(games: any[]): number {
    let streak = 0;
    for (let i = games.length - 1; i >= 0; i--) {
      if (games[i].result === 'win') {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  function calculateBestStreak(games: any[]): number {
    let currentStreak = 0;
    let bestStreak = 0;

    for (const game of games) {
      if (game.result === 'win') {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return bestStreak;
  }

  return httpServer;
}