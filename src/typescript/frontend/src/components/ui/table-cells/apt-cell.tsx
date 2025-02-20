import AptosIconBlack from "@icons/AptosBlack";
import { FormattedNumber } from "components/FormattedNumber";

export const AptCell = ({ value, scramble }: { value: number; scramble?: boolean }) => {
  return (
    <span className="flex gap-1 items-center">
      <FormattedNumber scramble={scramble} value={value} style={"sliding-precision"} />
      <AptosIconBlack className="ml-1 icon-inline text-xl" />
    </span>
  );
};
