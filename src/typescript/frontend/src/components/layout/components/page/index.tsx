"use client";

import type { PropsWithChildren } from "react";
import React from "react";

import { Container } from "@/containers";

export const Page: React.FC<PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>> = ({
  children,
  ...props
}) => {
  return <Container {...props}>{children}</Container>;
};
