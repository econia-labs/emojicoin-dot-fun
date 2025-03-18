"use client";

import { getRandomSymbolEmoji } from "@sdk/emoji_data";
import React, { useMemo } from "react";
import { useWindowScroll, useWindowSize } from "react-use";
import { Emoji } from "utils/emoji";

const MemoizedRandomEmoji = React.memo(OneRandomEmoji);

function OneRandomEmoji({ emoji }: { emoji: string }) {
  const { mt, ml, rotate } = useMemo(
    () => ({
      mt: Math.random() * 100,
      ml: Math.random() * 100,
      rotate: Math.round(Math.random() * 50 - 25),
    }),
    []
  );
  return (
    <div
      className="flex flex-col w-min h-min text-8xl place-items-center select-none transition-all"
      style={{
        marginTop: `${mt}%`,
        marginLeft: `${ml}%`,
        transform: `rotate(${rotate}deg)`,
        filter: "blur(17px)",
        opacity: "0.4",
      }}
    >
      <Emoji emojis={emoji} />
    </div>
  );
}

const CHANCE = 1 / 8;
const maybeRandomEmoji = () => (Math.random() < CHANCE ? getRandomSymbolEmoji().emoji : undefined);

const PARALLAX_STRENGTH = 0.2;

export function BackgroundEmojis() {
  const { width, height } = useWindowSize();
  const { y: scrollY } = useWindowScroll();

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
          perspective: "20px",
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
