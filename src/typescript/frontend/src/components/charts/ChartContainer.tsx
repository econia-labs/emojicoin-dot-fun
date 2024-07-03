// cspell:word datafeeds
import Script from "next/script";
import { type ChartContainerProps } from "./types";
import dynamic from "next/dynamic";
import React, { useEffect } from "react";
import { useEventStore, useWebSocketClient } from "context/websockets-context";

const Chart = dynamic(() => import("./PrivateChart"), { ssr: true });
const MemoizedChart = React.memo(Chart);

export const ChartContainer = (props: Omit<ChartContainerProps, "isScriptReady">) => {
  const [isScriptReady, setIsScriptReady] = React.useState(false);
  const marketMetadataMap = useEventStore((s) => s.marketMetadataMap);
  const allMarketSymbols = useEventStore((s) => s.symbols);
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
      {isScriptReady ? (
        <MemoizedChart
          marketID={props.marketID}
          emojis={props.emojis}
          marketAddress={props.marketAddress}
          markets={marketMetadataMap}
          symbols={allMarketSymbols}
          symbol={props.symbol}
          isScriptReady={isScriptReady}
        />
      ) : (
        <>Loading...</>
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
