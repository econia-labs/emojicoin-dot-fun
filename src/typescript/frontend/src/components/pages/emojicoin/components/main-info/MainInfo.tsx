import React, { useEffect, useState } from "react";

import { translationFunction } from "context/language-context";
import { toCoinDecimalString } from "lib/utils/decimals";
import AptosIconBlack from "components/svg/icons/AptosBlack";
import { type MainInfoProps } from "../../types";
import { useEventStore } from "context/event-store-context";
import { useLabelScrambler } from "components/pages/home/components/table-card/animation-variants/event-variants";
import { isMarketStateModel } from "@sdk/indexer-v2/types";
import BondingProgress from "./BondingProgress";
import { useThemeContext } from "context";

const statsTextClasses = "uppercase ellipses font-forma text-[24px]";

const MainInfo = ({ data }: MainInfoProps) => {
  const { t } = translationFunction();
  const { theme } = useThemeContext();

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

  const { ref: marketCapRef } = useLabelScrambler(toCoinDecimalString(marketCap, 2));
  const { ref: dailyVolumeRef } = useLabelScrambler(toCoinDecimalString(dailyVolume, 2));
  const { ref: allTimeVolumeRef } = useLabelScrambler(toCoinDecimalString(allTimeVolume, 2));

  return (
    <div
      className="flex justify-center mt-[10px]"
      style={{
        borderTop: `1px solid ${theme.colors.darkGray}`,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "57fr 43fr",
          width: "100%",
          maxWidth: "1362px",
          padding: "40px",
        }}
      >
        <div className="text-[100px] text-center my-auto text-white">{data.symbolData.symbol}</div>

        <div className="flex flex-col mt-[-8px] ml-[4em] w-fit gap-[2px]">
          <div className="flex justify-between">
            <div className={statsTextClasses + " text-light-gray"}>{t("Mkt. Cap:")}</div>
            <div className={statsTextClasses + " text-white"}>
              <div className="flex flex-row justify-center items-center">
                <div ref={marketCapRef}>{toCoinDecimalString(marketCap, 2)}</div>
                &nbsp;
                <AptosIconBlack className="icon-inline mb-[0.3ch]" />
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <div className={statsTextClasses + " text-light-gray"}>{t("24 hour vol:")}</div>
            <div className={statsTextClasses + " text-white"}>
              <div className="flex flex-row justify-center items-center">
                <div ref={dailyVolumeRef}>{toCoinDecimalString(dailyVolume, 2)}</div>
                &nbsp;
                <AptosIconBlack className="icon-inline mb-[0.3ch]" />
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <div className={statsTextClasses + " text-light-gray"}>{t("All-time vol:")}</div>
            <div className={statsTextClasses + " text-white"}>
              <div className="flex flex-row justify-center items-center">
                <div ref={allTimeVolumeRef}>{toCoinDecimalString(allTimeVolume, 2)}</div>
                &nbsp;
                <AptosIconBlack className="icon-inline mb-[0.3ch]" />
              </div>
            </div>
          </div>

          <div className="mt-[.6em]">
            <BondingProgress data={data} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainInfo;
