"use client";

import { type DatabaseModels } from "@sdk/indexer-v2/types";
import { ClientTable } from "./ClientTable";
import React, { useRef, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "components/ui/Select";
import { GlobalStats } from "./GlobalStats";
import { useInView } from "framer-motion";
import { useDebounce } from "react-use";
import { type Types } from "@sdk-types";

export interface StatsPageProps {
  numMarkets: number;
  priceFeedData: DatabaseModels["price_feed"][];
  dailyVolumeData: DatabaseModels["market_state"][];
  marketCapData: DatabaseModels["market_state"][];
  allTimeVolumeData: DatabaseModels["market_state"][];
  latestPricesData: DatabaseModels["market_state"][];
  tvlData: DatabaseModels["market_state"][];
  registryResource: Types["RegistryView"];
}

const MARKETS_PER_SCROLL = 100;

export default function StatsPageComponent(props: StatsPageProps) {
  const [tab, setTab] = useState<"global-stats" | "per-market-stats">("global-stats");
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [numElements, setNumElements] = useState(MARKETS_PER_SCROLL);

  useDebounce(
    () => {
      if (inView) {
        setNumElements((n) => n + MARKETS_PER_SCROLL);
      }
    },
    20,
    [inView, tab]
  );

  return (
    <>
      <div ref={rootRef} className="flex flex-col mb-[31px] w-full text-white">
        <div className="flex w-fit text-white m-auto font-forma-bold mb-4">
          <Select onValueChange={(v: string) => setTab(v as "global-stats" | "per-market-stats")}>
            <SelectTrigger className="">
              <SelectValue defaultValue={tab} placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                className="text-white font-forma-bold hover:bg-light-gray"
                value="global-stats"
              >
                Global stats
              </SelectItem>
              <SelectItem
                className="text-white font-forma-bold hover:bg-light-gray"
                value="per-market-stats"
              >
                Per market stats
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        {tab === "global-stats" ? (
          <>
            <GlobalStats {...props} />
          </>
        ) : (
          <>
            <div className="flex flex-col overflow-scroll max-h-[70vh] max-w-[90vw] m-auto">
              <ClientTable
                price={props.latestPricesData.slice(0, numElements)}
                allTimeVolume={props.allTimeVolumeData.slice(0, numElements)}
                priceDelta={props.priceFeedData.slice(0, numElements)}
                dailyVolume={props.dailyVolumeData.slice(0, numElements)}
                lastAvgExecutionPrice={props.latestPricesData.slice(0, numElements)}
                tvl={props.tvlData.slice(0, numElements)}
                marketCap={props.marketCapData.slice(0, numElements)}
              />
              <div className="opacity-0 max-h-[1px]" ref={ref}>
                {"."}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
