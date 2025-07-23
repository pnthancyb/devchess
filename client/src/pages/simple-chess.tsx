import { useSimpleChess } from "@/hooks/use-simple-chess";
import { ChessBoard } from "@/components/chess-board";
import { MoveHistory } from "@/components/move-history";
import { GameModeSelector } from "@/components/game-mode-selector";
import { EnhancedSettings } from "@/components/enhanced-settings";
import { AIFeedback } from "@/components/ai-feedback";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelector } from "@/components/language-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, RotateCcw } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function SimpleChess() {
  const { t } = useI18n();
  const {
    chess,
    fen,
    moves,
    isPlayerTurn,
    isAIThinking,
    gameMode,
    makeMove,
    resetGame,
    setGameMode,
    downloadGamePGN,
    isValidMove,
    getValidMoves,
  } = useSimpleChess();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">♛ Chess Groq Coach</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <EnhancedSettings
                currentModel="llama3-70b-8192"
                currentDifficulty={5}
                onModelChange={() => {}}
                onDifficultyChange={() => {}}
                onGameSettingsChange={() => {}}
              />
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Game Mode Selector */}
        <div className="mb-6">
          <GameModeSelector
            selectedMode={gameMode}
            onModeChange={setGameMode}
          />
        </div>

        {/* Game Controls */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            {t("resetGame")}
          </Button>
          
          {moves.length > 0 && (
            <Button onClick={downloadGamePGN} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download PGN
            </Button>
          )}
        </div>

        {/* Game Board and Analysis */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Chess Board */}
          <div className="xl:col-span-2 order-2 xl:order-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">Chess Board</h3>
                    <p className="text-sm text-muted-foreground">FEN: {fen}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm">
                      {isPlayerTurn ? "Your turn" : isAIThinking ? "AI is thinking..." : "AI's turn"}
                    </p>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Game Mode: {gameMode} | Moves: {moves.length}
                  </div>
                  
                  {/* Simple move input for testing */}
                  <div className="mt-4 text-sm">
                    <button 
                      onClick={() => makeMove('e2' as any, 'e4' as any)}
                      className="px-3 py-1 bg-blue-500 text-white rounded mr-2"
                      disabled={!isPlayerTurn || isAIThinking}
                    >
                      e2-e4
                    </button>
                    <button 
                      onClick={() => makeMove('d2' as any, 'd4' as any)}
                      className="px-3 py-1 bg-blue-500 text-white rounded mr-2"
                      disabled={!isPlayerTurn || isAIThinking}
                    >
                      d2-d4
                    </button>
                    <button 
                      onClick={() => makeMove('g1' as any, 'f3' as any)}
                      className="px-3 py-1 bg-blue-500 text-white rounded"
                      disabled={!isPlayerTurn || isAIThinking}
                    >
                      Nf3
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="xl:col-span-1 order-1 xl:order-2 space-y-4">
            {/* AI Analysis Panel */}
            <AIFeedback
              mode={gameMode}
              feedback={undefined}
              score={undefined}
              evaluation={undefined}
              quality={undefined}
            />

            {/* Move History Panel */}
            <MoveHistory
              moves={moves.map((move, index) => ({
                ...move,
                id: index + 1,
              }))}
              onMoveSelect={() => {}}
              selectedMove={undefined}
            />
          </div>
        </div>
      </main>
    </div>
  );
}