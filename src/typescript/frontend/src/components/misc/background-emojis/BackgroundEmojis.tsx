"use client";

import useNodeDimensions from "@hooks/use-node-dimensions";
import { getRandomSymbolEmoji } from "@sdk/emoji_data";
import { useEffect, useMemo, useRef, useState } from "react";
import { Emoji } from "utils/emoji";

function OneRandomEmoji({ emoji }: { emoji: string }) {
  const mt = useMemo(() => Math.random() * 100, []);
  const ml = useMemo(() => Math.random() * 100, []);
  const rotate = useMemo(() => Math.round(Math.random() * 50 - 25), []);
  return (
    <div
      className="flex flex-col w-min h-min text-8xl place-items-center select-none transition-all"
      style={{
        marginTop: `${mt}%`,
        marginLeft: `${ml}%`,
        transform: `rotate(${rotate}deg)`,
        filter: "blur(15px)",
        opacity: "0.6",
      }}
    >
      <Emoji emojis={emoji} />
    </div>
  );
}

export function BackgroundEmojis() {
  const ref = useRef<HTMLDivElement>(null);
  const { height, width } = useNodeDimensions(ref);
  const nRows = useMemo(() => Math.ceil(height / 150), [height]);
  const nCols = useMemo(() => Math.ceil(width / 150), [width]);
  const rows = useMemo(
    () =>
      Array.from({ length: nCols * nRows }).map(() =>
        Math.random() < 1 / 8 ? getRandomSymbolEmoji() : undefined
      ),
    [nRows, nCols]
  );

  // The margin top value for the parallax effect- used on the overall background.
  const [mt, setMt] = useState<number>(0);

  useEffect(() => {
    // The function that creates the parallax effect.
    const fn = (e: Event) => {
      setMt(((e.target as HTMLElement | null)?.scrollTop ?? 0) * -0.4);
    };

    document.addEventListener("scroll", fn, { passive: true, capture: true });

    return () => document.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="z-[-1] absolute top-0 left-0 h-[100%] w-[100vw] overflow-hidden">
      <div
        ref={ref}
        className="absolute top-0 left-0 h-[300%] w-[100%] grid"
        style={{
          gridTemplateRows: `repeat(${nRows}, 1fr)`,
          gridTemplateColumns: `repeat(${nCols}, 1fr)`,
          perspective: "20px",
          top: mt,
        }}
      >
        {rows.map((row, i) =>
          row ? (
            <OneRandomEmoji key={`random-emoji-bg-${i}`} emoji={row.emoji} />
          ) : (
            <div key={`random-emoji-bg-${i}`} />
          )
        )}
      </div>
    </div>
  );
}
