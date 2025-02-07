import AptosIconBlack from "@icons/AptosBlack";
import { type AnyNumberString } from "@sdk-types";
import { cn } from "lib/utils/class-name";

const formatter = new Intl.NumberFormat("en-us", { maximumFractionDigits: 2 });
const fmt = (n: number | bigint) => formatter.format(n);

export const KeyAndValue = ({
  field,
  value = "undefined",
  className,
  apt = false,
}: {
  field: string;
  value?: AnyNumberString | boolean | Date;
  className?: string;
  apt?: boolean;
}) => (
  <>
    <div
      className={cn(
        "flex flex-row text-white font-forma text-[1rem] leading-[1.25rem] w-full",
        className
      )}
    >
      <div className="flex m-auto">
        <span className="min-w-[35ch] m-auto">{field}</span>
        <span
          className={`min-w-[35ch] flex flex-row ${
            typeof value === "string"
              ? "text-orange-200"
              : typeof value === "number" || typeof value === "bigint"
                ? Math.floor(Number(value.toString())).toString() === value.toString()
                  ? "text-green"
                  : "text-ec-blue"
                : typeof value === "boolean"
                  ? value
                    ? "text-green"
                    : "text-error"
                  : "text-light-gray"
          }`}
        >
          {typeof value === "string"
            ? `"${value}"`
            : typeof value === "number" || typeof value === "bigint"
              ? fmt(value)
              : typeof value === "boolean"
                ? value.toString()
                : value.toLocaleString()}
          {apt ? <AptosIconBlack className="ml-[5px]" width={"0.85rem"} height={"1rem"} /> : <></>}
        </span>
      </div>
    </div>
  </>
);
