import { cn } from "lib/utils/class-name";
import { type ReactNode, useState } from "react";
import { useTimeoutFn } from "react-use";
import type { ClassNameValue } from "tailwind-merge";

import { FormattedNumber } from "@/components/FormattedNumber";

import AnimatedLoadingBoxes from "../../launch-emojicoin/animated-loading-boxes";

export const FormattedNominalNumber = (props: {
  className?: string;
  value: bigint;
  prefix?: string;
  suffix?: string;
  scramble?: boolean;
}) => (
  <FormattedNumber
    className={props.className}
    value={props.value}
    decimals={2}
    nominalize
    prefix={props.prefix}
    suffix={props.suffix}
    scramble={props.scramble}
  />
);

const THREE_SECONDS = 3000;

export const AnimatedLoadingBoxesWithFallback = ({
  fallback,
  numSquares,
  className,
  delay = THREE_SECONDS,
}: {
  className?: ClassNameValue;
  fallback: ReactNode;
  numSquares?: number;
  /* Delay should always be a constant, never a dynamic value. */
  delay?: number;
}) => {
  const [displayFallback, setDisplayFallback] = useState(false);
  useTimeoutFn(() => {
    setDisplayFallback(true);
  }, delay);

  return (
    <div className={cn(className)}>
      {displayFallback ? fallback : <AnimatedLoadingBoxes numSquares={numSquares} />}
    </div>
  );
};
