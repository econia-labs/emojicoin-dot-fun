"use client";

import StoreOnClient from "./StoreOnClient";

export const DisplayMarketData = () => {
  return <>{process.env.NODE_ENV === "development" && <StoreOnClient />}</>;
};

export default DisplayMarketData;
