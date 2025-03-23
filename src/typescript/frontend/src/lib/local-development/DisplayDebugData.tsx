"use client";

import InnerDisplayDebugData from "./inner";

const DisplayDebugData = () => {
  return <>{process.env.NODE_ENV === "development" && <InnerDisplayDebugData />}</>;
};

export default DisplayDebugData;
