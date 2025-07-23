
import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertGameSchema, insertMoveSchema, insertChatMessageSchema } from "@shared/schema";
import { aiChessEngine } from "./ai-chess";
import { groqAIService } from "./groq-ai";
import { stockfishEngine } from "./stockfish-engine";
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
  aiModel?: string;
  difficulty?: number;
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

          // Use Groq AI for coach response with valid model
          let aiResponse;
          try {
            // Use a valid Groq model instead of stockfish-16
            const coachModel = session.aiModel && session.aiModel !== 'stockfish-16' 
              ? session.aiModel 
              : "llama3-70b-8192";
            aiResponse = await groqAIService.generateCoachResponse(message, currentFen, coachModel, gameMemory);
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
      const { gameId, userId = 1, language = 'en', gameMode = 'classic', aiModel = 'stockfish-16', difficulty = 5 } = data;
      
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
      let moves: any[] = [];
      let chatMessages: any[] = [];
      
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
          moves: moves,
          chatMessages: chatMessages,
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
      // Validate FEN before analysis
      if (!move.fen || typeof move.fen !== 'string') {
        throw new Error('Invalid FEN provided');
      }
      
      // Test FEN validity
      const testChess = new Chess(move.fen);
      if (!testChess) {
        throw new Error('Invalid chess position');
      }
      
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
      // Determine which AI model to use
      const aiModel = session.aiModel || 'stockfish-16';
      const difficulty = Math.max(1, Math.min(10, session.difficulty || 5)); // Extended range 1-10
      
      let aiResponse;
      
      if (aiModel === 'stockfish-16') {
        // Use Stockfish engine for strongest play
        console.log(`Using Stockfish engine at difficulty ${difficulty}`);
        const stockfishMove = await stockfishEngine.getBestMove(move.fen, difficulty, 2000);
        
        if (stockfishMove) {
          const chess = new Chess(move.fen);
          const validatedMove = chess.move({
            from: stockfishMove.from,
            to: stockfishMove.to,
            promotion: stockfishMove.promotion
          });
          
          if (validatedMove) {
            return {
              aiMove: {
                from: validatedMove.from,
                to: validatedMove.to,
                piece: validatedMove.piece,
                captured: validatedMove.captured,
                promotion: validatedMove.promotion,
                san: validatedMove.san,
                fen: chess.fen(),
                moveNumber: move.moveNumber + 1
              },
              reasoning: `Stockfish-16 analysis at level ${difficulty}`,
            };
          }
        }
        
        // If Stockfish fails, fall back to local AI engine
        console.log('Stockfish failed, using local AI engine');
        const localResponse = aiChessEngine.generateMove({ 
          fen: move.fen, 
          model: aiModel, 
          difficulty 
        });
        
        if (localResponse && localResponse.move) {
          const chess = new Chess(move.fen);
          const aiMove = chess.move(localResponse.move);

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
              reasoning: localResponse.reasoning || "Local AI engine move",
            };
          }
        }
      } else {
        // Use Groq LLM models for human-like play
        try {
          console.log(`Using Groq model ${aiModel} at difficulty ${Math.min(difficulty, 5)}`); // Groq limited to 1-5
          const groqDifficulty = Math.min(difficulty, 5); // Limit Groq to max difficulty 5
          
          aiResponse = await groqAIService.generateMove({
            fen: move.fen,
            model: aiModel,
            difficulty: groqDifficulty,
            gameMode: session.mode,
            recentMoves: []
          });
          
          if (aiResponse && aiResponse.move) {
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
                reasoning: aiResponse.reasoning || `${aiModel} move generation`,
              };
            }
          }
        } catch (groqError) {
          console.log('Groq AI failed, falling back to Stockfish:', groqError instanceof Error ? groqError.message : String(groqError));
          
          // Fall back to Stockfish when Groq fails
          try {
            const stockfishMove = await stockfishEngine.getBestMove(move.fen, difficulty, 2000);
            
            if (stockfishMove) {
              const chess = new Chess(move.fen);
              const validatedMove = chess.move({
                from: stockfishMove.from,
                to: stockfishMove.to,
                promotion: stockfishMove.promotion
              });
              
              if (validatedMove) {
                return {
                  aiMove: {
                    from: validatedMove.from,
                    to: validatedMove.to,
                    piece: validatedMove.piece,
                    captured: validatedMove.captured,
                    promotion: validatedMove.promotion,
                    san: validatedMove.san,
                    fen: chess.fen(),
                    moveNumber: move.moveNumber + 1
                  },
                  reasoning: `Stockfish fallback (${aiModel} failed)`,
                };
              }
            }
          } catch (stockfishError) {
            console.log('Stockfish fallback also failed');
          }
        }
      }
      
      // Final fallback: local AI engine
      console.log('Using final fallback: local AI engine');
      const localResponse = aiChessEngine.generateMove({ 
        fen: move.fen, 
        model: 'local', 
        difficulty 
      });
      
      if (localResponse && localResponse.move) {
        const chess = new Chess(move.fen);
        const aiMove = chess.move(localResponse.move);

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
            reasoning: "Local AI engine fallback",
          };
        }
      }

      throw new Error('No valid AI move could be generated');
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

      const adjustedDifficulty = Math.max(1, Math.min(10, difficulty || 5)); // Extended range 1-10
      let aiResponse;

      // Check if it's Stockfish model or if model doesn't exist in Groq
      if (model === 'stockfish-16' || model.includes('stockfish')) {
        try {
          console.log(`Using Stockfish engine at difficulty ${adjustedDifficulty}`);
          const stockfishMove = await stockfishEngine.getBestMove(fen, adjustedDifficulty, 2000);
          
          if (stockfishMove) {
            const chess = new Chess(fen);
            const validatedMove = chess.move({
              from: stockfishMove.from,
              to: stockfishMove.to,
              promotion: stockfishMove.promotion
            });
            
            if (validatedMove) {
              aiResponse = {
                move: { from: validatedMove.from, to: validatedMove.to, promotion: validatedMove.promotion },
                reasoning: `Stockfish-16 analysis at level ${adjustedDifficulty}`,
                analysis: `${validatedMove.san} - Strategic Stockfish play`,
                score: "0.0"
              };
            }
          }
          
          if (!aiResponse) {
            throw new Error('Stockfish failed to generate move');
          }
        } catch (stockfishError) {
          console.log('Stockfish failed, using local engine:', stockfishError instanceof Error ? stockfishError.message : String(stockfishError));
          
          // Use local AI engine as fallback
          const localResponse = aiChessEngine.generateMove({ fen, model, difficulty: adjustedDifficulty });
          if (localResponse && localResponse.move) {
            aiResponse = {
              move: localResponse.move,
              reasoning: localResponse.reasoning || "Local AI engine fallback",
              analysis: `AI analysis at difficulty ${adjustedDifficulty}`,
              score: "0.0"
            };
          }
        }
      } else {
        // Build game memory context for Groq models
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

        // Use Groq AI for LLM models (limit difficulty to 1-5 for Groq)
        const groqDifficulty = Math.min(adjustedDifficulty, 5);
        try {
          console.log(`Optimized AI move generation for ${model} at difficulty ${groqDifficulty}`);
          aiResponse = await groqAIService.generateMove({ 
            fen, 
            model, 
            difficulty: groqDifficulty, 
            gameMode,
            recentMoves,
            gameMemory
          });
          console.log('AI move successful:', aiResponse.move);
        } catch (groqError) {
          console.log('Groq AI failed, using local engine:', groqError instanceof Error ? groqError.message : String(groqError));
          
          // Fallback to local AI engine when Groq fails
          const localResponse = aiChessEngine.generateMove({ fen, model: 'local', difficulty: adjustedDifficulty });
          if (localResponse && localResponse.move) {
            aiResponse = {
              move: localResponse.move,
              reasoning: localResponse.reasoning || `Local AI fallback (${model} failed)`,
              analysis: `Local AI analysis at difficulty ${adjustedDifficulty}`,
              score: "0.0"
            };
          }
        }
      }

      if (!aiResponse) {
        return res.status(500).json({ error: 'Failed to generate AI move' });
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
      
      // Validate FEN before processing
      if (!fen || typeof fen !== 'string' || fen.trim() === '') {
        console.error('Invalid FEN provided:', fen);
        return res.status(400).json({ error: 'Invalid FEN provided' });
      }
      
      // Test FEN validity
      try {
        const testChess = new Chess(fen.trim());
        // Check if chess instance was created successfully
        if (!testChess || testChess.isGameOver() === undefined) {
          throw new Error('Invalid chess position');
        }
      } catch (fenError) {
        console.error('FEN validation failed:', fenError, 'FEN:', fen);
        return res.status(400).json({ error: 'Invalid chess position' });
      }
      
      const feedback = aiChessEngine.generateFeedback(fen, moves || [], model || 'default');
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
        // Ensure we use a valid Groq model
        const validModel = model && model !== 'stockfish-16' ? model : "llama3-70b-8192";
        const response = await groqAIService.generateCoachResponse(message, fen, validModel, gameMemory);
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
