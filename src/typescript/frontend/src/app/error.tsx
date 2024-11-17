"use client";

import { useEffect } from "react";
import Maintenance from "./maintenance/component";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <Maintenance />;
}
