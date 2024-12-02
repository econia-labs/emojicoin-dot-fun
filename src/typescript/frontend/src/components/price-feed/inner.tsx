"use client";

import Link from "next/link";
import Carousel from "components/carousel";
import { Emoji } from "utils/emoji";
import { useMemo } from "react";
import { cn } from "lib/utils/class-name";
import useEffectOnce from "react-use/lib/useEffectOnce";
import { useEventStore } from "context/event-store-context/hooks";
import { type DatabaseModels } from "@sdk/indexer-v2/types";
import { FormattedNumber } from "components/FormattedNumber";

export const PriceDelta = ({ delta, className = "" }: { delta: number; className?: string }) => {
  const { prefix, suffix } = useMemo(
    () => ({
      prefix: delta >= 0 ? "+" : "-",
      suffix: "%",
    }),
    [delta]
  );

  return (
    <span className={cn(`${delta >= 0 ? "text-green" : "text-pink"}`, className)}>
      <FormattedNumber suffix={suffix} prefix={prefix} scramble>
        {Math.abs(delta)}
      </FormattedNumber>
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
