import React, { lazy, Suspense } from "react";
import { Loader } from "components";

interface Opts {
  fallback: React.ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const lazyLoad = <T extends Promise<{ default: U }>, U extends React.ComponentType<any>>(
  importFunc: () => T,
  selectorFunc?: (s: { default: U }) => U,
  opts: Opts = { fallback: <Loader /> },
) => {
  let lazyFactory: () => Promise<{ default: U }> = importFunc;

  if (selectorFunc) {
    lazyFactory = () => importFunc().then(module => ({ default: selectorFunc(module) }));
  }

  const LazyComponent = lazy(lazyFactory);

  const LazyLoader = (props: React.ComponentProps<U>): JSX.Element => {
    if (opts.fallback) {
      return (
        <Suspense fallback={opts.fallback}>
          <LazyComponent {...props} />
        </Suspense>
      );
    } else {
      return <LazyComponent {...props} />;
    }
  };

  return LazyLoader;
};
