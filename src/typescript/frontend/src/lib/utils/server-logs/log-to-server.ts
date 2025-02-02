"use server";
import { type logToServer } from "./wrapper";

/**
 * This function is *NOT* intended to be called directly.
 *
 * Please call the wrapper function @see {@link logToServer} instead.
 */
export const doNotCallThisFunctionDirectly_serverSideLog = async (
  stringified: ReturnType<typeof logToServer>
) => {
  /* eslint-disable-next-line no-console */
  console.log(stringified, null, 2);
};
