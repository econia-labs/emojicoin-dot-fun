// cspell:word datafeeds
import { symbolToEmojis } from "@sdk/emoji_data/utils";
import Loading from "components/loading";
import Script from "next/script";
import React, { Suspense, useMemo } from "react";

import PrivateChart from "./PrivateChart";
import type { ChartContainerProps } from "./types";

const MemoizedChart = React.memo(PrivateChart);

const ChartContainer = (props: ChartContainerProps) => {
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
