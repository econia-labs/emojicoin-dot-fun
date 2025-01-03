"use client";

import { createContext, type PropsWithChildren, useContext } from "react";

export const AptPriceContext = createContext<number | undefined>(undefined);

export function AptPriceContextProvider({
  aptPrice,
  children,
}: PropsWithChildren<{ aptPrice: number | undefined }>) {
  return <AptPriceContext.Provider value={aptPrice}>{children}</AptPriceContext.Provider>;
}

export const useAptPrice = (): number | undefined => {
  const context = useContext(AptPriceContext);
  if (context === null) {
    throw new Error("useAptPrice must be used within a AptPriceContext.");
  }
  return context;
};
