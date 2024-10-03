"use client";

import type { fetchPriceFeed } from "@/queries/home";
import Link from "next/link";
import Carousel from "components/carousel";

const Item = ({ emoji, change }: { emoji: string; change: number }) => {
  return (
    <Link
      href={`/market/${emoji}`}
      className={`font-pixelar whitespace-nowrap border-[1px] border-solid ${change >= 0 ? "border-green" : "border-pink"} rounded-full px-3 py-[2px] select-none mr-[22px]`}
      draggable={false}
    >
      <span className="text-xl mr-[9px]">{emoji}:</span>
      <span className={`text-2xl ${change >= 0 ? "text-green" : "text-pink"}`}>
        {change >= 0 ? "+" : "-"} {Math.abs(change).toFixed(2)}%
      </span>
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
            change={itemData.deltaPercentage}
          />
        ))}
      </Carousel>
    </div>
  );
};
