"use client";

import ProgressBanner from "../components/progress-banner";
import HabitsBoard from "../components/habits-board";

export default function Home() {
  return (
    <main className="flex flex-col justify-center items-center">
        <ProgressBanner />
        <HabitsBoard />
    </main>
  );
}
