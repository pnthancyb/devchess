import { useState, useEffect } from "react";
import { useChessGame } from "@/hooks/use-chess-game";
import { ChessBoard } from "@/components/chess-board";
import { ChessControls } from "@/components/chess-controls";
import { MoveHistory } from "@/components/move-history";
import { UserStats } from "@/components/user-stats";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelector } from "@/components/language-selector";
import { SettingsPanel } from "@/components/settings-panel";
import { GameModeSelector } from "@/components/game-mode-selector";
import { OpeningSelector } from "@/components/opening-selector";
import { OpeningLearningEnhanced } from "@/components/opening-learning-enhanced";
import { CoachChat } from "@/components/coach-chat";
import { AIAnalysisPanel } from "@/components/ai-analysis-panel";
import { useI18n } from "@/lib/i18n";
import type { GameMode, ChessOpening } from "@/types/chess";

export default function ChessGamePage() {
  const { t } = useI18n();
  const [gameId] = useState<number>(1);

  const {
    gameState,
    connectionState,
    makeMove,
    resetGame,
    setGameMode,
    updateAISettings,
    updateAIModel,
    sendChatMessage,
    downloadGamePGN,
    isValidMove,
    getValidMoves,
    openingLearningState,
    setSelectedOpening,
    chatMessages,
  } = useChessGame(gameId);

  const isOpeningMode = gameState.gameMode === "opening";
  const isCoachMode = gameState.gameMode === "coach";

  const handleModeChange = (mode: GameMode) => {
    setGameMode(mode);
    if (mode !== "opening") {
      setSelectedOpening(null);
    }
    resetGame();
  };

  const handleOpeningSelect = (opening: ChessOpening) => {
    setSelectedOpening(opening);
    setGameMode("opening");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-primary">♔ Chess Coach</h1>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionState === "connected" ? "bg-green-500" : 
                  connectionState === "connecting" ? "bg-yellow-500" : "bg-gray-500"
                }`} />
                <span className="text-sm text-muted-foreground">
                  {connectionState === "connected" ? "Ready" : 
                   connectionState === "connecting" ? "Connecting..." : "Local Mode"}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <ThemeToggle />
              <SettingsPanel
                currentModel={gameState.aiModel}
                currentDifficulty={gameState.difficulty}
                onModelChange={updateAIModel}
                onDifficultyChange={(difficulty) => updateAISettings(gameState.aiModel, difficulty)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="xl:col-span-3 space-y-6">
            <GameModeSelector
              currentMode={gameState.gameMode}
              onModeChange={handleModeChange}
            />

            {!isOpeningMode && !isCoachMode && (
              <OpeningSelector onOpeningSelect={handleOpeningSelect} />
            )}

            <UserStats userId={1} />
          </div>

          {/* Chess Board */}
          <div className="xl:col-span-6">
            <ChessBoard
              position={gameState.currentFen}
              onMove={makeMove}
              isPlayerTurn={gameState.isPlayerTurn}
              isAIThinking={gameState.isAIThinking}
              onReset={resetGame}
              onDownloadPGN={downloadGamePGN}
              moves={gameState.moves}
              aiModel={gameState.aiModel}
              difficulty={gameState.difficulty}
              isValidMove={isValidMove}
              getValidMoves={getValidMoves}
              orientation={gameState.boardOrientation}
              lastMove={gameState.moves[gameState.moves.length - 1]}
              isCheck={gameState.chess.isCheck()}
              isGameOver={gameState.chess.isGameOver()}
            />

            <ChessControls
              onReset={resetGame}
              onDownloadPGN={downloadGamePGN}
              gameMode={gameState.gameMode}
              currentModel={gameState.aiModel}
              currentDifficulty={gameState.difficulty}
              onModelChange={updateAIModel}
              onDifficultyChange={(difficulty) => updateAISettings(gameState.aiModel, difficulty)}
              isAIThinking={gameState.isAIThinking}
            />
          </div>

          {/* Right Sidebar */}
          <div className="xl:col-span-3 space-y-6">
            {/* Opening Learning Enhanced */}
            {isOpeningMode && openingLearningState.selectedOpening ? (
              <OpeningLearningEnhanced
                opening={openingLearningState.selectedOpening}
                learningState={openingLearningState}
                onMoveAttempt={(move: string) => {
                  // Attempt to make the move on the board
                  const chess = gameState.chess;
                  try {
                    const moveResult = chess.move(move);
                    if (moveResult) {
                      return true;
                    }
                  } catch (error) {
                    console.log("Move attempt failed:", move, error);
                  }
                  return false;
                }}
                onReset={() => {
                  setSelectedOpening(null);
                  resetGame();
                }}
                currentFen={gameState.currentFen}
                aiModel={gameState.aiModel}
                aiDifficulty={gameState.difficulty}
                onAIMove={() => {
                  // Trigger AI move in opening learning
                  console.log("AI move triggered in opening learning");
                }}
              />
            ) : isCoachMode ? (
              /* Coach Chat */
              <CoachChat
                messages={chatMessages}
                onSendMessage={sendChatMessage}
                isAIThinking={gameState.isAIThinking}
              />
            ) : (
              /* AI Analysis Panel */
              <AIAnalysisPanel
                mode={gameState.gameMode}
                feedback={gameState.lastAIFeedback?.feedback}
                score={gameState.lastAIFeedback?.score?.toString()}
                evaluation={gameState.lastAIFeedback?.evaluation}
                quality={gameState.lastAIFeedback?.quality === "excellent" ? "good" : 
                        gameState.lastAIFeedback?.quality === "blunder" ? "bad" : "neutral"}
                isLoading={gameState.isAIThinking}
              />
            )}

            {/* Move History */}
            <MoveHistory
              moves={gameState.moves}
              currentMoveIndex={gameState.moves.length - 1}
              onMoveSelect={(moveIndex) => {
                // TODO: Implement move navigation
                console.log("Move selected:", moveIndex);
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}