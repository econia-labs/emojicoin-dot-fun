"use client";

import useNodeDimensions from "@hooks/use-node-dimensions";
import { getRandomSymbolEmoji } from "@sdk/emoji_data";
import { useEffect, useMemo, useRef, useState } from "react";
import { Emoji } from "utils/emoji";

function OneRandomEmoji({ emoji }: { emoji: string | undefined }) {
  const mt = useMemo(() => Math.random() * 100, []);
  const ml = useMemo(() => Math.random() * 100, []);
  const rotate = useMemo(() => Math.round(Math.random() * 50 - 25), []);
  const [blur, setBlur] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mouseenter = (e: MouseEvent) => {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      if (elements.find((e) => e === ref.current)) {
        setBlur(false);
      }
    };
    const mouseleave = (e: MouseEvent) => {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      if (!elements.find((e) => e === ref.current)) {
        setBlur(true);
      }
    };

    if (emoji) {
      window.addEventListener("mousemove", mouseenter, { passive: true, capture: true });
      window.addEventListener("mousemove", mouseleave, { passive: true, capture: true });

      return () => {
        window.removeEventListener("mousemove", mouseenter);
        window.removeEventListener("mousemove", mouseleave);
      };
    }
  }, [emoji]);
  if (!emoji) return <div></div>;
  return (
    <div
      ref={ref}
      className="flex flex-col w-min h-min text-8xl grid place-items-center select-none transition-all"
      style={{
        marginTop: `${mt}%`,
        marginLeft: `${ml}%`,
        transform: `rotate(${rotate}deg)`,
        filter: blur ? "blur(15px)" : "",
        opacity: blur ? "0.6" : "1",
      }}
    >
      <Emoji emojis={emoji} />
    </div>
  );
}

export function RandomEmojiBg() {
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

  const [mt, setMt] = useState<number>(0);

  useEffect(() => {
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
        {rows.map((row, i) => (
          <OneRandomEmoji key={`random-emoji-bg-${i}`} emoji={row?.emoji} />
        ))}
      </div>
    </div>
  );
}
