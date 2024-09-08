// cspell:word Featureset
// cspell:word localstorage

import {
  type ChartingLibraryFeatureset,
  type ChartingLibraryWidgetOptions,
  type LanguageCode,
  type ResolutionString,
  type ThemeName,
} from "@static/charting_library";
import { PeriodDuration } from "@econia-labs/emojicoin-sdk";
import { GREEN as GREEN_HEX, PINK as PINK_HEX } from "theme/colors";
import { hexToRgba } from "utils/hex-to-rgba";

export const TV_CHARTING_LIBRARY_RESOLUTIONS = ["1", "5", "15", "30", "60", "4H", "1D"];

export const PINK = hexToRgba(PINK_HEX);
export const GREEN = hexToRgba(GREEN_HEX);
export const PINK_OPACITY_HALF = hexToRgba(`${PINK_HEX}80`);
export const GREEN_OPACITY_HALF = hexToRgba(`${GREEN_HEX}80`);

export const ResolutionStringsToPeriodDuration: { [key: string]: PeriodDuration } = {
  "1D": PeriodDuration.PERIOD_1D,
  "30": PeriodDuration.PERIOD_30M,
  "60": PeriodDuration.PERIOD_1H,
  "15": PeriodDuration.PERIOD_15M,
  "240": PeriodDuration.PERIOD_4H,
  "5": PeriodDuration.PERIOD_5M,
  "1": PeriodDuration.PERIOD_1M,
};

export const MS_IN_ONE_DAY = 24 * 60 * 60 * 1000;

export const EXCHANGE_NAME = "emojicoin.fun";

export const WIDGET_OPTIONS: Omit<ChartingLibraryWidgetOptions, "datafeed" | "container"> = {
  interval: "5" as ResolutionString,
  library_path: "/static/charting_library/",
  theme: "Dark" as ThemeName,
  locale: "en" as LanguageCode,
  custom_css_url: "/styles/tradingview.css",
  disabled_features: [
    "use_localstorage_for_settings" as ChartingLibraryFeatureset,
    "left_toolbar" as ChartingLibraryFeatureset,
    "control_bar" as ChartingLibraryFeatureset,
    "study_templates" as ChartingLibraryFeatureset,
    "snapshot_trading_drawings" as ChartingLibraryFeatureset,
  ],
  fullscreen: false,
  autosize: true,
  loading_screen: { backgroundColor: "#000000" },
  overrides: {
    "paneProperties.backgroundType": "solid",
    "paneProperties.background": "#000000",
    "scalesProperties.backgroundColor": "#000000",
    "mainSeriesProperties.barStyle.upColor": GREEN,
    "mainSeriesProperties.barStyle.downColor": PINK,
    "mainSeriesProperties.candleStyle.upColor": GREEN,
    "mainSeriesProperties.candleStyle.downColor": PINK,
    "mainSeriesProperties.candleStyle.borderUpColor": GREEN,
    "mainSeriesProperties.candleStyle.borderDownColor": PINK,
    "mainSeriesProperties.candleStyle.wickUpColor": GREEN,
    "mainSeriesProperties.candleStyle.wickDownColor": PINK,
    "mainSeriesProperties.columnStyle.upColor": GREEN_OPACITY_HALF,
    "mainSeriesProperties.columnStyle.downColor": PINK_OPACITY_HALF,
    "mainSeriesProperties.hollowCandleStyle.upColor": GREEN,
    "mainSeriesProperties.hollowCandleStyle.downColor": PINK,
    "mainSeriesProperties.rangeStyle.upColor": GREEN,
    "mainSeriesProperties.rangeStyle.downColor": PINK,
    "paneProperties.legendProperties.showVolume": true,
  },
  studies_overrides: {
    "volume.volume.color.0": PINK_HEX,
    "volume.volume.color.1": GREEN_HEX,
  },
  time_frames: [
    {
      text: "1D",
      resolution: "1" as ResolutionString,
    },
    {
      text: "5D",
      resolution: "5" as ResolutionString,
    },
    {
      text: "1M",
      resolution: "30" as ResolutionString,
    },
    {
      text: "3M",
      resolution: "60" as ResolutionString,
    },
    {
      text: "6M",
      resolution: "120" as ResolutionString,
    },
    {
      text: "1y",
      resolution: "D" as ResolutionString,
    },
    {
      text: "5y",
      resolution: "W" as ResolutionString,
    },
    {
      text: "1000y",
      resolution: "1" as ResolutionString,
      description: "All",
      title: "All",
    },
  ],
};
