import { users, games, moves, chatMessages, type User, type InsertUser, type Game, type InsertGame, type Move, type InsertMove, type ChatMessage, type InsertChatMessage } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: number): Promise<Game | undefined>;
  getUserGames(userId: number): Promise<Game[]>;
  updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined>;

  // Move operations
  createMove(move: InsertMove): Promise<Move>;
  getGameMoves(gameId: number): Promise<Move[]>;

  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getGameChatMessages(gameId: number): Promise<ChatMessage[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private moves: Map<number, Move>;
  private chatMessages: Map<number, ChatMessage>;
  private currentUserId: number;
  private currentGameId: number;
  private currentMoveId: number;
  private currentChatId: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.moves = new Map();
    this.chatMessages = new Map();
    this.currentUserId = 1;
    this.currentGameId = 1;
    this.currentMoveId = 1;
    this.currentChatId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      language: insertUser.language || "en",
      theme: insertUser.theme || "light",
      rating: 1200,
      gamesPlayed: 0,
      gamesWon: 0,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.currentGameId++;
    const game: Game = {
      ...insertGame,
      id,
      userId: insertGame.userId || null,
      status: insertGame.status || "active",
      pgn: insertGame.pgn || "",
      aiMemory: insertGame.aiMemory || null,
      result: insertGame.result || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.games.set(id, game);
    return game;
  }

  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getUserGames(userId: number): Promise<Game[]> {
    return Array.from(this.games.values()).filter(
      (game) => game.userId === userId,
    );
  }

  async updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;
    
    const updatedGame = { ...game, ...updates, updatedAt: new Date() };
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  async createMove(insertMove: InsertMove): Promise<Move> {
    const id = this.currentMoveId++;
    const move: Move = {
      ...insertMove,
      id,
      gameId: insertMove.gameId || null,
      evaluation: insertMove.evaluation || null,
      score: insertMove.score || null,
      feedback: insertMove.feedback || null,
      createdAt: new Date(),
    };
    this.moves.set(id, move);
    return move;
  }

  async getGameMoves(gameId: number): Promise<Move[]> {
    return Array.from(this.moves.values())
      .filter((move) => move.gameId === gameId)
      .sort((a, b) => a.moveNumber - b.moveNumber);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatId++;
    const message: ChatMessage = {
      ...insertMessage,
      id,
      gameId: insertMessage.gameId || null,
      language: insertMessage.language || "en",
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getGameChatMessages(gameId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter((message) => message.gameId === gameId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}

export const storage = new MemStorage();
