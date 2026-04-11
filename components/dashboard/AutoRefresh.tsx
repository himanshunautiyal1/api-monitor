"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AutoRefresh() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const counter = setInterval(() => {
      setSeconds((prev) => {
        if (prev >= 30) {
          router.refresh();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(counter);
  }, [router]);

  return (
    <div className="flex items-center gap-2 text-gray-500 text-xs">
      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      <span>
        {seconds === 0 ? "Refreshing..." : `Refreshes in ${30 - seconds}s`}
      </span>
    </div>
  );
}
