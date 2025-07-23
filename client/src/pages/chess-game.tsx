import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelector } from "@/components/language-selector";
import { SettingsPanel } from "@/components/settings-panel";
import { GameModeSelector } from "@/components/game-mode-selector";
import { ChessBoard } from "@/components/chess-board";
import { MoveHistory } from "@/components/move-history";
import { AIFeedback } from "@/components/ai-feedback";
import { CoachChat } from "@/components/coach-chat";
import { OpeningSelector } from "@/components/opening-selector";
import { OpeningFeedback } from "@/components/opening-feedback";
import { UserStats } from "@/components/user-stats";
import { PerfectChessInterface } from "@/components/perfect-chess-interface";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Target, Award, Crown, MessageSquare, BarChart3, Eye, RefreshCcw, Book } from "lucide-react";
import { useChessGame } from "@/hooks/use-chess-game";
import { useI18n } from "@/lib/i18n";
import { downloadPGN } from "@/lib/chess-utils";

export default function ChessGame() {
  const { id } = useParams();
  const { t } = useI18n();
  const gameId = id ? parseInt(id) : undefined;

  const {
    gameState,
    connectionState,
    makeMove,
    sendChatMessage,
    setGameMode,
    resetGame,
    updateAISettings,
    openingLearningState,
    setSelectedOpening,
    chatMessages,
  } = useChessGame(gameId);

  const [selectedMove, setSelectedMove] = useState<number>();

  useEffect(() => {
    // Auto-scroll to latest move
    setSelectedMove(gameState.moves.length - 1);
  }, [gameState.moves.length]);

  const handleDownloadPGN = () => {
    downloadPGN(gameState.moves, {
      white: "Player",
      black: "Groq AI",
      mode: gameState.gameMode,
    });
  };

  const isCoachMode = gameState.gameMode === "coach";
  const isOpeningMode = gameState.gameMode === "opening";

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="bg-card shadow-sm border-b sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-chess-blue rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 22H5a1 1 0 0 1-1-1v-2h16v2a1 1 0 0 1-1 1zM18 18H6l1-7h2l1-2h1l1-2h2l1 2h1l1 2h2l1 7z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">{t("chess.groq.coach")}</h1>
                <p className="text-xs text-muted-foreground">{t("ai.powered.training")}</p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <ThemeToggle />
              <div className="w-8 h-8 gradient-chess-gold rounded-full flex items-center justify-center text-white font-semibold text-sm">
                P
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Game Mode Selector and Settings */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mb-6">
          <div className="flex-1">
            <GameModeSelector
              selectedMode={gameState.gameMode}
              onModeChange={setGameMode}
            />
          </div>
          <div className="flex gap-2 sm:gap-4">
            {/* Difficulty controls directly in header */}
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateAISettings(gameState.aiModel, Math.max(1, gameState.difficulty - 1))}
                disabled={gameState.difficulty <= 1}
              >
                -
              </Button>
              <span className="text-sm font-medium px-2">
                Level {gameState.difficulty}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateAISettings(gameState.aiModel, Math.min(5, gameState.difficulty + 1))}
                disabled={gameState.difficulty >= 5}
              >
                +
              </Button>
            </div>
            <Button onClick={resetGame} variant="outline" size="sm" className="px-4">
              <RefreshCcw className="w-4 h-4 mr-2" />
              {t("reset.game")}
            </Button>
            <Button onClick={handleDownloadPGN} variant="outline" size="sm" className="px-4">
              <Plus className="w-4 h-4 mr-2" />
              {t("download.pgn")}
            </Button>
          </div>
        </div>

        {/* Opening Learning Mode Interface */}
        {isOpeningMode && !openingLearningState.selectedOpening && (
          <div className="mb-6">
            <OpeningSelector
              onSelectOpening={setSelectedOpening}
              selectedOpening={openingLearningState.selectedOpening}
            />
          </div>
        )}

        {/* Game Layout */}
        <div className="flex flex-col xl:grid xl:grid-cols-4 gap-6">
          {/* Chessboard Section */}
          <div className="xl:col-span-3 order-2 xl:order-1">
            <Card>
              <CardContent className="p-3 sm:p-6">
                <ChessBoard
                  position={gameState.currentFen}
                  onMove={makeMove}
                  isPlayerTurn={gameState.isPlayerTurn}
                  isAIThinking={gameState.isAIThinking}
                  onReset={resetGame}
                  onDownloadPGN={handleDownloadPGN}
                  moves={gameState.moves}
                  aiModel={gameState.aiModel}
                  difficulty={gameState.difficulty}
                />
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="xl:col-span-1 order-1 xl:order-2 space-y-4">
            {/* User Stats - Mobile/Tablet View */}
            <div className="xl:hidden">
              <UserStats />
            </div>

            {/* Opening Learning Feedback */}
            {isOpeningMode && openingLearningState.selectedOpening ? (
              <OpeningFeedback
                opening={openingLearningState.selectedOpening}
                learningState={openingLearningState}
              />
            ) : (
              /* AI Feedback Panel */
              <AIFeedback
                feedback={gameState.lastAIFeedback}
                isThinking={gameState.isAIThinking}
              />
            )}

            {/* Coach Chat Panel */}
            {isCoachMode && (
              <CoachChat
                messages={chatMessages}
                onSendMessage={sendChatMessage}
                position={gameState.currentFen}
                isCoachThinking={gameState.isAIThinking}
              />
            )}

            {/* Move History Panel */}
            <MoveHistory
              moves={gameState.moves}
              onMoveSelect={setSelectedMove}
              selectedMove={selectedMove}
            />

            {/* User Stats - Desktop View */}
            <div className="hidden xl:block">
              <UserStats />
            </div>
          </div>
        </div>
      </main>

      {/* Connection Status */}
      {connectionState !== "connected" && (
        <div className="fixed bottom-4 left-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            {connectionState === "connecting" ? "Connecting..." : "Disconnected"}
          </p>
        </div>
      )}
    </div>
  );
}