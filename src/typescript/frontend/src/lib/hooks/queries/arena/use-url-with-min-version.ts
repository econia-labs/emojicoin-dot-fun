import { useMemo } from "react";
import { addSearchParams } from "utils/url-utils";

import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import useLatestMeleeData from "@/hooks/use-latest-melee-event";

/**
 * Consolidate the logic for using a new version here and interpolating it into the search params.
 * @returns the search params to be used, based on the `baseUrl` passed in
 * Doesn't add any search params if there's no version to wait for.
 */
export function useRouteWithMinimumVersion(baseUrl: string) {
  const { latestMeleeEvent } = useLatestMeleeData();
  const { meleeInfo } = useCurrentMeleeInfo();

  return useMemo(() => {
    if (!latestMeleeEvent || !meleeInfo) {
      return {
        url: baseUrl,
        minimumVersion: undefined,
      };
    }

    const latestMeleeID = latestMeleeEvent.melee.meleeID;
    const currentMeleeID = meleeInfo.meleeID;
    const { version } = latestMeleeEvent.transaction;
    const newMeleeVersion = latestMeleeID > currentMeleeID ? version.toString() : undefined;

    const url = newMeleeVersion
      ? addSearchParams(baseUrl, { minimumVersion: newMeleeVersion })
      : baseUrl;

    return {
      url,
      minimumVersion: newMeleeVersion,
    };
  }, [baseUrl, latestMeleeEvent, meleeInfo]);
}
