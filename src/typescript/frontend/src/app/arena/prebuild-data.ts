import { getPrebuildFileData } from "lib/nextjs/prebuild";
import { IS_NEXT_BUILD_PHASE } from "lib/server-env";

import type { fetchCachedMeleeData } from "./fetch-melee-data";
import { convertJsonMeleeData, NO_MELEE_DATA } from "./fetch-melee-data";

export const maybeGetArenaPagePrebuildData = ():
  | Awaited<ReturnType<typeof fetchCachedMeleeData>>
  | undefined => {
  if (!IS_NEXT_BUILD_PHASE) return undefined;
  const data = getPrebuildFileData();
  if (!data) return undefined;
  if (!data.melee_data) return NO_MELEE_DATA;
  return convertJsonMeleeData(data.melee_data);
};
