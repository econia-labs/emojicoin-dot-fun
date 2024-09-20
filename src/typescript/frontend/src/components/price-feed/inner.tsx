"use client";

import Planet from "@icons/Planet";
import { motion } from "framer-motion";
import { useRef } from "react";
import type { PriceFeedData } from "./types";

const Item = ({ emoji, change }: { emoji: string, change: number }) => {
  return (
    <div className="h-[40px] pixel-heading-3 whitespace-nowrap">
      <span>{emoji}:</span>
      <span className={change >= 0 ? "text-green" : "text-pink"}>{change >= 0 && "+"}{change}%</span>
    </div>
  );
};

export const PriceFeedInner = ({ data }: {data: PriceFeedData}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  carouselRef.current?.clientWidth;

  const getRow = (i: number) =>
    data!.map((itemData, j) => <><Item key={`item::${i}::${j}`} emoji={itemData.emoji} change={itemData.change} /><Planet /></>)

  return <div className="w-full">
      <div className="overflow-hidden w-full flex-row">
        <div className="flex">
          <motion.div className="flex gap-[16px] animate-carousel" ref={carouselRef}
            initial={{
              transform: "translateX(0)",
            }}
            animate={{
              transform: `translateX(-${(carouselRef.current?.clientWidth ?? 0 / 5 * 4)}px)`,
            }}
            transition={{
              duration:  ((carouselRef.current?.clientWidth ?? 0 / 5 * 4)) / (4527.83 / 88.407),
              repeat: Infinity,
              repeatType: "loop",
              ease: []
            }}>
            <Planet />
            {[1,2,3,4,5].map(getRow)}
          </motion.div>
        </div>
      </div>
    </div>
}
