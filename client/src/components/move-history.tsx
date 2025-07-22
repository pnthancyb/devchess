import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { Move } from "@shared/schema";

interface MoveHistoryProps {
  moves: Move[];
  onMoveSelect?: (moveIndex: number) => void;
  selectedMove?: number;
}

export function MoveHistory({ moves, onMoveSelect, selectedMove }: MoveHistoryProps) {
  const { t } = useI18n();

  // Group moves by pairs (White and Black)
  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Clock className="w-5 h-5 mr-2" />
          {t("move.history")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {/* Header */}
          <div className="grid grid-cols-3 gap-2 text-sm font-medium text-muted-foreground pb-2 border-b">
            <div className="text-center">{t("move")}</div>
            <div className="text-center">{t("white")}</div>
            <div className="text-center">{t("black")}</div>
          </div>

          {/* Move list */}
          <div className="space-y-1">
            {movePairs.map((pair, pairIndex) => (
              <div key={pairIndex} className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center text-muted-foreground py-1">
                  {pair.moveNumber}.
                </div>
                <div
                  className={`text-center py-1 rounded cursor-pointer transition-colors font-mono ${
                    selectedMove === pairIndex * 2
                      ? "move-history-active"
                      : "move-history-item"
                  }`}
                  onClick={() => onMoveSelect?.(pairIndex * 2)}
                >
                  {pair.white?.san || ""}
                </div>
                <div
                  className={`text-center py-1 rounded cursor-pointer transition-colors font-mono ${
                    selectedMove === pairIndex * 2 + 1
                      ? "move-history-active"
                      : "move-history-item"
                  }`}
                  onClick={() => onMoveSelect?.(pairIndex * 2 + 1)}
                >
                  {pair.black?.san || "..."}
                </div>
              </div>
            ))}
          </div>

          {moves.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No moves yet. Make your first move!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
