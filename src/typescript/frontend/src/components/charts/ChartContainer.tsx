// cspell:word datafeeds
import Script from "next/script";
import { type ChartContainerProps } from "./types";
import React, { Suspense, useEffect } from "react";
import { useWebSocketClient } from "context/state-store-context";
import Loading from "components/loading";
import PrivateChart from "./PrivateChart";
import FetchFromServer from "@store/server-to-client/FetchFromServer";

export const Chart = PrivateChart;
const MemoizedChart = React.memo(Chart);

export const ChartContainer = (props: Omit<ChartContainerProps, "isScriptReady">) => {
  const [isScriptReady, setIsScriptReady] = React.useState(false);
  const { subscribe, unsubscribe } = useWebSocketClient((s) => s);

  // For now, we subscribe to any periodic state event instead of just a specific resolution.
  // There isn't a good reason to do otherwise since this is just the websocket subscription and we
  // default to 5m candles, which will have more data than any resolution except for the 1 minute chart.
  useEffect(() => {
    subscribe.periodicState(props.marketID, null);
    return () => unsubscribe.periodicState(props.marketID, null);
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [props.marketID]);

  return (
    <>
      {isScriptReady && (
        <Suspense fallback={<Loading emojis={props.emojis} />}>
          <FetchFromServer />
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
