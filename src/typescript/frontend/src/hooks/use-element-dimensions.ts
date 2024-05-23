import { useCallback, useEffect, useState } from "react";

const useElementDimensions = (id: string) => {
  const [elementSize, setElementSize] = useState({ offsetHeight: 0, offsetWidth: 0 });

  const updateElementSize = useCallback(() => {
    const element = document.getElementById(id);
    if (element) {
      setElementSize({
        offsetHeight: element.offsetHeight,
        offsetWidth: element.offsetWidth,
      });
    }
  }, [id]);

  const handleResize = useCallback(() => {
    setTimeout(() => {
      updateElementSize();
    }, 500);
  }, [updateElementSize]);

  useEffect(() => {
    updateElementSize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [updateElementSize, handleResize]);

  return elementSize;
};

export default useElementDimensions;
