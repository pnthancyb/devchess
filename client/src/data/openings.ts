import type { ChessOpening } from "@/types/chess";

export const OPENINGS: ChessOpening[] = [
  {
    id: "kings-gambit",
    name: "King's Gambit",
    moves: ["e4", "e5", "f4"],
    description: "An aggressive, romantic opening that sacrifices the f-pawn for rapid development and attacking chances. One of the oldest chess openings, favored by masters like Paul Morphy and Adolf Anderssen.",
  },
  {
    id: "latvian-gambit",
    name: "Latvian Gambit",
    moves: ["e4", "e5", "Nf3", "f5"],
    description: "A sharp, double-edged gambit where Black immediately counterattacks in the center. This opening leads to complex, tactical positions and requires precise play from both sides.",
  },
  {
    id: "dragon-squirrel",
    name: "Dragon Squirrel",
    moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6", "Be3", "Bg7", "f3", "Nc6", "Qd2", "O-O", "O-O-O", "Bd7", "h4", "h5"],
    description: "A hypermodern variation of the Sicilian Dragon where Black plays h5 early to prevent White's kingside pawn storm. Named for its squirrel-like defensive posture.",
  },
  {
    id: "blackmar-diemer-gambit",
    name: "Blackmar-Diemer Gambit",
    moves: ["d4", "d5", "e4", "dxe4", "Nc3", "Nf6", "f3"],
    description: "A sharp gambit where White sacrifices a pawn for rapid development and attacking chances. Popular among club players for its exciting tactical possibilities and quick development.",
  },
  {
    id: "birds-opening",
    name: "Bird's Opening",
    moves: ["f4"],
    description: "An unconventional first move that controls the e5 square and prepares kingside development. Named after Henry Bird, this opening can transpose into various systems depending on Black's response.",
  },
];

export function getOpeningMoves(opening: ChessOpening, moveIndex: number): { nextMove: string | null; isComplete: boolean } {
  if (moveIndex >= opening.moves.length) {
    return { nextMove: null, isComplete: true };
  }
  
  return {
    nextMove: opening.moves[moveIndex],
    isComplete: false,
  };
}

export function validateOpeningMove(opening: ChessOpening, moveIndex: number, playerMove: string): boolean {
  if (moveIndex >= opening.moves.length) {
    return false;
  }
  
  return opening.moves[moveIndex] === playerMove;
}