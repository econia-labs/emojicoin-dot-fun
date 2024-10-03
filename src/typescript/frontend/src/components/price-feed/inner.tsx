"use client";

import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useRef } from "react";
import type { PriceFeedData } from "./types";
import Link from "next/link";

const Item = ({ emoji, change }: { emoji: string, change: number }) => {
  return (
    <Link href={`/market/${emoji}`} className={`font-pixelar whitespace-nowrap border-[1px] border-solid ${change >= 0 ? "border-green" : "border-pink"} rounded-full px-3 py-[2px] select-none`} draggable={false}>
      <span className="text-xl mr-[9px]">{emoji}:</span>
      <span className={`text-2xl ${change >= 0 ? "text-green" : "text-pink"}`}>{change >= 0 ? "+" : "-"} {Math.abs(change)}%</span>
    </Link>
  );
};

export const PriceFeedInner = ({ data }: {data: PriceFeedData}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  carouselRef.current?.clientWidth;

  const controls = useAnimationControls();

  useEffect(() => {
    controls.start((_) => ({
      transform: `translateX(-${(carouselRef.current?.clientWidth ?? 0 / 5 * 4)}px)`,
    }));
  }, [carouselRef]);

  const getRow = (i: number) =>
    data!.map((itemData, j) => <Item key={`item::${i}::${j}`} emoji={itemData.emoji} change={itemData.change} />)

  return <div className="w-full">
      <div className="overflow-hidden w-full flex-row">
        <div className="flex">
          <motion.div className="flex gap-[22px] animate-carousel" ref={carouselRef}
            animate={controls}
            transition={{
              duration:  ((carouselRef.current?.clientWidth ?? 0 / 5 * 4)) / (4527.83 / 88.407),
              repeat: Infinity,
              repeatType: "loop",
              ease: []
            }}>
            {[1,2,3,4,5].map(getRow)}
          </motion.div>
        </div>
      </div>
    </div>
}
