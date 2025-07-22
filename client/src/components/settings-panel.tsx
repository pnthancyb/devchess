import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Bot, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
// AI Models configuration
const AI_MODELS = [
  {
    id: "moonshotai/kimi-k2-instruct",
    name: "Moonshot Kimi",
    description: "Advanced reasoning model with deep strategic understanding",
    minDifficulty: 3,
    maxDifficulty: 5
  },
  {
    id: "deepseek-r1-distill-llama-70b",
    name: "DeepSeek R1",
    description: "High-performance model optimized for complex analysis",
    minDifficulty: 4,
    maxDifficulty: 5
  },
  {
    id: "llama3-70b-8192",
    name: "LLaMA 3 70B",
    description: "Versatile model suitable for all skill levels",
    minDifficulty: 1,
    maxDifficulty: 5
  }
];

interface SettingsPanelProps {
  currentModel: string;
  currentDifficulty: number;
  onModelChange: (model: string) => void;
  onDifficultyChange: (difficulty: number) => void;
}

export function SettingsPanel({ 
  currentModel, 
  currentDifficulty, 
  onModelChange, 
  onDifficultyChange 
}: SettingsPanelProps) {
  const { t } = useI18n();
  const [localDifficulty, setLocalDifficulty] = useState(currentDifficulty);

  const handleDifficultyChange = (value: number[]) => {
    const newDifficulty = value[0];
    setLocalDifficulty(newDifficulty);
    onDifficultyChange(newDifficulty);
  };

  const getDifficultyLabel = (difficulty: number) => {
    const labels = {
      1: 'Beginner (800-1000)',
      2: 'Casual (1000-1200)', 
      3: 'Intermediate (1200-1500)',
      4: 'Advanced (1500-1800)',
      5: 'Expert (1800+)'
    };
    return labels[difficulty as keyof typeof labels] || `Level ${difficulty}`;
  };

  const getModelDisplayName = (modelId: string) => {
    const model = AI_MODELS.find(m => m.id === modelId);
    return model?.name || modelId;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          {t('settings.title')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t('settings.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-6">
          {/* AI Model Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="w-5 h-5" />
                {t('settings.aiModel')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model-select">{t('settings.selectModel')}</Label>
                <Select value={currentModel} onValueChange={onModelChange}>
                  <SelectTrigger id="model-select">
                    <SelectValue>{getModelDisplayName(currentModel)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ELO {model.minDifficulty * 400 + 800}-{model.maxDifficulty * 400 + 800}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {model.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>{t('settings.currentModel')}:</strong> {getModelDisplayName(currentModel)}
                </p>
                {AI_MODELS.find(m => m.id === currentModel) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {AI_MODELS.find(m => m.id === currentModel)?.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Difficulty Level */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5" />
                {t('settings.difficulty')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label htmlFor="difficulty-slider">{t('settings.difficultyLevel')}</Label>
                  <span className="text-sm font-medium">
                    {getDifficultyLabel(localDifficulty)} ({localDifficulty}/5)
                  </span>
                </div>

                <Slider
                  id="difficulty-slider"
                  min={1}
                  max={5}
                  step={1}
                  value={[localDifficulty]}
                  onValueChange={handleDifficultyChange}
                  className="w-full"
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t('settings.beginner')}</span>
                  <span>{t('settings.expert')}</span>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Current Level:</strong> {getDifficultyLabel(localDifficulty)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {localDifficulty <= 2 && 'Focuses on basic principles and simple tactics. Good for learning fundamentals.'}
                  {localDifficulty === 3 && 'Balanced strategic and tactical play. Suitable for intermediate improvement.'}
                  {localDifficulty >= 4 && 'Advanced positional understanding and deep calculation. Challenging gameplay.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Model Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('settings.recommendations')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {AI_MODELS.map((model) => (
                  <div key={model.id} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <p className="font-medium text-sm">{model.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Best for levels {model.minDifficulty}-{model.maxDifficulty}
                      </p>
                    </div>
                    {localDifficulty >= model.minDifficulty && 
                     localDifficulty <= model.maxDifficulty && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Recommended
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}