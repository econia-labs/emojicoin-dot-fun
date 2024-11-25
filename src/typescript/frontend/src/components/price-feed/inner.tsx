"use client";

import type { fetchPriceFeed } from "@/queries/home";
import Link from "next/link";
import Carousel from "components/carousel";
import { Emoji } from "utils/emoji";
import { useLabelScrambler } from "components/pages/home/components/table-card/animation-variants/event-variants";
import { useMemo } from "react";
import { cn } from "lib/utils/class-name";

export const PriceDelta = ({ delta, className = "" }: { delta: number; className?: string }) => {
  const { prefix, suffix, text } = useMemo(
    () => ({
      prefix: delta >= 0 ? "+" : "-",
      suffix: "%",
      text: Math.abs(delta).toFixed(2),
    }),
    [delta]
  );
  const { ref } = useLabelScrambler(text, suffix, prefix);

  return (
    <span ref={ref} className={cn(`${delta >= 0 ? "text-green" : "text-pink"}`, className)}>
      {`${prefix} ${text}${suffix}`}
    </span>
  );
};

const Item = ({ emoji, delta }: { emoji: string; delta: number }) => {
  return (
    <Link
      href={`/market/${emoji}`}
      className={`font-pixelar whitespace-nowrap border-[1px] border-solid ${delta >= 0 ? "border-green" : "border-pink"} rounded-full px-3 py-[2px] select-none mr-[22px]`}
      draggable={false}
    >
      <Emoji className="text-xl mr-[9px]" emojis={emoji} />
      <PriceDelta className="text-2xl" delta={delta} />
    </Link>
  );
};

export const PriceFeedInner = ({ data }: { data: Awaited<ReturnType<typeof fetchPriceFeed>> }) => {
  return (
    <div className="w-full z-[10] relative">
      <Carousel>
        {data!.map((itemData, i) => (
          <Item
            key={`item::${i}`}
            emoji={itemData.symbolEmojis.join("")}
            delta={itemData.deltaPercentage}
          />
        ))}
      </Carousel>
    </div>
  );
};
