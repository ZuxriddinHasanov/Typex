import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProgressState {
  unlockedLevels: number[];
  levelScores: Record<number, { stars: number; wpm: number; acc: number }>;
  completeLevel: (levelId: number, stars: number, wpm: number, acc: number) => void;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      unlockedLevels: [1],
      levelScores: {},
      completeLevel: (levelId, stars, wpm, acc) =>
        set((state) => {
          const currentScore = state.levelScores[levelId];
          const newStars = currentScore && currentScore.stars > stars ? currentScore.stars : stars;
          
          return {
            unlockedLevels: Array.from(new Set([...state.unlockedLevels, levelId, levelId + 1])).sort((a, b) => a - b),
            levelScores: {
              ...state.levelScores,
              [levelId]: { stars: newStars, wpm, acc },
            },
          };
        }),
      resetProgress: () => set({ unlockedLevels: [1], levelScores: {} }),
    }),
    {
      name: "typeuz-club-progress",
    }
  )
);
