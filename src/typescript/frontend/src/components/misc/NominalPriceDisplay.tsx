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
  price: AnyNumber;
  q64?: boolean;
  decimals?: number;
  colorFor?: PriceColors;
}

/**
 * Splits a Q64 price into two parts, the significant figures, and the insignificant figures.
 *
 * Visually mutes the insignificant figures and highlights the significant ones.
 */
export const NominalPriceDisplay = ({
  price,
  q64 = false,
  decimals = 9,
  colorFor = "neutral",
  className,
}: NominalPriceDisplayProps) => {
  const priceOut = q64 ? toNominalPrice(price) : Number(price);
  const fixed = priceOut.toFixed(decimals);
  const firstSigFigOnwards = fixed.match(/[1-9].*/)?.at(0) ?? "";
  const beforeSigFig = fixed.slice(0, fixed.length - firstSigFigOnwards.length);
  const color = PriceColors[colorFor];
  return (
    <>
      <span className={cn(color, "brightness-[0.35]", className)}>{beforeSigFig}</span>
      <span className={cn(color, "brightness-100", className)}>{firstSigFigOnwards}</span>
    </>
  );
};
