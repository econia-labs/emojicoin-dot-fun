"use client";

import Carousel from "components/carousel";
import { FormattedNumber } from "components/FormattedNumber";
import { PriceColors } from "components/misc/ColoredPriceDisplay";
import { useEventStore } from "context/event-store-context/hooks";
import { cn } from "lib/utils/class-name";
import Link from "next/link";
import { useMemo } from "react";
import useEffectOnce from "react-use/lib/useEffectOnce";
import { Emoji } from "utils/emoji";

import type { DatabaseModels } from "@/sdk/indexer-v2/types";

export const PriceDelta = ({ delta, className = "" }: { delta: number; className?: string }) => {
  const { prefix, suffix } = useMemo(
    () => ({
      prefix: delta === 0 ? "" : delta > 0 ? "+" : "-",
      suffix: "%",
    }),
    [delta]
  );

  const { color } =
    delta === 0 ? PriceColors["neutral"] : delta >= 0 ? PriceColors["buy"] : PriceColors["sell"];

  return (
    <span className={cn(color, className)}>
      <FormattedNumber value={Math.abs(delta)} suffix={suffix} prefix={prefix} scramble />
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

export const PriceFeedInner = ({ data }: { data: DatabaseModels["price_feed"][] }) => {
  // Load the price feed market data into the event store.
  const loadEventsFromServer = useEventStore((s) => s.loadEventsFromServer);

  useEffectOnce(() => {
    loadEventsFromServer(data);
  });

  return (
    <div className="w-full z-[10] relative">
      <Carousel>
        {data!.map((itemData, i) => (
          <Item
            key={`item::${i}`}
            emoji={itemData.market.symbolEmojis.join("")}
            delta={itemData.deltaPercentage}
          />
        ))}
      </Carousel>
    </div>
  );
};
