import AptosIconBlack from "@icons/AptosBlack";
import { FormattedNumber } from "components/FormattedNumber";

export const AptCell = ({ value }: { value: number }) => {
  return (
    <span className="flex gap-1 items-center">
      <FormattedNumber scramble value={value} style={"sliding-precision"} />
      <AptosIconBlack className="ml-1 icon-inline text-xl" />
    </span>
  );
};
