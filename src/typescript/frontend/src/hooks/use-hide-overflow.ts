import { useEffect } from "react";

const useHideOverflow = ({ trigger }: { trigger: boolean }) => {
  useEffect(() => {
    if (trigger) {
      document.body.style.overflowY = "hidden";
    } else {
      document.body.style.overflowY = "auto";
    }

    return () => {
      document.body.style.overflowY = "auto";
    };
  }, [trigger]);
};

export default useHideOverflow;
