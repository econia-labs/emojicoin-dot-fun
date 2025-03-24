"use client";

import Loading from "app/loading";
import "joule-cc-swap/styles.css";
import dynamic from "next/dynamic";

const ProviderWrapper = dynamic(() => import("joule-cc-swap").then((res) => res.ProviderWrapper), {
  loading: () => <Loading />,
});
const Bridge = dynamic(() => import("joule-cc-swap").then((res) => res.Bridge), {
  loading: () => <Loading />,
});

export default function BridgeClientPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <ProviderWrapper>
        <Bridge></Bridge>
      </ProviderWrapper>
    </div>
  );
}
