import { formatNumberString, type FormatNumberStringProps } from "lib/utils/format-number-string";
import { useEffect, useMemo } from "react";

import { useLabelScrambler } from "@/hooks/use-label-scrambler";

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
 * @see {@link formatNumberString}
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
}: FormatNumberStringProps & {
  scramble?: boolean;
  suffix?: string;
  prefix?: string;
  className?: string;
}) => {
  const displayValue = useMemo(() => {
    return formatNumberString({
      value,
      decimals,
      nominalize,
      style,
    } as FormatNumberStringProps);
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
