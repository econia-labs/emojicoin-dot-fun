import { VERCEL_TARGET_ENV } from "@sdk/const";
import { doNotCallThisFunctionDirectly_serverSideLog } from "./log-to-server";

// To avoid needless server POSTs, wrap the function with a check for whether or not the log
// should even be called based on the build environment.
export const serverLog = async (obj: object, logInProduction: boolean = false) => {
  if (!logInProduction && VERCEL_TARGET_ENV === "production") {
    return;
  }

  await doNotCallThisFunctionDirectly_serverSideLog(obj);
};
