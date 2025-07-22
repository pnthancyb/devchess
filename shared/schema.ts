import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  language: text("language").notNull().default("en"),
  theme: text("theme").notNull().default("light"),
  rating: integer("rating").notNull().default(1200),
  gamesPlayed: integer("games_played").notNull().default(0),
  gamesWon: integer("games_won").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  mode: text("mode").notNull(), // classic, feedback, scoring, coach, opening
  fen: text("fen").notNull(),
  pgn: text("pgn").notNull().default(""),
  status: text("status").notNull().default("active"), // active, completed, abandoned
  aiMemory: jsonb("ai_memory"),
  result: text("result"), // win, loss, draw
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const moves = pgTable("moves", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id),
  moveNumber: integer("move_number").notNull(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  piece: text("piece").notNull(),
  san: text("san").notNull(),
  fen: text("fen").notNull(),
  evaluation: text("evaluation"),
  score: text("score"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id),
  sender: text("sender").notNull(), // user, ai
  message: text("message").notNull(),
  language: text("language").notNull().default("en"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  language: true,
  theme: true,
});

export const insertGameSchema = createInsertSchema(games).pick({
  userId: true,
  mode: true,
  fen: true,
  pgn: true,
  status: true,
  aiMemory: true,
  result: true,
});

export const insertMoveSchema = createInsertSchema(moves).pick({
  gameId: true,
  moveNumber: true,
  from: true,
  to: true,
  piece: true,
  san: true,
  fen: true,
  evaluation: true,
  score: true,
  feedback: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  gameId: true,
  sender: true,
  message: true,
  language: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Move = typeof moves.$inferSelect;
export type InsertMove = z.infer<typeof insertMoveSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
