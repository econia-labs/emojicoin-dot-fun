import fs from "fs";
import path from "path";

import { getGitRoot } from "../../../sdk/tests/utils/helpers";
import { ROUTES } from "../../src/router/routes";

/**
 * There are four basic structures employed by the nextjs file-based routing system.
 *
 * All file-based router paths in `/app` have exactly one of the following:
 * 1. A `page.tsx` file, aka the page to be displayed
 * 2. A `not-found.tsx` file, if a page isn't found for that route
 * 3. A `route.ts` file, a nextjs api route that handles requests
 * 4. A dynamic route: [param], where [param] follows all these rules.
 * 5. A catch all route: [...param], where [param] is a directory that follows all these rules.
 */
const validateRoutePath = (fullPath: string) => {
  if (fullPath.endsWith("/not-found")) {
    return fs.existsSync(`${fullPath}.tsx`);
  }
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
    console.error(fullPath);
    return false;
  }
  const files = fs.readdirSync(fullPath);
  const res =
    files.includes("page.tsx") ||
    files.includes("route.ts") ||
    files.some((file) => /^\[\w+\]$/.test(file)) ||
    files.some((file) => /^\[(\.{3})?\w+\]$/.test(file));
  return res;
};

/**
 * Any key: value in `ROUTES` that resembles ".": "/some/string" must not be a page and must be
 * a directory.
 *
 * @example
 * ROUTES.api["."] => /api
 */
const validateDotNotation = (currPath: string, newValue: string | object) => {
  const isString = typeof newValue === "string";
  expect(isString).toBe(true);
  if (!isString) throw new Error("Never.");
  const fullPath = path.join(currPath, newValue);
  const fullPathExists = fs.existsSync(fullPath);
  const isDirectory = fs.statSync(fullPath).isDirectory();
  expect(fullPathExists).toBe(true);
  expect(isDirectory).toBe(true);
  const files = fs.readdirSync(fullPath);
  const isNotPage = !files.includes("page.tsx");
  expect(isNotPage).toBe(true);
  return isString && fullPathExists && isDirectory && isNotPage;
};

type RecursiveObject = {
  [key: string]: string | RecursiveObject;
};

const walkDir = <T extends RecursiveObject | string>(currValue: T, currPath: string): boolean => {
  expect(typeof currValue === "string" || typeof currValue === "object").toBe(true);
  if (typeof currValue === "string") {
    const newPath = path.join(currPath, currValue);
    return validateRoutePath(newPath);
  }

  return (
    // Validate paths like ROUTES.api["."]
    Object.keys(currValue)
      .filter((k) => k === ".")
      .every((k) => validateDotNotation(currPath, currValue[k])) &&
    // Walk the dir for all other ROUTES values and validate with `walkDir`, recursively.
    Object.entries(currValue)
      .filter(([k, _v]) => k !== ".")
      .map(([_k, innerVal]) => {
        const res = walkDir(innerVal, currPath);
        expect(res).toBe(true);
        return res;
      })
      .every((v) => v)
  );
};

const gitRoot = getGitRoot();
const appPath = path.join(gitRoot, "src/typescript/frontend/src/app");
describe("verifies that the router structure indicated by the `ROUTES` const is valid", () => {
  it("ensures that all routes in `ROUTES` exist as a filepath", () => {
    expect(walkDir(ROUTES, appPath)).toBe(true);
  });
});
