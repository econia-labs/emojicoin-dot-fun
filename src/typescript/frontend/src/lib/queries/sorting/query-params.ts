import { type OrderByStrings } from "@sdk/queries/const";
import { toPageQueryParam, type SortByPageQueryParams } from "./types";

export type HomePageSearchParams = {
  page: string;
  sort: SortByPageQueryParams;
  order: OrderByStrings;
  bonding: boolean;
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
  value,
  searchParams,
  pathname,
}: {
  value: string;
  searchParams: URLSearchParams;
  pathname: string;
}) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set("page" as keyof HomePageSearchParams, value);
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
