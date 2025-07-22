import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { ChessOpening } from "@/types/chess";
import { OPENINGS } from "@/data/openings";

interface OpeningSelectorProps {
  onSelectOpening: (opening: ChessOpening) => void;
  selectedOpening: ChessOpening | null;
}

export function OpeningSelector({ onSelectOpening, selectedOpening }: OpeningSelectorProps) {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <BookOpen className="w-6 h-6 mr-2 text-chess-gold" />
          Select Opening to Learn
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {OPENINGS.map((opening) => (
            <div
              key={opening.id}
              className={`border rounded-lg p-4 transition-all duration-200 cursor-pointer hover:shadow-md ${
                selectedOpening?.id === opening.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => onSelectOpening(opening)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg text-foreground">{opening.name}</h3>
                <Badge variant="outline" className="text-xs">
                  {opening.moves.length} moves
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                {opening.description}
              </p>
              
              <div className="text-xs text-muted-foreground mb-3">
                <strong>Opening moves:</strong> {opening.moves.slice(0, 4).join(", ")}
                {opening.moves.length > 4 && "..."}
              </div>
              
              <Button
                variant={selectedOpening?.id === opening.id ? "default" : "outline"}
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectOpening(opening);
                }}
              >
                Start Learning
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}