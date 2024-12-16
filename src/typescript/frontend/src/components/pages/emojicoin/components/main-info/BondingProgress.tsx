import React, { useEffect, useState } from "react";

import { translationFunction } from "context/language-context";
import { type MainInfoProps } from "../../types";
import { useEventStore } from "context/event-store-context";
import { getBondingCurveProgress } from "@sdk/utils/bonding-curve";
import { FormattedNumber } from "components/FormattedNumber";
import BondingCurveArrow from "@icons/BondingCurveArrow";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";

const statsTextClasses = "uppercase ellipses font-forma";

const BondingProgress = ({ data }: MainInfoProps) => {
  const { t } = translationFunction();

  const marketEmojis = data.symbolEmojis;
  const stateEvents = useEventStore((s) => s.getMarket(marketEmojis)?.stateEvents ?? []);

  const [bondingProgress, setBondingProgress] = useState(
    getBondingCurveProgress(data.state.state.clammVirtualReserves.quote)
  );

  useEffect(() => {
    if (stateEvents.length === 0) return;
    const event = stateEvents.at(0);
    if (event) {
      setBondingProgress(getBondingCurveProgress(event.state.clammVirtualReserves.quote));
    }
  }, [stateEvents]);

  return (
    <div className="relative mb-[.7em]">
      <div className="w-[100%] pl-[.8em] pr-[1em]">
        <div className="grid relative w-[100%]" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
          <div className="absolute left-[-.5em] top-[-.125em] text-[1.6em]">
            <Emoji emojis={emoji("rocket")} />
          </div>
          <BondingCurveArrow
            className="w-[100%] h-[100%]"
            color={bondingProgress > 15 ? "econiaBlue" : "darkGray"}
          />
          <BondingCurveArrow
            className="w-[100%] h-[100%]"
            color={bondingProgress > 30 ? "econiaBlue" : "darkGray"}
          />
          <BondingCurveArrow
            className="w-[100%] h-[100%]"
            color={bondingProgress > 45 ? "econiaBlue" : "darkGray"}
          />
          <BondingCurveArrow
            className="w-[100%] h-[100%]"
            color={bondingProgress > 60 ? "econiaBlue" : "darkGray"}
          />
          <BondingCurveArrow
            className="w-[100%] h-[100%]"
            color={bondingProgress > 75 ? "econiaBlue" : "darkGray"}
          />
          <BondingCurveArrow
            className="w-[100%] h-[100%]"
            color={bondingProgress > 90 ? "econiaBlue" : "darkGray"}
          />
          <BondingCurveArrow
            className="w-[100%] h-[100%]"
            color={bondingProgress >= 100 ? "econiaBlue" : "darkGray"}
          />
        </div>
      </div>
      <div className="absolute bottom-[-1em] my-[-.2em] right-0 flex justify-end mr-[1em]">
        <div className={statsTextClasses + " text-dark-gray font-pixelar text-[1em]"}>
          {t("Bonding progress:")}
        </div>
        <FormattedNumber
          value={bondingProgress}
          className={
            statsTextClasses + " text-dark-gray font-pixelar text-[1em] text-end min-w-[3.3em]"
          }
          suffix="%"
          scramble
          style="fixed"
          decimals={2}
        />
      </div>
    </div>
  );
};

export default BondingProgress;
