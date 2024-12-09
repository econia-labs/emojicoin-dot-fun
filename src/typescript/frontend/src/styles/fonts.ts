// cspell:word noto
import localFont from "next/font/local";
import { Noto_Color_Emoji } from "next/font/google";

export const pixelar = localFont({
  src: "../../public/fonts/Pixelar-Regular.woff2",
  display: "swap",
  weight: "400",
  style: "normal",
  variable: "--font-pixelar",
});

export const formaDJRMicro = localFont({
  src: "../../public/fonts/FormaDJRMicro-Regular-Testing.woff2",
  display: "swap",
  weight: "400",
  style: "normal",
  variable: "--font-forma",
});

export const formaDJRDisplayMedium = localFont({
  src: "../../public/fonts/FormaDJRDisplay-Medium-Testing.woff2",
  display: "swap",
  weight: "400",
  style: "normal",
  variable: "--font-formaM",
});

export const formaDJRDisplayRegular = localFont({
  src: "../../public/fonts/FormaDJRDisplay-Regular-Testing.woff2",
  display: "swap",
  weight: "400",
  style: "normal",
  variable: "--font-formaDR",
});

export const notoColorEmoji = Noto_Color_Emoji({
  weight: "400",
  subsets: ["emoji"],
  preload: true,
  variable: "--font-noto-color-emoji"
});
