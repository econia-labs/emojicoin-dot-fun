import { toast } from "react-toastify";

import { translationFunction } from "context/language-context";
/**
 * Helps to copy content into click board
 */
const useCopyContent = () => {
  const { t } = translationFunction();

  const copyContentHandler = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("Copied"));
    } catch {
      toast.error(t("Fail to copy"));
    }
  };

  return { copyContentHandler };
};

export default useCopyContent;
