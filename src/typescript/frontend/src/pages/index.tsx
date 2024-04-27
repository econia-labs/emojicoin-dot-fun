import { lazyLoad } from "utils";
import { Loader } from "components";

const fallback = <Loader position="absolute" top="0" $backgroundColor="black" left="0" width="100%" />;

export const HomePage = lazyLoad(
  () => import("./home"),
  module => module.default,
  { fallback },
);

export const ConnectWalletPage = lazyLoad(
  () => import("./connect-wallet"),
  module => module.default,
  { fallback },
);

export const EmojicoinPage = lazyLoad(
  () => import("./emojicoin"),
  module => module.default,
  { fallback },
);

export const LaunchEmojicoinPage = lazyLoad(
  () => import("./launch-emojicoin"),
  module => module.default,
  { fallback },
);

export const PoolsPage = lazyLoad(
  () => import("./pools"),
  module => module.default,
  { fallback },
);
