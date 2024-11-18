"use client";

import { useUserSettings } from "context/event-store-context";
import Carousel from "components/carousel";

export const RewardsBanner = () => {
  const hasFreeSwap = useUserSettings((s) => s.freeSwapData !== undefined);
  return hasFreeSwap ? (
    <div className="w-full z-[10] relative">
      <Carousel>
        <span className="pixel-heading-3 text-ec-blue w-max px-[18px]">
          You are eligible for a free trade !
        </span>
      </Carousel>
    </div>
  ) : (
    <></>
  );
};
