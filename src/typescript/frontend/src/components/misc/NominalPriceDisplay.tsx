import { type AnyNumber } from "@sdk/emojicoin_dot_fun/types";
import { toNominalPrice } from "@sdk/utils";
import { cn } from "lib/utils/class-name";
import React, { type HTMLAttributes } from "react";

type PriceColors = "neutral" | "buy" | "sell";
export const PriceColors: { [key in PriceColors]: string } = {
  neutral: "text-lighter-gray",
  buy: "text-green",
  sell: "text-pink",
};

interface NominalPriceDisplayProps extends HTMLAttributes<HTMLSpanElement> {
  priceQ64: AnyNumber;
  decimals?: number;
  colorFor?: PriceColors;
}

/**
 * Splits a Q64 price into two parts, the significant figures, and the insignificant figures.
 *
 * Visually mutes the insignificant figures and highlights the significant ones.
 */
export const NominalPriceDisplay = ({
  priceQ64,
  decimals = 9,
  colorFor = "neutral",
  className,
}: NominalPriceDisplayProps) => {
  const price = toNominalPrice(priceQ64);
  const fixed = price.toFixed(decimals);
  const firstSigFigOnwards = fixed.match(/[1-9].*/)?.at(0) ?? "";
  const beforeSigFig = fixed.slice(0, fixed.length - firstSigFigOnwards.length);
  const color = PriceColors[colorFor];
  return (
    <>
      <span className={cn(color, "brightness-[0.4]", className)}>{beforeSigFig}</span>
      <span className={cn(color, "brightness-125", className)}>{firstSigFigOnwards}</span>
    </>
  );
};
