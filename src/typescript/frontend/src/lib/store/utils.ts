import type { SubscribeBarsCallback } from "@static/charting_library";
import type { WritableDraft } from "immer";

import type { LatestBar } from "./event/candlestick-bars";
import type { CandlestickData } from "./event/types";

export const createInitialCandlestickData = (): WritableDraft<CandlestickData> => ({
  callback: undefined,
  latestBar: undefined,
});

/**
 * A helper function to clone the latest bar and call the callback with it. This is necessary
 * because the TradingView SubscribeBarsCallback function (cb) will mutate the object passed to it.
 * This for some reason causes issues with zustand, so we have this function as a workaround.
 * @param cb the SubscribeBarsCallback to call, from the TradingView charting API
 * @param latestBar the latest bar to clone and pass to the callback. We reduce the scope/type to
 * only the fields that the callback needs, aka `Bar`, a subset of `LatestBar`.
 */
export const callbackClonedLatestBarIfSubscribed = (
  cb: SubscribeBarsCallback | undefined,
  latestBar: WritableDraft<LatestBar>
) => {
  if (cb) {
    cb({
      // NOTE: Do _not_ alter or normalize any data here- this is solely to clone the bar data.
      // The data should already be in its end format by the time it gets to this function.
      time: latestBar.time,
      open: latestBar.open,
      high: latestBar.high,
      low: latestBar.low,
      close: latestBar.close,
      volume: latestBar.volume,
    });
  }
};
