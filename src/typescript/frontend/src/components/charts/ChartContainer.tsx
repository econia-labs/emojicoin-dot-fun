// cspell:word datafeeds
import Script from "next/script";
import { type ChartContainerProps } from "./types";
import dynamic from "next/dynamic";
import React from "react";

// TODO: Remove ssr? Only adding to avoid the annoying async client component error that takes up 70% of my console.
const Chart = dynamic(() => import("./PrivateChart"), { ssr: true });

export const ChartContainer = (props: Omit<ChartContainerProps, "isScriptReady">) => {
  const [isScriptReady, setIsScriptReady] = React.useState(false);

  return (
    <>
      {isScriptReady ? <Chart {...props} isScriptReady={isScriptReady} /> : <>Loading...</>}
      <Script
        src="/static/datafeeds/udf/dist/bundle.js"
        strategy="lazyOnload"
        onLoad={() => {
          setIsScriptReady(true);
        }}
      />
      ;
    </>
  );
};

export default ChartContainer;
