"use client";

import dynamic from "next/dynamic";

const ProgressBanner = dynamic(() => import("../components/progress-banner"), { ssr: false });
const HabitsBoard = dynamic(() => import("../components/habits-board"), { ssr: false });

export default function Home() {
  return (
    <main className="flex flex-col justify-center items-center">
        <ProgressBanner />
        <HabitsBoard />
    </main>
  );
}
