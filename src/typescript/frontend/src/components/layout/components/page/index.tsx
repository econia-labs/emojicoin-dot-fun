"use client";

import React from "react";

import { languageList, EN } from "configs";
import { Container } from "@/containers";

import { type PageProps } from "../types";
import { DEFAULT_TITLE, getDefaultMetadata } from "configs/meta";
import { getLanguageCodeFromLocalStorage } from "context/language-context/helpers";
import { type ResolvingMetadata, type Metadata } from "next";
import { type AlternateLinkDescriptor } from "next/dist/lib/metadata/types/alternative-urls-types";
import translateWithDefault from "lib/translate-with-default";

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

type Languages = {
  [key: string]: null | string | URL | AlternateLinkDescriptor[];
};

/**
 * This function is declared here but must be called in the page component
 * that it's supposed to use.
 *
 * @example
 * // You must declare this in the component's file.
 * export async function generateMetadata = getGenerateMetadataFunction;
 *
 * // Note that it is NOT a function call:
 * // export async function generateMetadata = getGenerateMetadataFunction(); // <-- No.
 *
 */
export async function getGenerateMetadataFunction(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const [_, __] = [searchParams, parent];

  /**
   * The `params` object is empty when the page is the homepage.
   * Make sure this is correct later, the docs seem out of date.
   * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata#parameters
   */

  const languages: Languages = {};

  languageList.map(({ locale }) => {
    const languageCode = locale === EN.locale ? "" : `/${locale}`;
    languages[locale] = new URL("/" + languageCode + params.id);
  });

  const defaultMetadata = getDefaultMetadata();

  const translatedTitle = await (params.id ? translateWithDefault("Home") : translateWithDefault(DEFAULT_TITLE));

  return {
    ...defaultMetadata,
    title: translatedTitle,
    openGraph: {
      locale: getLanguageCodeFromLocalStorage(),
    },
    /**
     * @see Metadata.alternates
     */
    alternates: {
      canonical: params.id + "/", // TODO: Ensure this is correct.
      languages,
    },
  };
}

export const Page: React.FC<PageProps> = ({ children, ...props }) => {
  return (
    <>
      <Container {...props}>{children}</Container>
    </>
  );
};
