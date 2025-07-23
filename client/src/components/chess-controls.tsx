import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCcw, Download, Settings, Cpu } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { AIModelSelector } from "./ai-model-selector";
import { useState } from "react";

interface ChessControlsProps {
  onReset: () => void;
  onDownloadPGN: () => void;
  aiModel: string;
  difficulty: number;
  onAIModelChange: (model: string) => void;
  onDifficultyChange: (level: number) => void;
  isGameActive: boolean;
}

export function ChessControls({
  onReset,
  onDownloadPGN,
  aiModel,
  difficulty,
  onAIModelChange,
  onDifficultyChange,
  isGameActive
}: ChessControlsProps) {
  const { t } = useI18n();
  const [showAISettings, setShowAISettings] = useState(false);

  return (
    <div className="space-y-3">
      {/* Main Controls */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={onReset} 
              variant="outline" 
              size="sm"
              className="flex-1 min-w-[100px]"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Reset Game
            </Button>
            
            <Button 
              onClick={onDownloadPGN} 
              variant="outline" 
              size="sm"
              className="flex-1 min-w-[100px]"
              disabled={!isGameActive}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PGN
            </Button>
            
            <Button 
              onClick={() => setShowAISettings(!showAISettings)}
              variant="outline" 
              size="sm"
              className="flex-1 min-w-[100px]"
            >
              <Cpu className="w-4 h-4 mr-2" />
              AI Model
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Level Controls */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Level</span>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onDifficultyChange(Math.max(1, difficulty - 1))}
                disabled={difficulty <= 1}
              >
                -
              </Button>
              <span className="text-sm font-medium px-3">
                {difficulty}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onDifficultyChange(Math.min(5, difficulty + 1))}
                disabled={difficulty >= 5}
              >
                +
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Model Selector (Expandable) */}
      {showAISettings && (
        <AIModelSelector
          selectedModel={aiModel}
          onModelChange={onAIModelChange}
          difficulty={difficulty}
          onDifficultyChange={onDifficultyChange}
        />
      )}
    </div>
  );
}