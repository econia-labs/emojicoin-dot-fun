import { type Metadata } from "next";

export const DEFAULT_TITLE = "Emojicoin";
export const OG_DESC = "Econia labs project is in progress";
export const OG_IMAGES = "/social-preview.png";
export const OG_TYPE = "website";
export const TWITTER_CARD = "summary";
export const TWITTER_DESC = "Econia labs project is in progress";
export const TWITTER_IMAGES = "/social-preview.png";

export const getDefaultMetadata = (): Metadata => {
  /**
   * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata#default-value
   */
  const productionDefault = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const previewDefault = process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL;
  const localDefault = `http://localhost:${process.env.PORT || 3000}`;

  let metadataBase: URL;
  if (!(productionDefault || previewDefault)) {
    metadataBase = new URL(localDefault);
  } else {
    metadataBase = new URL(`https://${productionDefault ?? previewDefault}`);
  }

  return {
    metadataBase,
    alternates: {
      canonical: "/",
    },
    authors: {
      name: "idealogic.dev",
      url: "https://idealogic.dev",
    },
    title: DEFAULT_TITLE,
    description: "Econia labs project is in progress",
    keywords: "aptos, tokens, emoji, emojicoins",
    openGraph: {
      title: DEFAULT_TITLE,
      description: OG_DESC,
      images: OG_IMAGES,
      type: OG_TYPE,
    },
    twitter: {
      card: TWITTER_CARD,
      title: DEFAULT_TITLE,
      description: TWITTER_DESC,
      images: TWITTER_IMAGES,
    },
    icons: {
      icon: "/icon.png",
      shortcut: "/icon.png",
      apple: "/icon.png",
    },
    manifest: "/manifest.json",
  };
};
