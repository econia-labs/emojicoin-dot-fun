import type { EmojiMartData } from "components/pages/emoji-picker/types";

/**
 * Some of the emojis in the larger set of chat emojis are not included by default in the emoji-mart
 * data. If there's ever a desire to replace the data with the complete set of emoji data, this
 * function can be filled out instead of being a stub.
 *
 * For example: "handshake: medium-light skin tone, medium-dark skin tone"
 */
export const completePickerData = (data: EmojiMartData): EmojiMartData => data;
