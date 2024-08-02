import { type OrderByStrings } from "@sdk/queries/const";
import { type SortByPageQueryParams } from "./types";

export type HomePageSearchParams = {
  page: string | undefined;
  sort: SortByPageQueryParams | undefined;
  order: OrderByStrings | undefined;
  bonding: boolean | undefined;
  q: string | undefined;
};

export const DefaultHomePageSearchParams: HomePageSearchParams = {
  page: "1",
  sort: "market_cap",
  order: "desc",
  bonding: undefined,
  q: undefined,
};

export const AllHomePageSearchParams = Object.keys(DefaultHomePageSearchParams) as Array<
  keyof HomePageSearchParams
>;

export const constructHomePageSearchParams = (searchParams: URLSearchParams) => {
  const res = {} as HomePageSearchParams;
  AllHomePageSearchParams.forEach((key) => {
    const value = searchParams.get(key);
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    res[key] = value ?? (DefaultHomePageSearchParams[key] as any);
  });
  return res;
};
