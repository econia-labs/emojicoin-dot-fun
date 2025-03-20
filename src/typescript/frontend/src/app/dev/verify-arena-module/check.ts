import {
  ARENA_MODULE_ADDRESS,
  ARENA_MODULE_NAME,
  EmojicoinArena,
} from "@econia-labs/emojicoin-sdk";
import { toArenaRegistry } from "@sdk/types/arena-types";
import { getAptosClient } from "@sdk/utils";

const runArenaChecks = async () => {
  const aptos = getAptosClient();

  const check1 = await aptos
    .getAccountModule({
      accountAddress: ARENA_MODULE_ADDRESS,
      moduleName: ARENA_MODULE_NAME,
    })
    .then(({ abi }) => {
      if (abi === undefined) {
        return {
          failed: true,
          message: `Arena module doesn't exist at ${ARENA_MODULE_ADDRESS.toString()}::${ARENA_MODULE_NAME}`,
        } as const;
      }
    })
    .catch((e) => {
      return {
        failed: true,
        message: `Failed to fetch arena module info. Reason: ${e}`,
      } as const;
    });

  if (check1?.failed) {
    return check1;
  }

  const check2 = await EmojicoinArena.Registry.view({ aptos })
    .then(toArenaRegistry)
    .catch((e) => {
      return {
        failed: true,
        message: `Failed to fetch and parse the registry view function. ${e}`,
      } as const;
    });

  if (check2 && "failed" in check2 && check2.failed) {
    return check2;
  }

  return {
    failed: false,
  } as const;
};

export default runArenaChecks;
