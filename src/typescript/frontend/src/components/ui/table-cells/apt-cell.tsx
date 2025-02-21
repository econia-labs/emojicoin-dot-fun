import AptosIconBlack from "@icons/AptosBlack";
import { FormattedNumber } from "components/FormattedNumber";
import { type FormatNumberStringProps } from "lib/utils/format-number-string";

export const AptCell = (props: FormatNumberStringProps & { scramble?: boolean }) => {
  return (
    <span className="flex gap-1 items-center">
      <FormattedNumber {...props} />
      <AptosIconBlack className="ml-1 icon-inline text-xl" />
    </span>
  );
};
