import React from "react";

import BondingCurveArrow from "@icons/BondingCurveArrow";
import { emoji } from "utils";
import { EmojiAsImage } from "utils/emoji";

export const ProgressBar = ({ length, position }: { length: number; position: number }) => {
  const aspectRatio = (115 / 30) * length;
  return (
    <>
      {/*
        3.26 is calculated like this:

        The aspect ratio of a bonding curve arrow is 115/30 aka 23/6.

        There are `length` of them.

        So the aspect ratio of the container element is 115/30*length.

        We know that the rocket emoji's width and height is 175% of the container height.

        We want to add padding to the container to include the half part of the rocket emoji that overflows on the left, in order to properly center the container within its container.

        The padding should be 50% of the rocket's width, but we cannot use the rocket width as a unit in CSS.

        But we know that the rocket width is 175% of the container height.

        But we cannot specify the left padding in height percentage, but only in width percentage.

        But we know that the container's width is 115/30*length times the container's height.

        So we can do 100 / (115/30*length) * 1.75 / 2.

        Who knew CSS could be this hard...
      */}
      <div
        className="w-[100%]"
        style={{
          paddingLeft: `${((100 / aspectRatio) * 1.75) / 2}%`,
        }}
      >
        <div
          className="grid relative w-[100%]"
          style={{ gridTemplateColumns: `repeat(${length}, 1fr)` }}
        >
          <EmojiAsImage
            size="100%"
            className="absolute h-[175%] translate-x-[-50%] translate-y-[-18.75%]"
            emojis={emoji("rocket")}
            set="apple"
          />
          {Array.from({ length: length }).map((_, i) => {
            return (
              <BondingCurveArrow
                key={`progress-bar-element-${i}`}
                className="w-[100%] h-[100%]"
                color={i < position ? "econiaBlue" : "darkGray"}
              />
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ProgressBar;
