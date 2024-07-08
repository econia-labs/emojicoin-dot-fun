"use client";

import React from "react";

import LoadingComponent from "components/loading";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { type EntryFunctionPayloadResponse, isUserTransactionResponse } from "@aptos-labs/ts-sdk";

export default function Loading() {
  const { status, lastResponse } = useAptos();
  const { response } = lastResponse ?? {};
  const isRegisterMarket =
    response &&
    isUserTransactionResponse(response) &&
    response.success &&
    (response.payload as EntryFunctionPayloadResponse).function.endsWith("::register_market");

  return (status === "pending" || status === "success") && isRegisterMarket ? (
    <LoadingComponent />
  ) : (
    <LoadingComponent />
  );
}
