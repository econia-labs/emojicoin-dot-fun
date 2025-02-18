import { type AnyNumber } from "@sdk/emojicoin_dot_fun/types";
import { toNominalPrice } from "@sdk/utils";
import { type ClassValue } from "clsx";
import { cn } from "lib/utils/class-name";
import { formatNumberString, type FormatNumberStringProps } from "lib/utils/format-number-string";
import React, { type HTMLAttributes } from "react";

type PriceColors = "neutral" | "buy" | "sell";
export const PriceColors: { [key in PriceColors]: { color: ClassValue; brightness: ClassValue } } =
  {
    neutral: { color: "text-lighter-gray", brightness: "brightness-[0.45]" },
    buy: { color: "text-green", brightness: "brightness-[0.45]" },
    sell: { color: "text-pink", brightness: "brightness-[0.6]" },
  };

type ColoredPriceDisplayProps = Omit<HTMLAttributes<HTMLSpanElement>, "style"> & {
  price: AnyNumber;
  q64?: boolean;
  colorFor?: PriceColors;
} & Omit<FormatNumberStringProps, "value" | "nominalize">;

/**
 * Splits a price number into two parts, the significant figures, and the insignificant figures.
 *
 * Visually mutes the insignificant figures and highlights the significant ones.
 *
 * @param price the input price
 * @param q64 whether or not the number is a q64 value
 * @param decimals the number of decimal points to use
 * @param colorFor the color type to use to highlight the significant digits
 * @param className extra styles to pass to the two resulting span elements
 * @param style the decimal display style
 * @see {@link formatNumberString}
 */
export const ColoredPriceDisplay = ({
  price,
  q64 = false,
  decimals = 9,
  colorFor = "neutral",
  className,
  style = "fixed", // The display style for the number of decimals, not CSS properties.
}: ColoredPriceDisplayProps) => {
  const value = q64 ? toNominalPrice(price) : price;
  const res = formatNumberString({ value, decimals, nominalize: false, style });
  const firstSigFigOnwards = res.match(/[1-9].*/)?.at(0) ?? "";
  const beforeSigFig = res.slice(0, res.length - firstSigFigOnwards.length);
  const { color, brightness: dimmed } = PriceColors[colorFor];
  return (
    <>
      <span className={cn(color, dimmed, className)}>{beforeSigFig}</span>
      <span className={cn(color, "brightness-100", className)}>{firstSigFigOnwards}</span>
    </>
  );
};
