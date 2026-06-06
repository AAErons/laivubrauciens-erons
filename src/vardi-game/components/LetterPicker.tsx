import { motion } from 'framer-motion';

type LetterPickerProps = {
  availableLetters: string[];
  selected: string[];
  maxLetters: number;
  onToggle: (letter: string) => void;
  onConfirm: () => void;
};

export function LetterPicker({
  availableLetters,
  selected,
  maxLetters,
  onToggle,
  onConfirm,
}: LetterPickerProps) {
  const remaining = maxLetters - selected.length;
  const canConfirm = selected.length === maxLetters;

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5 sm:p-7">
      <h2 className="text-lg font-semibold text-white sm:text-xl">Izvēlies {maxLetters} burtus</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-300">
        Šī izvēle ir vienreizēja. Izvēlētie burti tiks atklāti visos vārdos, kuros tie parādās.
        Atlikušos burtus vajadzēs uzminēt pašam.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {availableLetters.map((letter) => {
          const isSelected = selected.includes(letter);
          const isDisabled = !isSelected && remaining <= 0;
          return (
            <motion.button
              key={letter}
              type="button"
              whileTap={{ scale: 0.9 }}
              disabled={isDisabled}
              onClick={() => onToggle(letter)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border text-base font-semibold uppercase transition ${
                isSelected
                  ? 'border-sky-400/70 bg-sky-400/20 text-sky-50 shadow-[0_0_14px_rgba(56,189,248,0.35)]'
                  : isDisabled
                    ? 'cursor-not-allowed border-white/5 bg-slate-900/40 text-slate-600'
                    : 'border-white/15 bg-slate-900/60 text-slate-100 hover:border-sky-400/50 hover:text-white'
              }`}
            >
              {letter}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">
          {canConfirm
            ? 'Gatavs! Vari apstiprināt izvēli.'
            : `Vēl jāizvēlas ${remaining} ${remaining === 1 ? 'burts' : 'burti'}.`}
        </p>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={onConfirm}
          className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
            canConfirm
              ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
              : 'cursor-not-allowed bg-slate-800 text-slate-500'
          }`}
        >
          Apstiprināt burtus
        </button>
      </div>
    </div>
  );
}
