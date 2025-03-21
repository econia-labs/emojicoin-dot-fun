"use client";

import { useDevMode } from "context/DevMode";
import InnerDisplayDebugData from "./inner";

export const DisplayDebugData = () => {
  const devMode = useDevMode();
  return <>{devMode && <InnerDisplayDebugData />}</>;
};

export default DisplayDebugData;
