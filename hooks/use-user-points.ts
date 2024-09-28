import { create } from "zustand";

type PointsStore = {
    points: number;
    setPoints: (newPoints: number) => void;
};

export const useUserPoints = create<PointsStore>((set) => ({
    points: 0,
    setPoints: (newPoints: number) => set({ points: newPoints }),
}));