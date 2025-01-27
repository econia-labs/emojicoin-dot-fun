import React, { useEffect, useState } from "react";

import { translationFunction } from "context/language-context";
import { type MainInfoProps } from "../../types";
import { useEventStore } from "context/event-store-context";
import { getBondingCurveProgress } from "@sdk/utils/bonding-curve";
import { FormattedNumber } from "components/FormattedNumber";
import ProgressBar from "components/ProgressBar";

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

  let position = 0;
  if (bondingProgress >= 100) position = 7;
  else if (bondingProgress >= 90) position = 6;
  else if (bondingProgress >= 75) position = 5;
  else if (bondingProgress >= 60) position = 4;
  else if (bondingProgress >= 45) position = 3;
  else if (bondingProgress >= 30) position = 2;
  else if (bondingProgress >= 15) position = 1;

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
      <ProgressBar length={7} position={position} />
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
