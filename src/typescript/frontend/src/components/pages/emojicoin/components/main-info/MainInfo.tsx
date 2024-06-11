import React from "react";

import { translationFunction } from "context/language-context";
import { useTooltip } from "hooks";
import { toCoinDecimalString } from "lib/utils/decimals";
import AptosIconBlack from "components/svg/icons/AptosBlack";
import { type MainInfoProps } from "../../types";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";

const innerWrapper = `flex flex-col md:flex-row justify-around w-full max-w-[1362px] px-[30px] lg:px-[44px] py-[17px]
md:py-[37px] xl:py-[68px]`;
const headerWrapper =
  "flex flex-row md:flex-col md:justify-between gap-[12px] md:gap-[4px] w-full md:w-[58%] xl:w-[65%] mb-[8px]";
const statsWrapper = "flex flex-col w-full md:w-[42%] xl:w-[35%] mt-[-8px]";
const statsTextClasses = "display-6 md:display-4 uppercase ellipses font-forma";

const MainInfo = (props: MainInfoProps) => {
  const { t } = translationFunction();

  const { targetRef: targetRefEmojiName, tooltip: tooltipEmojiName } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  return (
    <div className="flex justify-center">
      <div className={innerWrapper}>
        <div className={headerWrapper}>
          <div
            ref={targetRefEmojiName}
            className=" text-white uppercase ellipses md:display-2 display-4"
          >
            {emojisToName(props.data.emojis)}
          </div>
          {tooltipEmojiName}

          <div className="text-[24px] md:display-2">{props.data.symbol}</div>
        </div>

        <div className={statsWrapper}>
          <div className="flex gap-[8px]">
            <div className={statsTextClasses + " text-light-gray"}>{t("Mkt. Cap:")}</div>
            <div className={statsTextClasses + " text-white"}>
              {toCoinDecimalString(props.data.marketCap, 2)}
              &nbsp;
              <AptosIconBlack className="icon-inline" />
            </div>
          </div>

          <div className="flex gap-[8px]">
            <div className={statsTextClasses + " text-light-gray"}>{t("24 hour vol:")}</div>
            <div className={statsTextClasses + " text-white"}>
              {toCoinDecimalString(props.data.dailyVolume, 2)}
              &nbsp;
              <AptosIconBlack className={"icon-inline"} />
            </div>
          </div>

          <div className="flex gap-[8px]">
            <div className={statsTextClasses + " text-light-gray"}>{t("All-time vol:")}</div>
            <div className={statsTextClasses + " text-white"}>
              {toCoinDecimalString(props.data.allTimeVolume, 2)}
              &nbsp;
              <AptosIconBlack className={"icon-inline"} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainInfo;
