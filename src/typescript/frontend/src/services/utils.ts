"use client";

import { simpleTranslation } from "context/language-context";
import { type ErrorResult } from "./types";

// TODO: check do we need axios error handlers if we will use GraphQL
// If we will use it put strings from translate functions into vocabulary
export const isErrorResult = (result: unknown): result is ErrorResult => {
  return (
    typeof result === "object" &&
    result !== null &&
    "isError" in result &&
    (result as Record<string, unknown>).isError === true
  );
};

export const replaceWithNewErrorMessages = (error: unknown) => {
  if ((error as { code: string })?.code === "ERR_NETWORK") {
    return `${simpleTranslation("Server is not responding.")} ${simpleTranslation("Check the internet connection and try again.")}`;
  } else if ((error as { code: string })?.code === "ECONNABORTED") {
    return `${simpleTranslation("Your request exceeded the time limit for processing.")} ${simpleTranslation(
      "Check the internet connection and try again.",
    )}`;
  } else return (error as { message: string }).message;
};
