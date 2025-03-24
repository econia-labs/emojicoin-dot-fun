"use client";

import { Container } from "@containers";
import React from "react";

import type { PageProps } from "../types";

export const Page: React.FC<PageProps> = ({ children, ...props }) => {
  return (
    <>
      <Container {...props}>{children}</Container>
    </>
  );
};
