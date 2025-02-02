import { VERCEL } from "@sdk/const";
import { doNotCallThisFunctionDirectly_serverSideLog } from "./log-to-server";

// To avoid needless server POSTs, wrap the function with a check for whether or not the log
// should even be called based on the build environment.
export const serverLog = async (obj: object, logInProduction: boolean = false) => {
  const inProductionEnvironment = VERCEL || process.env.NODE_ENV === "production";
  if (!logInProduction && inProductionEnvironment) {
    return;
  }

  await doNotCallThisFunctionDirectly_serverSideLog(obj);
};
