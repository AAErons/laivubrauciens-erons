export type GameProgress = {
  selectedLetters: string[];
  lettersLocked: boolean;
  completedNames: string[];
  currentInputs: Record<string, Record<string, string>>;
  /** Per-user fixed random display order, as a permutation of name indices. */
  nameOrder: number[];
  /** ISO timestamp set once every name has been guessed; null until then. */
  completedAt: string | null;
};

export type NameCell = {
  /** Position of this character within the original name string. */
  index: number;
  /** The actual character at this position. */
  char: string;
  /** Whether this cell is a guessable letter (false for spaces, dots, etc.). */
  isLetter: boolean;
};
