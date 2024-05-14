import { type DataType } from "../../types";
import { type HEADERS } from "../../constants";

export type TableHeaderProps = {
  item: (typeof HEADERS)[number];
  isLast: boolean;
  sortData: (sortBy: Exclude<keyof DataType, "pool">) => void;
};
