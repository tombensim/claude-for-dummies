export const PHASES: readonly { phase: number; steps: number[]; key: string }[] = [
  { phase: 0, steps: [1, 2], key: "phase0" },
  { phase: 1, steps: [3, 4], key: "phase1" },
  { phase: 2, steps: [5, 6], key: "phase2" },
  { phase: 3, steps: [7, 8, 9], key: "phase3" },
];

export const TOTAL_STEPS = 9;

export function getPhaseForStep(step: number): number {
  if (step <= 2) return 0;
  if (step <= 4) return 1;
  if (step <= 6) return 2;
  return 3;
}
