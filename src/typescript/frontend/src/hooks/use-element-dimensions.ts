import { useEffect, useState } from "react";

const useElementDimensions = (id: string) => {
  const [elementSize, setElementSize] = useState({ offsetHeight: 0, offsetWidth: 0 });

  useEffect(() => {
    updateElementSize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const updateElementSize = () => {
    const { offsetHeight, offsetWidth } = document.getElementById(id) ?? { offsetHeight: 0, offsetWidth: 0 };
    setElementSize({ offsetHeight, offsetWidth });
  };

  const handleResize = () => {
    // Need to use timeout, because after resize header height is includes mobile header height and desktop header height
    setTimeout(() => {
      updateElementSize();
    }, 500);
  };

  return elementSize;
};

export default useElementDimensions;
