import { useEffect, useState } from "react";
import { emoji } from "utils";
import { EmojiAsImage } from "utils/emoji";

import Text from "@/components/text";
import BondingCurveArrow from "@/icons/BondingCurveArrow";

export const ArenaLoading = ({ text = "Loading" }: { text?: string }) => {
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setPosition((prev) => (prev + 1) % 4), 2000 / 3);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex h-[100%] w-[100%] flex-col items-center justify-center">
      <div className="flex w-[200px] flex-col items-center gap-4">
        <div className="flex flex-row">
          <EmojiAsImage
            className="translate-x-4"
            size="40px"
            emojis={emoji("collision")}
            set="apple"
          />
          {Array.from({ length: 3 }).map((_, i) => {
            return (
              <BondingCurveArrow
                key={`progress-bar-element-${i}`}
                color={i < position ? "econiaBlue" : "darkGray"}
              />
            );
          })}
          <EmojiAsImage
            className="-translate-x-4"
            size="40px"
            emojis={emoji("rocket")}
            set="apple"
          />
        </div>
        <Text className="tracking-widest" textTransform="uppercase" textScale={"pixelHeading4"}>
          {text}...
        </Text>
      </div>
    </div>
  );
};
