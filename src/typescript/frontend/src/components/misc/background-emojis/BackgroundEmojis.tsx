"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useWindowSize } from "react-use";
import { Emoji } from "utils/emoji";

import { getRandomSymbolEmoji } from "@/sdk/emoji_data";

const MemoizedRandomEmoji = React.memo(OneRandomEmoji);

function OneRandomEmoji({ emoji }: { emoji: string }) {
  const style = useMemo(
    () => ({
      marginTop: Math.random() * 100,
      marginLeft: Math.random() * 100,
      transform: `rotate(${Math.round(Math.random() * 50 - 25)}deg)`,
      filter: "blur(9px)",
      opacity: 0.2,
    }),
    []
  );
  return (
    <div
      className="flex flex-col w-min h-min text-8xl place-items-center select-none transition-all"
      style={style}
    >
      <Emoji emojis={emoji} />
    </div>
  );
}

const CHANCE = 1 / 8;
const maybeRandomEmoji = () => (Math.random() < CHANCE ? getRandomSymbolEmoji().emoji : undefined);
const PARALLAX_STRENGTH = 0.15;

export function BackgroundEmojis() {
  const { width, height } = useWindowSize();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = (e: Event) => setScrollY((e.target as HTMLElement).scrollTop);

    // The page doesn't actually scroll on the `window`, it scrolls inside the content-wrapper.
    const doc = document.getElementById("content-wrapper");

    doc?.addEventListener("scroll", handleScroll);
    return () => doc?.removeEventListener("scroll", handleScroll);
  }, []);

  const { rows, cols, emojis } = useMemo(() => {
    // 1x the width, 3x the height, based on the element dimensions. (h-300% w-100%)
    const rows = Math.ceil((height * 3) / 150);
    const cols = Math.ceil(width / 150);
    const emojis = Array.from({ length: rows * cols }).map(maybeRandomEmoji);
    return {
      rows,
      cols,
      emojis,
    };
  }, [width, height]);

  return (
    <div className="z-[-1] absolute top-0 left-0 h-[100%] w-[100vw] overflow-hidden">
      <div
        className="absolute top-0 left-0 h-[300%] w-[100%] grid will-change-transform"
        style={{
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          perspective: "1000px",
          translate: `0 ${scrollY * -PARALLAX_STRENGTH}px`,
        }}
      >
        {emojis.map((emoji, i) =>
          emoji ? (
            <MemoizedRandomEmoji key={`random-emoji-bg-${i}`} emoji={emoji} />
          ) : (
            <div key={`random-emoji-bg-${i}`} />
          )
        )}
      </div>
    </div>
  );
}
