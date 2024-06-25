import { type HEADERS } from "../../constants";

export type TableHeaderProps = {
  item: (typeof HEADERS)[number];
  isLast: boolean;
  onClick: () => void;
};
