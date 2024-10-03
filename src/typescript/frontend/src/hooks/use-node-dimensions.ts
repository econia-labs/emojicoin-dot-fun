import { useState, useEffect, RefObject } from 'react';

function getNodeDimensions(ref: RefObject<HTMLElement>) {
  if (ref.current) {
    const { width, height } = ref.current.getBoundingClientRect();
    return {
      width,
      height
    };
  }
  return {
    width: 0,
    height: 0,
  };
}

export default function useNodeDimensions(ref: RefObject<HTMLElement>) {
  const [windowDimensions, setWindowDimensions] = useState(getNodeDimensions(ref));

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getNodeDimensions(ref));
    }

    const element = ref?.current;

    if(!element) return;

    const observer = new ResizeObserver(handleResize);

    observer.observe(element);

    return () => {
      observer.disconnect();
    }
  }, [ref]);

  return windowDimensions;
}
