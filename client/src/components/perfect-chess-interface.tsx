import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Target, 
  Brain, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Clock,
  Trophy,
  TrendingUp,
  Zap,
  Eye,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerfectChessInterfaceProps {
  gameMode: string;
  difficulty: number;
  onModeChange: (mode: string) => void;
  onDifficultyChange: (difficulty: number) => void;
  children: React.ReactNode;
}

export function PerfectChessInterface({ 
  gameMode, 
  difficulty, 
  onModeChange, 
  onDifficultyChange,
  children 
}: PerfectChessInterfaceProps) {
  const [activeTab, setActiveTab] = useState('game');
  const [animatedDifficulty, setAnimatedDifficulty] = useState(difficulty);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedDifficulty(difficulty), 100);
    return () => clearTimeout(timer);
  }, [difficulty]);

  const gameModes = [
    {
      id: 'classic',
      name: 'Classic',
      icon: Crown,
      description: 'Traditional chess with AI opponent',
      color: 'from-amber-400 to-orange-500',
      textColor: 'text-amber-600'
    },
    {
      id: 'feedback',
      name: 'Feedback',
      icon: Eye,
      description: 'Get AI analysis for every move',
      color: 'from-blue-400 to-cyan-500',
      textColor: 'text-blue-600'
    },
    {
      id: 'scoring',
      name: 'Scoring',
      icon: BarChart3,
      description: 'Numerical evaluation of moves',
      color: 'from-green-400 to-emerald-500',
      textColor: 'text-green-600'
    },
    {
      id: 'coach',
      name: 'Coach',
      icon: MessageSquare,
      description: 'Interactive AI chess coaching',
      color: 'from-purple-400 to-pink-500',
      textColor: 'text-purple-600'
    }
  ];

  const difficultyLevels = [
    { level: 1, name: 'Beginner', elo: '1200-1400', color: 'bg-gray-500' },
    { level: 2, name: 'Intermediate', elo: '1400-1600', color: 'bg-green-500' },
    { level: 3, name: 'Advanced', elo: '1600-1800', color: 'bg-blue-500' },
    { level: 4, name: 'Expert', elo: '1800-2100', color: 'bg-purple-500' },
    { level: 5, name: 'Master', elo: '2100+', color: 'bg-red-500' }
  ];

  const currentMode = gameModes.find(mode => mode.id === gameMode) || gameModes[0];
  const currentDifficultyInfo = difficultyLevels.find(d => d.level === difficulty) || difficultyLevels[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Chess AI Coach
                </span>
              </div>
              <Badge variant="outline" className="hidden sm:flex">
                v2.0
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Mode Indicator */}
              <div className="hidden md:flex items-center space-x-2">
                <currentMode.icon className={cn("w-4 h-4", currentMode.textColor)} />
                <span className="font-medium">{currentMode.name}</span>
              </div>
              
              {/* Difficulty Indicator */}
              <div className="flex items-center space-x-2">
                <div className={cn("w-3 h-3 rounded-full", currentDifficultyInfo.color)} />
                <span className="font-medium text-sm">
                  {currentDifficultyInfo.name}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {currentDifficultyInfo.elo}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="game" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Game</span>
            </TabsTrigger>
            <TabsTrigger value="modes" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Modes</span>
            </TabsTrigger>
            <TabsTrigger value="difficulty" className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Difficulty</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="game" className="space-y-6">
            {/* Game Interface */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Main Game Area */}
              <div className="xl:col-span-3">
                <Card className="overflow-hidden shadow-2xl border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                  <CardContent className="p-0">
                    {children}
                  </CardContent>
                </Card>
              </div>
              
              {/* Sidebar */}
              <div className="space-y-4">
                {/* Current Mode Card */}
                <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <currentMode.icon className={cn("w-5 h-5", currentMode.textColor)} />
                      <span>{currentMode.name} Mode</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {currentMode.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Difficulty</span>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={animatedDifficulty * 20} 
                          className="w-16 h-2"
                        />
                        <span className="text-sm font-bold">
                          {difficulty}/5
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('modes')}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Change Mode
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('difficulty')}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Adjust Difficulty
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('stats')}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Statistics
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="modes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {gameModes.map((mode) => (
                <Card
                  key={mode.id}
                  className={cn(
                    "cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-0",
                    gameMode === mode.id 
                      ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/30" 
                      : "bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm"
                  )}
                  onClick={() => onModeChange(mode.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className={cn(
                      "w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br flex items-center justify-center",
                      mode.color
                    )}>
                      <mode.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{mode.name}</h3>
                    <p className="text-sm text-muted-foreground">{mode.description}</p>
                    {gameMode === mode.id && (
                      <Badge className="mt-3" variant="default">
                        Active
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="difficulty" className="space-y-6">
            <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>AI Difficulty Level</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {difficultyLevels.map((level) => (
                    <div
                      key={level.level}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all",
                        difficulty === level.level
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                          : "border-border hover:border-blue-300"
                      )}
                      onClick={() => onDifficultyChange(level.level)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={cn("w-4 h-4 rounded-full", level.color)} />
                        <div>
                          <div className="font-medium">{level.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ELO: {level.elo}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={level.level * 20} className="w-16 h-2" />
                        <span className="text-sm font-medium w-8">
                          {level.level}/5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground">Games Won</div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <Target className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground">Games Played</div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">1200</div>
                  <div className="text-sm text-muted-foreground">Current ELO</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default PerfectChessInterface;