import React, { useEffect, useState } from "react";

import { translationFunction } from "context/language-context";
import { toCoinDecimalString } from "lib/utils/decimals";
import AptosIconBlack from "components/svg/icons/AptosBlack";
import { type MainInfoProps } from "../../types";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";
import { useEventStore } from "context/event-store-context";
import { useLabelScrambler } from "components/pages/home/components/table-card/animation-variants/event-variants";
import { isMarketStateModel } from "@sdk/indexer-v2/types";
import { Emoji } from "utils/emoji";

const innerWrapper = `flex flex-col md:flex-row justify-around w-full max-w-[1362px] px-[30px] lg:px-[44px] py-[17px]
md:py-[37px] xl:py-[68px]`;
const headerWrapper =
  "flex flex-row md:flex-col md:justify-between gap-[12px] md:gap-[4px] w-full md:w-[58%] xl:w-[65%] mb-[8px]";
const statsWrapper = "flex flex-col w-full md:w-[42%] xl:w-[35%] mt-[-8px]";
const statsTextClasses = "display-6 md:display-4 uppercase ellipses font-forma";

const MainInfo = ({ data }: MainInfoProps) => {
  const { t } = translationFunction();

  const marketEmojis = data.symbolEmojis;
  const stateEvents = useEventStore((s) => s.getMarket(marketEmojis)?.stateEvents ?? []);

  const [marketCap, setMarketCap] = useState(BigInt(data.state.state.instantaneousStats.marketCap));
  const [dailyVolume, setDailyVolume] = useState(BigInt(data.state.dailyVolume));
  const [allTimeVolume, setAllTimeVolume] = useState(
    BigInt(data.state.state.cumulativeStats.quoteVolume)
  );

  useEffect(() => {
    if (stateEvents.length === 0) return;
    const event = stateEvents.at(0);
    if (event) {
      setMarketCap(event.state.instantaneousStats.marketCap);
      setAllTimeVolume(event.state.cumulativeStats.quoteVolume);
      if (isMarketStateModel(event)) {
        setDailyVolume(event.dailyVolume);
      }
    }
  }, [stateEvents]);

  const { ref: marketCapRef } = useLabelScrambler(marketCap);
  const { ref: dailyVolumeRef } = useLabelScrambler(dailyVolume);
  const { ref: allTimeVolumeRef } = useLabelScrambler(allTimeVolume);

  return (
    <div className="flex justify-center">
      <div className={innerWrapper}>
        <div className={headerWrapper}>
          <div
            title={emojisToName(data.emojis).toUpperCase()}
            className=" text-white uppercase ellipses display-4 font-forma-bold md:display-2"
          >
            {emojisToName(data.emojis)}
          </div>

          <Emoji className="text-[24px] md:display-2 my-auto text-white" emojis={data.emojis} />
        </div>

        <div className={statsWrapper}>
          <div className="flex gap-[8px]">
            <div className={statsTextClasses + " text-light-gray"}>{t("Mkt. Cap:")}</div>
            <div className={statsTextClasses + " text-white"}>
              <div className="flex flex-row justify-center items-center">
                <div ref={marketCapRef}>{toCoinDecimalString(marketCap, 2)}</div>
                &nbsp;
                <AptosIconBlack className="icon-inline mb-[0.3ch]" />
              </div>
            </div>
          </div>

          <div className="flex gap-[8px]">
            <div className={statsTextClasses + " text-light-gray"}>{t("24 hour vol:")}</div>
            <div className={statsTextClasses + " text-white"}>
              <div className="flex flex-row justify-center items-center">
                <div ref={dailyVolumeRef}>{toCoinDecimalString(dailyVolume, 2)}</div>
                &nbsp;
                <AptosIconBlack className="icon-inline mb-[0.3ch]" />
              </div>
            </div>
          </div>

          <div className="flex gap-[8px]">
            <div className={statsTextClasses + " text-light-gray"}>{t("All-time vol:")}</div>
            <div className={statsTextClasses + " text-white"}>
              <div className="flex flex-row justify-center items-center">
                <div ref={allTimeVolumeRef}>{toCoinDecimalString(allTimeVolume, 2)}</div>
                &nbsp;
                <AptosIconBlack className="icon-inline mb-[0.3ch]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainInfo;
