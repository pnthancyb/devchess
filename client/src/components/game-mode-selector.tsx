import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, MessageSquare, BarChart3, BookOpen } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { GameMode } from "@/hooks/use-chess-game";

interface GameModeSelectorProps {
  selectedMode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

const modes = [
  {
    id: "classic" as const,
    icon: CheckCircle,
    titleKey: "classic.vs",
  },
  {
    id: "feedback" as const,
    icon: MessageSquare,
    titleKey: "feedback",
  },
  {
    id: "scoring" as const,
    icon: BarChart3,
    titleKey: "scoring",
  },
  {
    id: "coach" as const,
    icon: BookOpen,
    titleKey: "coach.mode",
  },
];

export function GameModeSelector({ selectedMode, onModeChange }: GameModeSelectorProps) {
  const { t } = useI18n();

  return (
    <Card className="mb-6 shadow-md">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold mb-6 text-center text-primary">{t("game.mode")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isActive = selectedMode === mode.id;
            
            return (
              <Button
                key={mode.id}
                variant={isActive ? "default" : "outline"}
                className={`p-6 h-auto flex-col space-y-3 min-h-[100px] transition-all duration-200 ${
                  isActive 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105" 
                    : "hover:border-primary hover:text-primary hover:shadow-md hover:scale-102"
                } group`}
                onClick={() => onModeChange(mode.id)}
              >
                <Icon className={`w-8 h-8 transition-transform duration-200 ${
                  isActive ? "" : "group-hover:scale-110"
                }`} />
                <span className="font-semibold text-sm text-center leading-tight">
                  {t(mode.titleKey)}
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
