"use client";

import InnerDisplayDebugData from "./StoreOnClient";

export const DisplayDebugData = () => {
  return <>{process.env.NODE_ENV === "development" && <InnerDisplayDebugData />}</>;
};

export default DisplayDebugData;
