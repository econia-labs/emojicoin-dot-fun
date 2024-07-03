import React, { useEffect, useState } from "react";

import { translationFunction } from "context/language-context";
import { useTooltip } from "hooks";
import { toCoinDecimalString } from "lib/utils/decimals";
import AptosIconBlack from "components/svg/icons/AptosBlack";
import { type MainInfoProps } from "../../types";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";
import { useEventStore, useWebSocketClient } from "context/websockets-context";
import { useLabelScrambler } from "components/pages/home/components/animation-config";

const innerWrapper = `flex flex-col md:flex-row justify-around w-full max-w-[1362px] px-[30px] lg:px-[44px] py-[17px]
md:py-[37px] xl:py-[68px]`;
const headerWrapper =
  "flex flex-row md:flex-col md:justify-between gap-[12px] md:gap-[4px] w-full md:w-[58%] xl:w-[65%] mb-[8px]";
const statsWrapper = "flex flex-col w-full md:w-[42%] xl:w-[35%] mt-[-8px]";
const statsTextClasses = "display-6 md:display-4 uppercase ellipses font-forma";

const MainInfo = (props: MainInfoProps) => {
  const { t } = translationFunction();

  const marketID = props.data.marketID.toString();
  const stateEvents = useEventStore((s) => s.getMarket(marketID)?.stateEvents ?? []);
  const { subscribe, unsubscribe } = useWebSocketClient((s) => s);

  // TODO: [ROUGH_VOLUME_TAG_FOR_CTRL_F]
  // Add to this in state. You can keep track of this yourself, technically.
  // It would require some reconciliation between the data from server and data in store, but it would drastically
  // reduce the amount of calls we'd have to make while keeping the data very up to date and accurate.
  // Right now we add the volume from any incoming events, which is basically a rough estimate and may be inaccurate.
  const [marketCap, setMarketCap] = useState(BigInt(props.data.marketCap));
  const [roughDailyVolume, setRoughDailyVolume] = useState(BigInt(props.data.dailyVolume));
  const [roughAllTimeVolume, setRoughAllTimeVolume] = useState(BigInt(props.data.allTimeVolume));

  useEffect(() => {
    if (stateEvents.length === 0) return;
    const latestEvent = stateEvents.at(0)!;
    const numSwapsInStore = latestEvent?.cumulativeStats.numSwaps ?? 0;
    if (numSwapsInStore > props.data.numSwaps) {
      const marketCapInStore = latestEvent.instantaneousStats.marketCap;
      setMarketCap(marketCapInStore);
    }

    // TODO: Fix ASAP. This **will** become inaccurate over time, because it doesn't evict stale data from the rolling
    // volume. It's just a rough estimate to simulate live 24h rolling volume.
    setRoughDailyVolume((prev) => prev + latestEvent.lastSwap.quoteVolume);
    setRoughAllTimeVolume((prev) => prev + latestEvent.lastSwap.quoteVolume);
  }, [props.data, stateEvents]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    subscribe.state(marketID);
    return () => unsubscribe.state(marketID);
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const { targetRef: targetRefEmojiName, tooltip: tooltipEmojiName } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  const { ref: marketCapRef } = useLabelScrambler(marketCap);
  const { ref: dailyVolumeRef } = useLabelScrambler(roughDailyVolume);
  const { ref: allTimeVolumeRef } = useLabelScrambler(roughAllTimeVolume);

  return (
    <div className="flex justify-center">
      <div className={innerWrapper}>
        <div className={headerWrapper}>
          <div
            ref={targetRefEmojiName}
            className=" text-white uppercase ellipses display-4 font-forma-bold md:display-2"
          >
            {emojisToName(props.data.emojis)}
          </div>
          {tooltipEmojiName}

          <div className="text-[24px] md:display-2 my-auto">{props.data.symbol}</div>
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
