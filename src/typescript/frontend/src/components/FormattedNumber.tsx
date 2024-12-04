import type { AnyNumberString } from "@sdk-types";
import { useLabelScrambler } from "./pages/home/components/table-card/animation-variants/event-variants";
import { toNominal } from "lib/utils/decimals";
import { useEffect, useMemo } from "react";

/**
 * Sliding precision will show `decimals` decimals when Math.abs(number) is
 * above 1 and `decimals` significant digits when the number is below 1.
 *
 * Fixed will always show `decimals` digits.
 */
export type FormattedNumberStyle = "sliding-precision" | "fixed";

const ScrambledNumberLabel = ({
  value,
  suffix = "",
  prefix = "",
  className = "",
}: {
  value: string;
  suffix?: string;
  prefix?: string;
  className?: string;
}) => {
  const { ref, replay } = useLabelScrambler(value, suffix, prefix);
  useEffect(() => {
    replay();
  }, [value, replay]);
  return <span className={className} ref={ref}>{`${prefix}${value}${suffix}`}</span>;
};

/**
 * Formats a number, string or bigint and scrambles it if desired.
 *
 * @param value the number to format and display
 * @param decimals the number of decimals to show
 * @param scramble whether or not to scramble the text upon change
 * @param suffix the suffix that shouldn't be scrambled, if the value is scrambled
 * @param prefix the prefix that shouldn't be scrambled, if the value is scrambled
 * @param className the class name for the span wrapping the value
 * @param style the formatter style
 * @see {@link FormattedNumberStyle}
 * @returns a component for the formatted number
 */
export const FormattedNumber = ({
  value,
  decimals = 2,
  scramble = false,
  nominalize = false,
  suffix = "",
  prefix = "",
  className,
  style = "sliding-precision",
}: (
  | {
      value: bigint;
      nominalize: true;
    }
  | {
      value: AnyNumberString;
      nominalize?: undefined | false;
    }
) & {
  decimals?: number;
  scramble?: boolean;
  suffix?: string;
  prefix?: string;
  className?: string;
  style?: FormattedNumberStyle;
}) => {
  const displayValue = useMemo(() => {
    if (nominalize && typeof value !== "bigint") {
      throw new Error("Input value needs to be a bigint.");
    }
    const num = nominalize ? toNominal(value as bigint) : Number(value);
    const format =
      style === "fixed" || Math.abs(num) >= 1
        ? { maximumFractionDigits: decimals }
        : { maximumSignificantDigits: decimals };
    const formatter = new Intl.NumberFormat("en-US", format);
    return formatter.format(num);
  }, [value, decimals, nominalize, style]);

  return scramble ? (
    <ScrambledNumberLabel
      value={displayValue}
      prefix={prefix}
      suffix={suffix}
      className={className}
    />
  ) : (
    <span className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};
