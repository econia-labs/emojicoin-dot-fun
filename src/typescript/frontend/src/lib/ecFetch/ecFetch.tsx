import { parseJSON } from "utils";
import type { RequestInit } from "next/dist/server/web/spec-extension/request";

/**
 * ecFetch is an enhanced wrapper around the native fetch API that provides:
 *
 * 1. Type Safety:
 *    - Strongly typed HTTP methods
 *    - Generic response type inference
 *    - Proper typing for search parameters
 *
 * 2. Convenience Features:
 *    - Automatic JSON parsing with support for bigint and error handling
 *    - Built-in search params handling (supports string, Record, URLSearchParams)
 *    - Support for primitive types in search params (string, number, boolean)
 *
 * 3. Error Handling:
 *    - HTTP error detection with status codes
 *    - Detailed error messages including response text
 *    - JSON parsing error handling with descriptive messages
 *
 * This wrapper simplifies API calls while providing better type safety and error handling
 * than the native fetch API, reducing boilerplate and potential runtime errors.
 */

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

type PrimitiveValue = string | number | boolean | null | undefined;
type SearchParamsRecord = Record<string, PrimitiveValue | PrimitiveValue[]>;
type SearchParamsValue = string | SearchParamsRecord | URLSearchParams | string[][];

interface EcFetchInit extends Omit<RequestInit, "method" | "body"> {
  searchParams?: SearchParamsValue;
  method?: HttpMethod;
  /**
   * Base URL for relative paths (Required on server side)
   */
  baseURL?: string;
  /**
   * Request body with proper typing
   */
  body?: BodyInit | Record<string, unknown>;
}

/**
 * Creates a URL object from the input, handling relative paths.
 */
const createUrl = (input: string | URL | globalThis.Request, baseURL?: string): URL => {
  try {
    if (typeof input === "string") {
      try {
        return new URL(input);
      } catch {
        if (!baseURL && typeof window === "undefined") {
          throw new Error(`Invalid URL: ${input}. For relative paths, baseURL must be provided.`);
        }
        return new URL(input, baseURL || window.location.origin);
      }
    } else if (input instanceof URL) {
      return new URL(input.toString()); // Return a copy to avoid modifying the original
    } else if (input instanceof Request) {
      return new URL(input.url);
    } else {
      throw new Error("Invalid input: must be a string, URL, or Request");
    }
  } catch (error) {
    throw new Error(
      `Failed to create URL: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

/**
 * Adds search parameters to the URL.
 */
const addSearchParams = (url: URL, searchParams?: SearchParamsValue): URL => {
  if (!searchParams) {
    return url;
  }

  const newUrl = new URL(url.href);
  let search: URLSearchParams;

  try {
    if (searchParams instanceof URLSearchParams) {
      search = new URLSearchParams(searchParams);
    } else if (typeof searchParams === "string" || Array.isArray(searchParams)) {
      search = new URLSearchParams(searchParams);
    } else {
      search = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((v) => {
            if (v !== undefined && v !== null) {
              search.append(key, String(v));
            }
          });
        } else {
          search.append(key, String(value));
        }
      });
    }

    newUrl.search = search.toString();
    return newUrl;
  } catch (error) {
    throw new Error(
      `Failed to add search parameters: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

/**
 * Enhanced fetch wrapper with built-in JSON handling and search params support
 * @template T - Response type from ResponseTypeMap
 * @param {string | URL | Request} input - URL or Request object
 * @param {EcFetchInit} [init] - Request configuration
 * @returns {Promise<T>} Parsed response data
 * @throws {EcFetchError} If the request fails or response cannot be parsed
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ecFetch = async <T extends Record<string, any>>(
  input: string | URL | globalThis.Request,
  init?: EcFetchInit
): Promise<T> => {
  const { searchParams, baseURL, body, ...rest } = { ...init };
  let url = createUrl(input, baseURL);
  url = addSearchParams(url, searchParams);

  // Handle body serialization for objects
  const requestInit: RequestInit = {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...rest.headers,
    },
    body:
      body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob)
        ? JSON.stringify(body)
        : (body as BodyInit),
  };

  const res = await fetch(url, requestInit);

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP error ${res.status}: ${errorText}`);
  }

  const text = await res.text();
  return parseJSON<T>(text);
};
