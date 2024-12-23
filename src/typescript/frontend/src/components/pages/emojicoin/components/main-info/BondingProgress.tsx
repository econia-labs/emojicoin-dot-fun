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
      {/*
        3.26 is calculated like this:

        The aspect ratio of a bonding curve arrow is 115/30 aka 23/6.

        There are 7 of them.

        So the aspect ratio of the container element is 115/30*7 aka 161/6.

        We know that the rocket emoji's width and height is 175% of the container height.

        We want to add padding to the container to include the half part of the rocket emoji that overflows on the left, in order to properly center the container within its container.

        The padding should be 50% of the rocket's width, but we cannot use the rocket width as a unit in CSS.

        But we know that the rocket width is 175% of the container height.

        But we cannot specify the left padding in height percentage, but only in width percentage.

        But we know that the container's width is 161/6 times the container's height.

        So we can do 100 / (161/6) * 1.75 / 2 which gives us ~3.26.

        Who knew CSS could be this hard...
      */}
      <div className="w-[100%] pl-[3.26%]">
        <div className="grid relative w-[100%]" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
          <Emoji
            size="100%"
            className="absolute h-[175%] translate-x-[-50%] translate-y-[-18.75%]"
            emojis={emoji("rocket")}
            set="apple"
          />
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
