"use client";

import React from "react";

import { Container } from "@/containers";

import type { PageProps } from "../types";

export const Page: React.FC<PageProps> = ({ children, ...props }) => {
  return (
    <>
      <Container {...props}>{children}</Container>
    </>
  );
};
