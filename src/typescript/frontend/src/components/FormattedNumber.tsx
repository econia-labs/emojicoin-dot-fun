import type { AnyNumberString } from "@sdk-types";
import { useLabelScrambler } from "./pages/home/components/table-card/animation-variants/event-variants";
import { toNominal } from "lib/utils/decimals";
import { useEffect } from "react";

/**
 * Sliding precision will show `decimals` decimals when Math.abs(number) is
 * above 1 and `decimals` significant digits when the number is below 1.
 *
 * Fixed will always show `decimals` digits.
 */
export type FormattedNumberStyle = "sliding-precision" | "fixed";

export const FormattedNumber = ({
  children,
  decimals = 2,
  scramble = false,
  nominalize = false,
  suffix,
  prefix,
  className,
  style = "sliding-precision",
}: {
  children: AnyNumberString;
  decimals?: number;
  scramble?: boolean;
  nominalize?: boolean;
  suffix?: string;
  prefix?: string;
  className?: string;
  style?: FormattedNumberStyle;
}) => {
  let num: number;
  if (nominalize) {
    if (typeof children === "bigint") {
      num = toNominal(children);
    } else {
      throw new Error("Wrong number type");
    }
  } else {
    num = Number(children);
  }
  let formatter: Intl.NumberFormat;
  if (style === "fixed" || Math.abs(num) >= 1) {
    formatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: decimals });
  } else {
    formatter = new Intl.NumberFormat("en-US", { maximumSignificantDigits: decimals });
  }
  const str = formatter.format(num);
  const { ref, replay } = useLabelScrambler(str, suffix, prefix);

  useEffect(() => {
    replay();
  }, [children, replay]);

  if (scramble) {
    return (
      <span className={className} ref={ref}>
        {str}
      </span>
    );
  } else {
    return (
      <span className={className}>
        {prefix}
        {str}
        {suffix}
      </span>
    );
  }
};
