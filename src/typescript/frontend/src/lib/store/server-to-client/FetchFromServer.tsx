"use client";

import StoreOnClient from "./StoreOnClient";

export const DisplayDebugData = () => {
  return <>{process.env.NODE_ENV === "development" && <StoreOnClient />}</>;
};

export default DisplayDebugData;
