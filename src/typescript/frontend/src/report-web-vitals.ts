import { Metric } from "web-vitals";

const isDevelopment = process.env.NODE_ENV === "development";

const reportWebVitals = (onPerfEntry?: (metric: Metric) => void) => {
  if (isDevelopment) {
    import("web-vitals").then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // value is in ms
      // delta indicates the difference between the current value and a previous value.

      // CLS (Cumulative Layout Shift):
      getCLS(metric => {
        const { name, value } = metric;
        if (value > 0.25) {
          console.error(`${name} is poor:`, value);
        } else if (value > 0.1) {
          console.warn(`${name} needs improvement:`, value);
        } else {
          console.debug(`${name} is good:`, value);
        }
        onPerfEntry?.(metric);
      });
      // FID (First Input Delay):
      getFID(metric => {
        const { name, value } = metric;
        if (value > 300) {
          console.error(`${name} is poor:`, value);
        } else if (value > 100) {
          console.warn(`${name} needs improvement:`, value);
        } else {
          console.debug(`${name} is good:`, value);
        }

        onPerfEntry?.(metric);
      });
      // FCP (First Contentful Paint):
      getFCP(metric => {
        const { name, value } = metric;
        if (value > 3000) {
          console.error(`${name} is poor:`, value);
        } else if (value > 1800) {
          console.warn(`${name} needs improvement:`, value);
        } else {
          console.debug(`${name} is good:`, value);
        }

        onPerfEntry?.(metric);
      });
      // LCP (Largest Contentful Paint):
      getLCP(metric => {
        const { name, value } = metric;
        if (value > 4000) {
          console.error(`${name} is poor:`, value);
        } else if (value > 2500) {
          console.warn(`${name} needs improvement:`, value);
        } else {
          console.debug(`${name} is good:`, value);
        }

        onPerfEntry?.(metric);
      });
      // TTFB (Time To First Byte):
      // There isn't a specific threshold provided like the other metrics. However, a lower TTFB is generally better, aiming for values as low as possible, ideally within a few hundred milliseconds.
      getTTFB(metric => {
        const { name, value } = metric;
        console.debug(`${name}:`, value); // TTFB doesn't have specific thresholds

        onPerfEntry?.(metric);
      });
    });
  }
};

export default reportWebVitals;
