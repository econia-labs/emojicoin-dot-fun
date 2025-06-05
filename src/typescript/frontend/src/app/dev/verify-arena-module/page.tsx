import FEATURE_FLAGS from "lib/feature-flags";

import { VERCEL } from "@/sdk/const";

import runArenaChecks from "./check";

export const dynamic = "force-static";
export const revalidate = 600;
export const runtime = "nodejs";

/**
 * A build time check to ensure that `emojicoin_arena.move` has been published at NEXT_PUBLIC_ARENA_MODULE_ADDRESS if
 * the arena feature flag is enabled.
 */
const VerifyArenaModule = async () => {
  if (VERCEL === false) return <></>;
  /* eslint-disable-next-line no-console */

  if (FEATURE_FLAGS.Arena) {
    const check = await runArenaChecks();
    if (check.failed) {
      throw new Error(`Failed arena check: ${check.message}`);
    }
  }

  return (
    <div className="bg-black w-full h-full m-auto pixel-heading-2">
      {FEATURE_FLAGS.Arena ? "LGTM" : "Arena isn't enabled!"}
    </div>
  );
};

export default VerifyArenaModule;
