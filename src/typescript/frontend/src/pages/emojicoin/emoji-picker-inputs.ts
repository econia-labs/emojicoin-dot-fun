
export const ALLOWED_KEYBOARD_EVENT_KEYS = new Set([
    "Backspace",
    "ArrowLeft",
    "ArrowRight",
    "Delete",
]);

export const isDisallowedEventKey = (event: KeyboardEvent | React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
    return !ALLOWED_KEYBOARD_EVENT_KEYS.has(event.key);
}
