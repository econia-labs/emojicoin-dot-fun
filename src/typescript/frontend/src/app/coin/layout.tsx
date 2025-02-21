import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Coin Details",
  description: "Coin Details",
};

export default async function CoinLayout({ children }: Readonly<{ children: React.ReactNode }>): Promise<JSX.Element> {
  return (
    <>
      {children}
    </>
  );
}
