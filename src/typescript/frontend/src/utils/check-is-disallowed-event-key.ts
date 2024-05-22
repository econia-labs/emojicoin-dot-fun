export const ALLOWED_KEYBOARD_EVENT_KEYS = new Set(["Backspace", "ArrowLeft", "ArrowRight", "Delete"]);

export const isDisallowedEventKey = (
  event: KeyboardEvent | React.KeyboardEvent<HTMLTextAreaElement> | React.KeyboardEvent<HTMLInputElement>,
  keysList: Set<string> = ALLOWED_KEYBOARD_EVENT_KEYS,
): boolean => {
  return !keysList.has(event.key);
};
