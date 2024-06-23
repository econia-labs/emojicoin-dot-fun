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

  useEffect(() => {
    // For now just subscribe to all periodic state events instead of a sub-period.
    // TODO: Consider subscribing only to specific periods.
    subscribe.periodicState(props.marketID, null);
    return () => unsubscribe.periodicState(props.marketID, null);
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [props.marketID]);

  return (
    <>
      {isScriptReady && marketMetadataMap.size && allMarketSymbols.size ? (
        <MemoizedChart
          marketID={props.marketID}
          emojis={props.emojis}
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
