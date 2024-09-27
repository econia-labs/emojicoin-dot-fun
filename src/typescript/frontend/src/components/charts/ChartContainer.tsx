// cspell:word datafeeds
import Script from "next/script";
import { type ChartContainerProps } from "./types";
import React, { Suspense } from "react";
import Loading from "components/loading";
import PrivateChart from "./PrivateChart";

export const Chart = PrivateChart;
const MemoizedChart = React.memo(Chart);

export const ChartContainer = (props: Omit<ChartContainerProps, "isScriptReady">) => {
  const [isScriptReady, setIsScriptReady] = React.useState(false);

  return (
    <>
      {isScriptReady && (
        <Suspense fallback={<Loading emojis={props.emojis} />}>
          <MemoizedChart
            marketID={props.marketID}
            emojis={props.emojis}
            marketAddress={props.marketAddress}
            symbol={props.symbol}
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
      ;
    </>
  );
};

export default ChartContainer;
