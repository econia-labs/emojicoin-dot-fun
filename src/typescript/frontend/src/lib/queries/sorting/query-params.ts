import { type OrderByStrings } from "@sdk/queries/const";
import { toPageQueryParam, type SortByPageQueryParams } from "./types";
import { MARKETS_PER_PAGE } from "./const";

export type HomePageSearchParams = {
  page: string;
  sort: SortByPageQueryParams;
  order: OrderByStrings;
  bonding: boolean;
  q: string;
};

export const calculatePageNumber = ({
  page,
  numMarkets,
  prev,
}: {
  page?: string | null;
  numMarkets: number;
  prev: boolean;
}) => {
  const currentPage = Number(page ?? 1);
  const newPage = prev ? currentPage - 1 : currentPage + 1;
  const lastPage = Math.ceil(numMarkets / MARKETS_PER_PAGE);

  if (newPage === 0 && prev) {
    return lastPage;
  } else if (newPage > lastPage) {
    return 1;
  }
  return newPage;
};

export const getSortQueryPath = ({
  value,
  searchParams,
  pathname,
}: {
  value: Parameters<typeof toPageQueryParam>[number];
  searchParams: URLSearchParams;
  pathname: string;
}) => {
  const params = new URLSearchParams(searchParams.toString());
  const newValue = toPageQueryParam(value);
  params.set("sort" as keyof HomePageSearchParams, newValue);
  return `${pathname}?${params.toString()}`;
};

export const getPageQueryPath = ({
  prev,
  searchParams,
  pathname,
  numMarkets,
}: {
  prev: boolean;
  searchParams: URLSearchParams;
  pathname: string;
  numMarkets: number;
}) => {
  const page = calculatePageNumber({
    page: searchParams.get("page"),
    numMarkets,
    prev,
  });

  const params = new URLSearchParams(searchParams.toString());
  params.set("page" as keyof HomePageSearchParams, page.toString());
  return `${pathname}?${params.toString()}`;
};

export const getOrderQueryPath = ({
  value,
  searchParams,
  pathname,
}: {
  value: OrderByStrings;
  searchParams: URLSearchParams;
  pathname: string;
}) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set("order" as keyof HomePageSearchParams, value);
  return `${pathname}?${params.toString()}`;
};

export const getBondingQueryPath = ({
  value,
  searchParams,
  pathname,
}: {
  value: boolean;
  searchParams: URLSearchParams;
  pathname: string;
}) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set("bonding" as keyof HomePageSearchParams, value.toString());
  return `${pathname}?${params.toString()}`;
};
