"use client";

import StoreOnClient from "./StoreOnClient";

export const DisplayMarketData = async () => {
  return <>{process.env.NODE_ENV === "development" && <StoreOnClient />}</>;
};

export default DisplayMarketData;
