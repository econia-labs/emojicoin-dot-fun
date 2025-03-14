"use client";

import { Bridge, ProviderWrapper } from "joule-cc-swap";
import "joule-cc-swap/styles.css";

export default function BridgeClientPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <ProviderWrapper>
        <Bridge></Bridge>
      </ProviderWrapper>
    </div>
  );
}
