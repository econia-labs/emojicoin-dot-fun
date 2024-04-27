import { lazyLoad } from "utils";

export const MainOutlet = lazyLoad(
  () => import("./main-outlet"),
  module => module.default,
);
