export const checkTargetAndStopDefaultPropagation = (
  e: React.BaseSyntheticEvent,
  textArea: HTMLElement | null
) => {
  if (e.target === textArea) {
    e.preventDefault();
    e.stopPropagation();
    return textArea as HTMLTextAreaElement;
  }
  return;
};
