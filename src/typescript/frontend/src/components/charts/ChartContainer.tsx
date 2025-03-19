// cspell:word datafeeds
import Script from "next/script";
import { type ChartContainerProps } from "./types";
import React, { Suspense, useMemo } from "react";
import Loading from "components/loading";
import PrivateChart from "./PrivateChart";
import { symbolToEmojis } from "@econia-labs/emojicoin-sdk";

const MemoizedChart = React.memo(PrivateChart);

export const ChartContainer = (props: ChartContainerProps) => {
  const [isScriptReady, setIsScriptReady] = React.useState(false);

  const emojiData = useMemo(
    () =>
      [props.symbol, props.secondarySymbol ?? ""]
        .map(symbolToEmojis)
        .map((v) => v.emojis)
        .flat(),
    [props.symbol, props.secondarySymbol]
  );

  return (
    <>
      {isScriptReady && (
        <Suspense fallback={<Loading emojis={emojiData} />}>
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
