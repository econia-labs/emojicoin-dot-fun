"use client";

import useNodeDimensions from "@hooks/use-node-dimensions";
import { getRandomChatEmoji } from "@sdk/emoji_data";
import { useRef } from "react";

export function RandomEmojiBg() {
  const ref = useRef<HTMLDivElement>(null);
  const { height, width } = useNodeDimensions(ref);
  const nRows = Math.ceil(height / 100);
  const nCols = Math.ceil(width / 100);
  const rows = Array.from({ length: nCols * nRows }).map(() => getRandomChatEmoji());

  return (
    <div
      ref={ref}
      className="z-[-1] absolute top-0 left-0 h-[100%] w-[100%] grid"
      style={{
        gridTemplateRows: `repeat(${nRows}, 1fr)`,
        gridTemplateColumns: `repeat(${nCols}, 1fr)`,
        perspective: "20px",
      }}
    >
      {rows.map((row, i) => {
        if (Math.random() > 1 / 20) return <div key={`random-emoji-bg-${i}`}></div>;
        return (
          <div
            className="flex flex-col w-min h-min text-7xl grid place-items-center blur-md hover:blur-none"
            style={{
              marginTop: `${Math.random() * 100}%`,
              marginLeft: `${Math.random() * 100}%`,
              transform: `rotate(${Math.round((Math.random() * 50) / 2)}deg)`,
            }}
            key={`random-emoji-bg-${i}`}
          >
            {row.emoji}
          </div>
        );
      })}
    </div>
  );
}
