import { useEffect, useState } from "react";
import { breakpointMap } from "theme/base";
import { MediaQueries } from "theme/types";

type State = {
  [key: string]: boolean;
};

const mediaQueries: MediaQueries = (() => {
  let prevMinWidth = 0;
  let prevSize = Object.keys(breakpointMap)[0];

  return (Object.keys(breakpointMap) as Array<keyof typeof breakpointMap>).reduce((accum, size, index) => {
    const minWidth = prevMinWidth;
    const sizeToSet = prevSize;
    const breakpoint = breakpointMap[size] - 1;

    // Min width for next iteration
    prevMinWidth = breakpointMap[size];
    // sizeToSet for next iteration
    prevSize = size;

    // When sizeToSet is the smallest size, min width has to be 0
    if (sizeToSet === Object.keys(breakpointMap)[0]) {
      return { ...accum, [sizeToSet]: `(min-width: ${0}px) and (max-width: ${breakpoint}px)` };
    }

    // Largest size in the last iteration, except setting sizeToSet, also has to set last mediaQuery with only a min-width breakpoint
    if (index === Object.keys(breakpointMap).length - 1) {
      return {
        ...accum,
        [sizeToSet]: `(min-width: ${minWidth}px) and (max-width: ${breakpoint}px)`,
        [size]: `(min-width: ${prevMinWidth}px)`,
      };
    }

    return { ...accum, [sizeToSet]: `(min-width: ${minWidth}px) and (max-width: ${breakpoint}px)` };
  }, {} as MediaQueries);
})();

// Returns from breakpoints xs => isXs
const getKey = (size: keyof MediaQueries) => `is${size.charAt(0).toUpperCase()}${size.slice(1)}`;

const getState = () => {
  const s = (Object.keys(mediaQueries) as Array<keyof MediaQueries>).reduce((accum, size) => {
    const key = getKey(size);
    if (typeof window === "undefined") {
      return {
        ...accum,
        [key]: false,
      };
    }

    const mql = typeof window?.matchMedia === "function" ? window.matchMedia(mediaQueries[size]) : null;

    return { ...accum, [key]: mql?.matches ?? false };
  }, {});
  return s;
};
/**
 * Is used to determine whether the screen width matches a given set of breakpoints.
 */
const useMatchBreakpoints = () => {
  const [state, setState] = useState<State>(() => getState());

  useEffect(() => {
    // Create listeners for each media query returning a function to unsubscribe
    const handlers = (Object.keys(mediaQueries) as Array<keyof MediaQueries>).map(size => {
      let mql: MediaQueryList;
      let handler: (matchMediaQuery: MediaQueryListEvent) => void;

      if (typeof window?.matchMedia === "function") {
        mql = window.matchMedia(mediaQueries[size]);

        handler = matchMediaQuery => {
          const key = getKey(size);
          setState(prevState => ({
            ...prevState,
            [key]: matchMediaQuery.matches,
          }));
        };

        // Safari < 14 fix
        if (mql.addEventListener) {
          mql.addEventListener("change", handler);
        }
      }

      return () => {
        // Safari < 14 fix
        if (mql?.removeEventListener) {
          mql.removeEventListener("change", handler);
        }
      };
    });

    setState(getState());

    return () => {
      handlers.forEach(unsubscribe => {
        unsubscribe();
      });
    };
  }, []);

  return {
    ...state,
    isMobile: state.isMobileS || state.isMobileM || state.isMobileL,
    isDesktop: state.isLaptop || state.isLaptopL,
    isTablet: state.isTablet,
  };
};

export default useMatchBreakpoints;
