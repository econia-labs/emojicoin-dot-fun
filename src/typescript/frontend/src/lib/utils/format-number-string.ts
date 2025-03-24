import { toNominal } from "@sdk/utils";
import type { AnyNumberString, Flatten } from "@sdk-types";

/**
 * Sliding precision will show `decimals` decimals when Math.abs(number) is
 * above 1 and `decimals` significant digits when the number is below 1.
 *
 * Fixed will always show `decimals` digits.
 */
export type FormattedNumberStyle = "sliding-precision" | "fixed";

// Must be an independent type for `Flatten<...>` to work properly.
type MaybeNominalizeProps =
  | {
      value: bigint;
      nominalize: true;
    }
  | {
      value: AnyNumberString;
      nominalize?: undefined | false;
    };

export type FormatNumberStringProps = Flatten<
  MaybeNominalizeProps & {
    decimals?: number;
    style?: FormattedNumberStyle;
  }
>;

/**
 * Formats a number, bigint, or string into a decimalized string with a fixed or sliding precision format.
 *
 * @param value the bigint or number passed in
 * @param nominalize whether or not it should call @see toNominal on the value
 * @param decimals the number of decimals or significant figures to show, depending on the `style`
 * @param style @see {@link FormattedNumberStyle}
 */
export const formatNumberString = ({
  value,
  decimals,
  nominalize = false,
  style = "sliding-precision",
}: FormatNumberStringProps) => {
  if (nominalize && typeof value !== "bigint") {
    throw new Error("Input value needs to be a bigint.");
  }
  const num = nominalize ? toNominal(value as bigint) : Number(value);
  const format =
    style === "fixed" || Math.abs(num) >= 1
      ? {
          maximumFractionDigits: decimals,
          minimumFractionDigits: style === "fixed" ? decimals : undefined,
        }
      : { maximumSignificantDigits: decimals };
  const formatter = new Intl.NumberFormat("en-US", format);
  return formatter.format(num);
};
