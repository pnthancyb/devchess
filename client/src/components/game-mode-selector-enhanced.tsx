import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, MessageSquare, BookOpen, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { GameMode } from "@/types/chess";

interface GameModeSelectorEnhancedProps {
  selectedMode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

const GAME_MODES = [
  {
    id: "classic" as const,
    name: "Classic + Analysis",
    description: "Chess with AI feedback and move scoring",
    icon: Crown,
    color: "from-blue-500 to-purple-600",
    textColor: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    features: ["Real-time analysis", "Move scoring", "Position feedback"]
  },
  {
    id: "coach" as const,
    name: "AI Coach",
    description: "Interactive coaching with chat support",
    icon: MessageSquare,
    color: "from-green-500 to-teal-600",
    textColor: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-200 dark:border-green-800",
    features: ["Live coaching", "Strategic advice", "Chat support"]
  },
  {
    id: "opening" as const,
    name: "Opening Learning",
    description: "Learn chess openings with AI guidance",
    icon: BookOpen,
    color: "from-orange-500 to-red-600",
    textColor: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    features: ["Opening practice", "Move validation", "Progress tracking"]
  }
];

export function GameModeSelectorEnhanced({ selectedMode, onModeChange }: GameModeSelectorEnhancedProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {GAME_MODES.map((mode) => {
        const Icon = mode.icon;
        const isSelected = selectedMode === mode.id;
        
        return (
          <Card
            key={mode.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              isSelected 
                ? `${mode.borderColor} border-2 ${mode.bgColor}` 
                : "border hover:border-primary/50"
            }`}
            onClick={() => onModeChange(mode.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${mode.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-semibold ${isSelected ? mode.textColor : "text-foreground"}`}>
                      {mode.name}
                    </h3>
                    {isSelected && (
                      <Badge className={mode.textColor.replace("text-", "bg-").replace("dark:text-", "dark:bg-")}>
                        Active
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {mode.description}
                  </p>
                  
                  <div className="space-y-1">
                    {mode.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-xs text-muted-foreground">
                        <Zap className="w-3 h-3 mr-1 text-primary" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}