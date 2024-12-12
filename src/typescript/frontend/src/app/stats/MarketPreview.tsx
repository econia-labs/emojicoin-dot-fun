"use client";

import { parseTypeTag, TypeTagStruct } from "@aptos-labs/ts-sdk";
import { type DatabaseModels } from "@sdk/indexer-v2/types";
import {
  calculateCirculatingSupply,
  calculateCurvePrice,
  calculateRealReserves,
  toCoinTypes,
} from "@sdk/markets";
import { toNominalPrice, truncateAddress } from "@sdk/utils";
import AnimatedLoadingBoxes from "components/pages/launch-emojicoin/animated-loading-boxes";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "components/ui/carousel";
import { toDisplayCoinDecimals, toNominal } from "lib/utils/decimals";
import { version } from "os";
import { Suspense, useMemo } from "react";
import JsonView from "react-json-view";
import { LoadingSkeleton } from "./LoadingSkeleton";

const useRelevantData = (data: DatabaseModels["price_feed"]) => {
  const { market, state, transaction, inBondingCurve, deltaPercentage, dailyVolume, lastSwap } =
    data;

  const entryFunction = useMemo(() => {
    const value = data.transaction.entryFunction;
    if (value) {
      const tt = parseTypeTag(value).toString().split("::");
      const [moduleAddress, moduleName, functionName] = tt;
      return {
        moduleAddress,
        moduleName,
        functionName,
      };
    }
    return "called by a script, not an entry function";
  }, [data.transaction.entryFunction]);

  return {
    market: {
      emojis: market.symbolEmojis.join(", "),
      names: market.emojis.map((v) => v.name).join(", "),
      coinType: toCoinTypes(market.marketAddress).emojicoin.toString(),
      inBondingCurve,
      open: data.openPrice,
      close: data.closePrice,
      priceChangeLast24H: `${deltaPercentage >= 0 ? "+" : ""}${deltaPercentage.toFixed(4)}%`,
      dailyVolume: `${dailyVolume} APT`,
      instantaneousPrice: calculateCurvePrice(state).toFixed(10),
    },
    transaction: {
      version: transaction.version,
      timestamp: transaction.timestamp,
      sender: transaction.sender,
      entryFunction,
    },
    state: {
      circulatingSupply: toNominal(calculateCirculatingSupply(state)),
      reserves: {
        [market.symbolData.symbol]: toNominal(calculateRealReserves(state).base),
        APT: toNominal(calculateRealReserves(state).quote),
      },
    },
    lastSwap: {
      type: lastSwap.isSell ? "sell" : "buy",
      avgExecutionPrice: toNominalPrice(lastSwap.avgExecutionPriceQ64),
      volume: {
        [market.symbolData.symbol]: toNominal(lastSwap.baseVolume),
        APT: toNominal(lastSwap.quoteVolume),
      },
    },
    ...state,
  };
};

const MarketPreview = ({ market }: { market: DatabaseModels["price_feed"] }) => {
  const data = useRelevantData(market);

  return (
    <div className="flex flex-col m-auto justify-center">
      <div className="flex pixel-heading-3">{market.market.symbolData.symbol}</div>
      <div className="flex heading-1">{market.market.symbolData.name}</div>
      <div className="text-sm p-4">
        <JsonView
          style={{
            padding: "2ch",
          }}
          theme={"apathy"}
          displayDataTypes={false}
          src={data}
          name={market.market.symbolData.symbol}
        />
      </div>
    </div>
  );
};

export const MarketPreviewCarousel = ({ markets }: { markets: DatabaseModels["price_feed"][] }) => (
  <Carousel
    className="flex w-[100vw] min-w-[100vw] max-w-[100vw] select-none"
    opts={{
      align: "center",
    }}
  >
    <CarouselPrevious />
    <CarouselContent>
      {markets.slice(10).map((market) => (
        <CarouselItem key={`carousel-${market.market.symbolData.symbol}`}>
          <div className="w-fit flex flex-row text-white text-3xl m-auto justify-center align-middle items-center  hover:cursor-grab active:cursor-grabbing">
            <MarketPreview market={market} />
          </div>
        </CarouselItem>
      ))}
    </CarouselContent>
    <CarouselNext />
  </Carousel>
);

export const StatsCarousel = ({ elements }: { elements: Promise<React.JSX.Element>[] }) => {
  elements.map((p) => p.then((res) => console.log(res)));

  return (
    <Carousel>
      <CarouselContent>
        {elements.map((element, i) => (
          <CarouselItem key={`carousel-${i}`}>
            <LoadingSkeleton promised={element} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};
