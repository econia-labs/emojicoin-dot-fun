import {
  type ChartingLibraryFeatureset,
  type ChartingLibraryWidgetOptions,
  type LanguageCode,
  type ResolutionString,
  type ThemeName,
} from "@/static/charting_library";
import { CandlestickResolution } from "@econia-labs/emojicoin-sdk";

export const TV_CHARTING_LIBRARY_RESOLUTIONS = ["1", "5", "15", "30", "60", "4H", "1D"];

export const GREEN = "rgba(110, 213, 163, 1.0)";
export const RED = "rgba(240, 129, 129, 1.0)";
export const GREEN_OPACITY_HALF = "rgba(110, 213, 163, 0.5)";
export const RED_OPACITY_HALF = "rgba(240, 129, 129, 0.5)";

export const DAY_TO_CANDLESTICK_RESOLUTION: { [key: string]: CandlestickResolution } = {
  "1D": CandlestickResolution.PERIOD_1D,
  "30": CandlestickResolution.PERIOD_30M,
  "60": CandlestickResolution.PERIOD_1H,
  "15": CandlestickResolution.PERIOD_15M,
  "240": CandlestickResolution.PERIOD_4H,
  "5": CandlestickResolution.PERIOD_5M,
  "1": CandlestickResolution.PERIOD_1M,
};

export const DAY_BY_RESOLUTION: { [key: string]: ResolutionString } = {
  "1D": "86400" as ResolutionString,
  "30": "1800" as ResolutionString,
  "60": "3600" as ResolutionString,
  "15": "900" as ResolutionString,
  "240": "14400" as ResolutionString,
  "720": "43200" as ResolutionString,
  "5": "300" as ResolutionString,
  "1": "60" as ResolutionString,
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
    "mainSeriesProperties.barStyle.downColor": RED,
    "mainSeriesProperties.candleStyle.upColor": GREEN,
    "mainSeriesProperties.candleStyle.downColor": RED,
    "mainSeriesProperties.candleStyle.borderUpColor": GREEN,
    "mainSeriesProperties.candleStyle.borderDownColor": RED,
    "mainSeriesProperties.candleStyle.wickUpColor": GREEN,
    "mainSeriesProperties.candleStyle.wickDownColor": RED,
    "mainSeriesProperties.columnStyle.upColor": GREEN_OPACITY_HALF,
    "mainSeriesProperties.columnStyle.downColor": RED_OPACITY_HALF,
    "mainSeriesProperties.hollowCandleStyle.upColor": GREEN,
    "mainSeriesProperties.hollowCandleStyle.downColor": RED,
    "mainSeriesProperties.rangeStyle.upColor": GREEN,
    "mainSeriesProperties.rangeStyle.downColor": RED,
    "paneProperties.legendProperties.showVolume": true,
  },
  studies_overrides: {
    "volume.volume.color.0": RED_OPACITY_HALF,
    "volume.volume.color.1": GREEN_OPACITY_HALF,
  },
  time_frames: [
    {
      text: "1D",
      resolution: "1",
    },
    {
      text: "5D",
      resolution: "5",
    },
    {
      text: "1M",
      resolution: "30",
    },
    {
      text: "3M",
      resolution: "60",
    },
    {
      text: "6M",
      resolution: "120",
    },
    {
      text: "1y",
      resolution: "D",
    },
    {
      text: "5y",
      resolution: "W",
    },
    {
      text: "1000y",
      resolution: "1",
      description: "All",
      title: "All",
    },
  ].map(v => ({
    ...v,
    resolution: v.resolution as ResolutionString,
  })),
};
