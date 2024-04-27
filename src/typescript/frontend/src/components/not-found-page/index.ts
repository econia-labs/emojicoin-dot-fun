import { lazyLoad } from "utils";

export const NotFoundPage = lazyLoad(
  () => import("./NotFoundPage"),
  module => module.default,
);
