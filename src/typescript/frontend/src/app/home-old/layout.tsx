import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "VMC",
  description: "VMC",
};

export default async function HomeLayout({ children }: Readonly<{
  children: React.ReactNode;
}>): Promise<JSX.Element> {
  return (
    <>
      {children}
    </>
  );
}
