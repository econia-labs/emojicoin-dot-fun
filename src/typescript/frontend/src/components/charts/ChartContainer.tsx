// cspell:word datafeeds
import Script from "next/script";
import { type ChartContainerProps } from "./types";
import React, { Suspense } from "react";
import Loading from "components/loading";
import PrivateChart from "./PrivateChart";

const MemoizedChart = React.memo(PrivateChart);

export const ChartContainer = (props: ChartContainerProps) => {
  const [isScriptReady, setIsScriptReady] = React.useState(false);

  return (
    <>
      {isScriptReady && (
        <Suspense fallback={<Loading emojis={props.emojis} />}>
          <MemoizedChart
            symbol={props.symbol}
            secondarySymbol={props.secondarySymbol}
            className={props.className}
          />
        </Suspense>
      )}
      <Script
        src="/static/datafeeds/udf/dist/bundle.js"
        strategy="afterInteractive"
        onLoad={() => setIsScriptReady(true)}
        onReady={() => setIsScriptReady(true)}
        onError={(error) => {
          console.error("Error loading bundle.js", error);
        }}
      />
    </>
  );
};

export default ChartContainer;
