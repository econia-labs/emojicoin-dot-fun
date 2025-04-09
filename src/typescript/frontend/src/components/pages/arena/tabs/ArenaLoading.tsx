import { useEffect, useState } from "react";
import { emoji } from "utils";
import { EmojiAsImage } from "utils/emoji";

import Text from "@/components/text";
import BondingCurveArrow from "@/icons/BondingCurveArrow";

export const ArenaLoading = ({ text = "Loading" }: { text?: string }) => {
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setPosition((prev) => (prev + 1) % 4), 700);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="backdrop-blur-sm inset-0 fixed bg-black bg-opacity-0 flex items-center justify-center z-50">
      <div className="flex flex-col border-r-2 justify-center items-center w-[500px] h-[300px] bg-black border border-dark-gray border-solid">
        <div className="w-[200px] flex flex-col items-center gap-4">
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
    </div>
  );
};
