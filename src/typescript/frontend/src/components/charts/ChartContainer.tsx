// cspell:word datafeeds
import Script from "next/script";
import { type ChartContainerProps } from "./types";
import React, { Suspense, useEffect } from "react";
import { useEventStore, useWebSocketClient } from "context/state-store-context";
import Loading from "components/loading";
import PrivateChart from "./PrivateChart";
import fetchAggregateMarkets from "lib/queries/initial/aggregate-markets";
import { useReliableSubscribe } from "@hooks/use-reliable-subscribe";

export const Chart = PrivateChart;
const MemoizedChart = React.memo(Chart);

export const ChartContainer = (props: Omit<ChartContainerProps, "isScriptReady">) => {
  const [isScriptReady, setIsScriptReady] = React.useState(false);
  const [isMarketDataReady, setIsMarketDataReady] = React.useState(false);

  const initialize = useEventStore((s) => s.initializeRegisteredMarketsMap);

  useEffect(() => {
    fetchAggregateMarkets()
      .then(({ markets }) => {
        initialize(markets);
        // Let state propagate so that the chart doesn't re-render before the data is fully loaded into state.
        setTimeout(() => {
          setIsMarketDataReady(true);
        }, 100);
      })
      .catch((_error) => {
        setIsMarketDataReady(true);
      });
  }, [initialize]);

  // For now, we subscribe to any periodic state event instead of just a specific resolution.
  // There isn't a good reason to do otherwise since this is just the websocket subscription and we
  // default to 5m candles, which will have more data than any resolution except for the 1 minute chart.
  useReliableSubscribe({
    periodicState: [props.marketID, null],
  });

  return (
    <>
      {isScriptReady && isMarketDataReady && (
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
