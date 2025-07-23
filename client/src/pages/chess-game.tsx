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
import { Plus, TrendingUp, Target, Award, Crown, MessageSquare, BarChart3, Eye, RefreshCcw, Book, Download } from "lucide-react";
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
    updateAIModel,
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
      black: `AI (${gameState.aiModel})`,
      mode: gameState.gameMode,
      aiModel: gameState.aiModel,
      difficulty: gameState.difficulty,
      result: "*", // Always * as requested for result section
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
        {/* Game Mode Selector */}
        <div className="mb-6">
          <GameModeSelector
            selectedMode={gameState.gameMode}
            onModeChange={setGameMode}
          />
        </div>

        {/* Game Controls Header */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center justify-center">
                {/* AI Model Selection */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">AI Engine:</span>
                  <select 
                    value={gameState.aiModel} 
                    onChange={(e) => updateAIModel(e.target.value)}
                    className="px-3 py-2 border border-input rounded-md text-sm bg-background hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="stockfish-16">🏆 Stockfish 16</option>
                    <option value="llama3-70b-8192">🤖 Llama 3 70B</option>
                    <option value="deepseek-r1-distill-llama-70b">🧠 DeepSeek R1</option>
                    <option value="moonshotai/kimi-k2-instruct">⚡ Kimi K2</option>
                  </select>
                </div>

                {/* Level Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Level:</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => updateAISettings(gameState.aiModel, Math.max(1, gameState.difficulty - 1))}
                    disabled={gameState.difficulty <= 1}
                  >
                    -
                  </Button>
                  <span className="text-sm font-medium px-3 min-w-[40px] text-center">
                    {gameState.difficulty}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => updateAISettings(gameState.aiModel, Math.min(5, gameState.difficulty + 1))}
                    disabled={gameState.difficulty >= 5}
                  >
                    +
                  </Button>
                </div>

                {/* Game Actions */}
                <Button onClick={resetGame} variant="outline" size="sm">
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Reset Game
                </Button>
                
                <Button onClick={handleDownloadPGN} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download PGN
                </Button>
              </div>
            </CardContent>
          </Card>
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
                mode={gameState.gameMode}
                feedback={gameState.lastAIFeedback?.feedback}
                score={gameState.lastAIFeedback?.score?.toString()}
                evaluation={gameState.lastAIFeedback?.evaluation}
                quality={gameState.lastAIFeedback?.quality === "excellent" ? "good" : gameState.lastAIFeedback?.quality === "blunder" ? "bad" : "neutral"}
              />
            )}

            {/* Coach Chat Panel */}
            {isCoachMode && (
              <CoachChat
                currentPosition={gameState.currentFen}
                currentFen={gameState.currentFen}
                gameMode={gameState.gameMode}
                aiModel={gameState.aiModel}
                messages={chatMessages}
                onSendMessage={sendChatMessage}
                isVisible={true}
              />
            )}

            {/* Move History Panel */}
            <MoveHistory
              moves={gameState.moves.map((move, index) => ({
                id: index + 1,
                createdAt: new Date(),
                fen: move.fen,
                gameId: gameId || null,
                moveNumber: move.moveNumber,
                from: move.from,
                to: move.to,
                piece: move.piece,
                san: move.san,
                evaluation: move.analysis?.evaluation || null,
                score: move.analysis?.score?.toString() || null,
                feedback: move.analysis?.feedback || null,
              }))}
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