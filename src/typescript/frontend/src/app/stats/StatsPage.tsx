"use client";

import { type DatabaseModels } from "@sdk/indexer-v2/types";
import { ClientTable } from "./ClientTable";
import { useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "components/ui/Select";

export interface StatsPageProps {
  numMarkets: number;
  priceFeedData: DatabaseModels["price_feed"][];
  dailyVolumeData: DatabaseModels["market_state"][];
  marketCapData: DatabaseModels["market_state"][];
  allTimeVolumeData: DatabaseModels["market_state"][];
  latestPricesData: DatabaseModels["market_state"][];
  tvlData: DatabaseModels["market_state"][];
}

export default function StatsPageComponent(props: StatsPageProps) {
  const [tab, setTab] = useState<"global-stats" | "per-market-stats">("per-market-stats");

  return (
    <>
      <div className="flex flex-col mb-[31px] w-full text-white">
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
          <></>
        ) : (
          <ClientTable
            price={props.latestPricesData}
            allTimeVolume={props.allTimeVolumeData}
            priceDelta={props.priceFeedData}
            dailyVolume={props.dailyVolumeData}
            lastAvgExecutionPrice={props.latestPricesData}
            tvl={props.tvlData}
            marketCap={props.marketCapData}
          />
        )}
      </div>
    </>
  );
}
