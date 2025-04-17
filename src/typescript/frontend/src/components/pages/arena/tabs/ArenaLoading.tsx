import { useEffect, useState } from "react";
import { emoji } from "utils";
import { EmojiAsImage } from "utils/emoji";

import Text from "@/components/text";
import BondingCurveArrow from "@/icons/BondingCurveArrow";

import useArenaLoadingInfo from "./ArenaLoadingElement";

export const MAX_LOADING_TIME = 1500;

export const ArenaLoading = () => {
  const [position, setPosition] = useState(0);
  const { text } = useArenaLoadingInfo();

  useEffect(() => {
    const interval = setInterval(
      () => setPosition((prev) => (prev + 1) % 4),
      (MAX_LOADING_TIME - 200) / 3
    );
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="w-[100%] h-[100%] flex flex-col items-center justify-center">
      <div className="w-[200px] flex flex-col items-center gap-4">
        <div className="flex flex-row">
          <EmojiAsImage
            className="translate-x-4"
            size="47px"
            emojis={emoji("collision")}
            set="apple"
          />
          {Array.from({ length: 3 }).map((_, i) => {
            return (
              <BondingCurveArrow
                asMotion
                key={`progress-bar-element-${i}`}
                color={i < position ? "econiaBlue" : "darkGray"}
              />
            );
          })}
          <EmojiAsImage
            className="-translate-x-4"
            size="47px"
            emojis={emoji("rocket")}
            set="apple"
          />
        </div>
        <Text className="tracking-widest" textTransform="uppercase" textScale={"pixelHeading4"}>
          {`${text ?? ""}...`}
        </Text>
      </div>
    </div>
  );
};
