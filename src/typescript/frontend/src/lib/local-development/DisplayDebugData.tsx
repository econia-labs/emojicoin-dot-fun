"use client";

import { useUserSettings } from "context/event-store-context";
import InnerDisplayDebugData from "./inner";

export const DisplayDebugData = () => {
  const devMode = useUserSettings((s) => s.devMode);
  return <>{devMode && <InnerDisplayDebugData />}</>;
};

export default DisplayDebugData;
