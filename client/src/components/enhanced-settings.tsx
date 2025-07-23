import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings, Bot, Zap, Palette, Globe, Volume2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/hooks/use-theme";

// Enhanced AI Models with proper 10-level support for Stockfish
const AI_MODELS = [
  {
    id: "stockfish-16",
    name: "Stockfish 16",
    description: "World's strongest chess engine with 10 difficulty levels",
    icon: Zap,
    color: "text-purple-600",
    minDifficulty: 1,
    maxDifficulty: 10,
    type: "engine"
  },
  {
    id: "llama3-70b-8192",
    name: "LLaMA 3 70B",
    description: "Versatile AI model suitable for all skill levels",
    icon: Bot,
    color: "text-blue-600",
    minDifficulty: 1,
    maxDifficulty: 5,
    type: "ai"
  },
  {
    id: "deepseek-r1-distill-llama-70b",
    name: "DeepSeek R1",
    description: "High-performance model optimized for complex analysis",
    icon: Bot,
    color: "text-green-600",
    minDifficulty: 4,
    maxDifficulty: 5,
    type: "ai"
  },
  {
    id: "moonshotai/kimi-k2-instruct",
    name: "Moonshot Kimi",
    description: "Advanced reasoning model with deep strategic understanding",
    icon: Bot,
    color: "text-orange-600",
    minDifficulty: 3,
    maxDifficulty: 5,
    type: "ai"
  }
];

const DIFFICULTY_LABELS = {
  1: { label: "Beginner", description: "Perfect for learning", color: "bg-green-100 text-green-800" },
  2: { label: "Casual", description: "Easy-going gameplay", color: "bg-blue-100 text-blue-800" },
  3: { label: "Intermediate", description: "Balanced challenge", color: "bg-yellow-100 text-yellow-800" },
  4: { label: "Advanced", description: "Strong tactical play", color: "bg-orange-100 text-orange-800" },
  5: { label: "Expert", description: "Very challenging", color: "bg-red-100 text-red-800" },
  6: { label: "Master", description: "Master-level strength", color: "bg-purple-100 text-purple-800" },
  7: { label: "Grandmaster", description: "Grandmaster strength", color: "bg-purple-200 text-purple-900" },
  8: { label: "Super-GM", description: "Super-grandmaster level", color: "bg-purple-300 text-purple-900" },
  9: { label: "Engine", description: "Near-perfect play", color: "bg-gray-100 text-gray-800" },
  10: { label: "Maximum", description: "Stockfish at full strength", color: "bg-black text-white" }
};

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ku", name: "Kurdish", flag: "🏳️" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" }
];

interface EnhancedSettingsProps {
  currentModel: string;
  currentDifficulty: number;
  onModelChange: (model: string) => void;
  onDifficultyChange: (difficulty: number) => void;
  gameSettings?: {
    autoPlay?: boolean;
    showCoordinates?: boolean;
    soundEnabled?: boolean;
    moveHistory?: boolean;
    analysisDepth?: number;
  };
  onGameSettingsChange?: (settings: any) => void;
}

export function EnhancedSettings({ 
  currentModel, 
  currentDifficulty, 
  onModelChange, 
  onDifficultyChange,
  gameSettings = {},
  onGameSettingsChange
}: EnhancedSettingsProps) {
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(gameSettings);

  const selectedModel = AI_MODELS.find(model => model.id === currentModel) || AI_MODELS[0];
  const maxDifficulty = selectedModel.maxDifficulty;
  const difficultyInfo = DIFFICULTY_LABELS[Math.min(currentDifficulty, 10) as keyof typeof DIFFICULTY_LABELS];

  // Ensure difficulty is within bounds
  useEffect(() => {
    if (currentDifficulty > maxDifficulty) {
      onDifficultyChange(maxDifficulty);
    }
  }, [currentDifficulty, maxDifficulty, onDifficultyChange]);

  const handleModelChange = (modelId: string) => {
    const newModel = AI_MODELS.find(m => m.id === modelId);
    if (newModel) {
      onModelChange(modelId);
      // Adjust difficulty if current is outside new model's range
      if (currentDifficulty > newModel.maxDifficulty) {
        onDifficultyChange(newModel.maxDifficulty);
      } else if (currentDifficulty < newModel.minDifficulty) {
        onDifficultyChange(newModel.minDifficulty);
      }
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onGameSettingsChange?.(newSettings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="settings-description">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Chess Settings & Configuration
          </DialogTitle>
          <DialogDescription id="settings-description">
            Configure AI settings, difficulty levels, and game preferences
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ai">AI & Difficulty</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="gameplay">Gameplay</TabsTrigger>
            <TabsTrigger value="language">Language</TabsTrigger>
          </TabsList>
          
          {/* AI & Difficulty Settings */}
          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="w-5 h-5 mr-2" />
                  AI Opponent Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Choose AI Model</Label>
                  <Select value={currentModel} onValueChange={handleModelChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select AI model" />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((model) => {
                        const Icon = model.icon;
                        return (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center space-x-2">
                              <Icon className={`w-4 h-4 ${model.color}`} />
                              <div>
                                <div className="font-medium">{model.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {model.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Difficulty Level</Label>
                    <Badge className={difficultyInfo.color}>
                      Level {currentDifficulty}: {difficultyInfo.label}
                    </Badge>
                  </div>
                  
                  <Slider
                    value={[currentDifficulty]}
                    onValueChange={(value) => onDifficultyChange(value[0])}
                    max={maxDifficulty}
                    min={selectedModel.minDifficulty}
                    step={1}
                    className="w-full"
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Level {selectedModel.minDifficulty}</span>
                    <span>Level {maxDifficulty}</span>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="font-medium text-sm mb-1">{difficultyInfo.label}</div>
                    <p className="text-xs text-muted-foreground">{difficultyInfo.description}</p>
                  </div>
                </div>

                {/* Model-specific information */}
                <div className="p-3 border rounded-lg">
                  {selectedModel.type === 'engine' ? (
                    <div className="text-sm">
                      <div className="font-semibold mb-2">Stockfish Engine Features:</div>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>• Levels 1-5: Human-like play with varying strength</li>
                        <li>• Levels 6-8: Master to Super-GM strength</li>
                        <li>• Levels 9-10: Maximum engine strength</li>
                        <li>• Perfect calculation and evaluation</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="text-sm">
                      <div className="font-semibold mb-2">AI Model Features:</div>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>• Creative and human-like gameplay</li>
                        <li>• Natural conversation and explanations</li>
                        <li>• Adaptive learning from games</li>
                        <li>• Coaching and feedback capabilities</li>
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Theme & Visual Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="coordinates">Show Board Coordinates</Label>
                    <Switch
                      id="coordinates"
                      checked={localSettings.showCoordinates ?? true}
                      onCheckedChange={(checked) => handleSettingChange('showCoordinates', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="movehistory">Show Move History</Label>
                    <Switch
                      id="movehistory"
                      checked={localSettings.moveHistory ?? true}
                      onCheckedChange={(checked) => handleSettingChange('moveHistory', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gameplay Settings */}
          <TabsContent value="gameplay" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Game Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoplay">Auto-play AI moves in openings</Label>
                    <Switch
                      id="autoplay"
                      checked={localSettings.autoPlay ?? false}
                      onCheckedChange={(checked) => handleSettingChange('autoPlay', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="sound">Sound Effects</Label>
                    <Switch
                      id="sound"
                      checked={localSettings.soundEnabled ?? true}
                      onCheckedChange={(checked) => handleSettingChange('soundEnabled', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Analysis Depth (for evaluation)</Label>
                    <Slider
                      value={[localSettings.analysisDepth ?? 15]}
                      onValueChange={(value) => handleSettingChange('analysisDepth', value[0])}
                      max={25}
                      min={5}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Shallow (Fast)</span>
                      <span>Deep (Accurate)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Language Settings */}
          <TabsContent value="language" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Language & Localization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Interface Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center space-x-2">
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 bg-muted rounded-lg text-sm">
                  <div className="font-medium mb-2">Supported Languages:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {LANGUAGES.map((lang) => (
                      <div key={lang.code} className="flex items-center space-x-1">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}