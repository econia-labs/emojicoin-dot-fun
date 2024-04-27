import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

import { getCustomMeta, languageList, EN } from "configs";
import { Container } from "../container";
import { useTranslation } from "context";
import { cutLocaleFromRoute, removeTrailingSlashIfExists } from "utils";

import { PageProps } from "../types";

export const PageMeta: React.FC = () => {
  const { pathname } = useLocation();
  const { t, currentLanguage } = useTranslation();

  const { title, description, image, keywords } = getCustomMeta(pathname, t);
  const correctPath = cutLocaleFromRoute(pathname);

  return (
    <Helmet>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content={currentLanguage.locale} />

      <link rel="canonical" href={`${process.env.REACT_APP_URL}${removeTrailingSlashIfExists(pathname)}`} />
      <link
        rel="alternate"
        href={`${process.env.REACT_APP_URL}${removeTrailingSlashIfExists(pathname)}`}
        hrefLang="x-default"
      />

      {languageList.map(({ locale }) => {
        const languageCode = locale === EN.locale ? "" : `/${locale}`;
        const href = `${process.env.REACT_APP_URL}${languageCode}${removeTrailingSlashIfExists(correctPath)}`;

        return <link key={locale} rel="alternate" href={href} hrefLang={locale} />;
      })}

      <title>{title}</title>
    </Helmet>
  );
};

export const Page: React.FC<PageProps> = ({ children, ...props }) => {
  return (
    <>
      <PageMeta />
      <Container {...props}>{children}</Container>
    </>
  );
};
