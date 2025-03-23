import { cache } from "react";

const fetchLocale = cache(async (locale: string) => {
  try {
    const response = await fetch(`/locales/${locale}.json`);

    const data = await response.json();
    return data;
  } catch (e) {
    console.error(`Failed to fetch locale ${locale}`, e);

    return null;
  }
});

export default fetchLocale;
