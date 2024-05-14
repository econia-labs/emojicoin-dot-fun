import { type Metadata } from "next";

export const DEFAULT_TITLE = "Econia Labs";

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
      description: "Econia labs project is in progress",
      images: "/logo512.png",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: DEFAULT_TITLE,
      description: "Econia labs project is in progress",
      images: "/logo512.png",
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/logo192.png",
    },
    manifest: "/manifest.json",
  };
};
