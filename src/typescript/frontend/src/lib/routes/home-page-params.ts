import { Schemas } from "@/sdk/utils";

export interface HomePageParams {
  params: {
    sort: string;
    page: string;
  };
}

export const safeParsePageWithDefault = (pageInput: unknown): number => {
  const result = Schemas["PositiveInteger"].safeParse(pageInput);
  return result.success ? result.data : 1;
};
