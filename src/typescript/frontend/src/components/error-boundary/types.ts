import { PropsWithChildren } from "react";

export interface ErrorBoundaryProps
  extends PropsWithChildren<{
    fallbackComponent: React.ComponentType<ErrorBoundaryFallbackProps>;
  }> {}
export interface ErrorBoundaryState {
  error: null | Error;
}

export type ErrorBoundaryFallbackProps = {
  error?: ErrorBoundaryState["error"];
  resetError?: () => void;
};
