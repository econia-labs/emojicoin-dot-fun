"use client";
// Error components must be client components. This is the only component
// in this folder that is a client component.

import { ErrorBoundaryFallback } from "components/error-boundary";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundaryFallback error={error} resetError={reset} />;
}
