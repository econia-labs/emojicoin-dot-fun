import { FormattedNumber } from "components/FormattedNumber";
import type { FormatNumberStringProps } from "lib/utils/format-number-string";

import AptosIconBlack from "@/icons/AptosBlack";

export const AptCell = (props: FormatNumberStringProps & { scramble?: boolean }) => {
  return (
    <span className="flex items-center gap-1">
      <FormattedNumber {...props} />
      <AptosIconBlack className="ml-1 text-xl icon-inline" />
    </span>
  );
};
