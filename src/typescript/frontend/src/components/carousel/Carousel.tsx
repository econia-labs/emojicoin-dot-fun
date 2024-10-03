"use client";

import useWindowDimensions from "@hooks/use-window-dimensions";
import styles from "./Carousel.module.css";

import { useEffect, useRef, useState } from "react";
import useNodeDimensions from "@hooks/use-node-dimensions";

// This might seem like it is useless, but removing this line of code breaks the carousel functionality.
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const Test = () => <div className="animate-carousel"></div>;

export const Carousel = ({ children, gap = 0 }: React.PropsWithChildren<{ gap?: number }>) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [len, setLen] = useState(3);
  const { width: carouselWidth } = useNodeDimensions(carouselRef);
  const { width: windowWidth } = useWindowDimensions();

  useEffect(() => {
    if (carouselWidth > 0 && carouselWidth < windowWidth * 3) {
      const factor = Math.ceil((windowWidth * 3) / carouselWidth);
      setLen(Math.min(factor * len + (3 - ((factor * len) % 3)), 201));
    }
    if (carouselWidth == 0) {
      setLen(3);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [carouselWidth, windowWidth]);

  return (
    <div className="w-full">
      <div className="overflow-hidden w-full flex-row">
        <div className="flex">
          <div
            className={`flex ${styles.hoverPause}`}
            ref={carouselRef}
            style={{
              animation: `carousel ${carouselWidth / 100}s linear infinite`,
              gap,
            }}
          >
            {Array.from({ length: len }, (_, i) => i).map(() => children)}
          </div>
        </div>
      </div>
    </div>
  );
};
