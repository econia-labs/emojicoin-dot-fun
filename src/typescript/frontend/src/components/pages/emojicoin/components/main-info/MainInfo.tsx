import React, { useEffect, useState } from "react";

import { translationFunction } from "context/language-context";
import { toCoinDecimalString } from "lib/utils/decimals";
import AptosIconBlack from "components/svg/icons/AptosBlack";
import { type MainInfoProps } from "../../types";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";
import { useEventStore } from "context/event-store-context";
import { useLabelScrambler } from "components/pages/home/components/table-card/animation-variants/event-variants";

const innerWrapper = `flex flex-col md:flex-row justify-around w-full max-w-[1362px] px-[30px] lg:px-[44px] py-[17px]
md:py-[37px] xl:py-[68px]`;
const headerWrapper =
  "flex flex-row md:flex-col md:justify-between gap-[12px] md:gap-[4px] w-full md:w-[58%] xl:w-[65%] mb-[8px]";
const statsWrapper = "flex flex-col w-full md:w-[42%] xl:w-[35%] mt-[-8px]";
const statsTextClasses = "display-6 md:display-4 uppercase ellipses font-forma";

const MainInfo = (props: MainInfoProps) => {
  const { t } = translationFunction();

  const marketEmojis = props.data.symbolEmojis;
  const stateEvents = useEventStore((s) => s.getMarket(marketEmojis)?.stateEvents ?? []);

  const { state, dailyVolume } = props.data.state;
  // TODO: [ROUGH_VOLUME_TAG_FOR_CTRL_F]
  // Add to this in state. You can keep track of this yourself, technically.
  // It would require some reconciliation between the data from server and data in store, but it would drastically
  // reduce the amount of calls we'd have to make while keeping the data very up to date and accurate.
  // Right now we add the volume from any incoming events, which is basically a rough estimate and may be inaccurate.
  const [marketCap, setMarketCap] = useState(BigInt(state.instantaneousStats.marketCap));
  const [roughDailyVolume, setRoughDailyVolume] = useState(BigInt(dailyVolume));
  const [roughAllTimeVolume, setRoughAllTimeVolume] = useState(
    BigInt(state.cumulativeStats.quoteVolume)
  );

  useEffect(() => {
    if (stateEvents.length === 0) return;
    // TODO: Refactor this to have accurate data. We increment by 1 like this just to trigger a scramble animation.
    setMarketCap((prev) => prev + 1n);
    setRoughDailyVolume((prev) => prev + 1n);
    setRoughAllTimeVolume((prev) => prev + 1n);
  }, [stateEvents]);

  const { ref: marketCapRef } = useLabelScrambler(marketCap);
  const { ref: dailyVolumeRef } = useLabelScrambler(roughDailyVolume);
  const { ref: allTimeVolumeRef } = useLabelScrambler(roughAllTimeVolume);

  return (
    <div className="flex justify-center">
      <div className={innerWrapper}>
        <div className={headerWrapper}>
          <div
            title={emojisToName(props.data.emojis).toUpperCase()}
            className=" text-white uppercase ellipses display-4 font-forma-bold md:display-2"
          >
            {emojisToName(props.data.emojis)}
          </div>

          <div className="text-[24px] md:display-2 my-auto text-white">
            {props.data.symbolData.symbol}
          </div>
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
                <div ref={dailyVolumeRef}>{toCoinDecimalString(roughDailyVolume, 2)}</div>
                &nbsp;
                <AptosIconBlack className="icon-inline mb-[0.3ch]" />
              </div>
            </div>
          </div>

          <div className="flex gap-[8px]">
            <div className={statsTextClasses + " text-light-gray"}>{t("All-time vol:")}</div>
            <div className={statsTextClasses + " text-white"}>
              <div className="flex flex-row justify-center items-center">
                <div ref={allTimeVolumeRef}>{toCoinDecimalString(roughAllTimeVolume, 2)}</div>
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
