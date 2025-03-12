import path from "path";
import { getGitRoot } from "../../../sdk/tests/utils/helpers";
import { ROUTES } from "../../src/router/routes";
import fs from "fs";

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

const walkDir = <T extends Record<string, any> | string>(
  currValue: T,
  currPath: string
): boolean => {
  expect(typeof currValue === "string" || typeof currValue === "object").toBe(true);
  if (typeof currValue === "string") {
    const newPath = path.join(currPath, currValue);
    return validateRoutePath(newPath);
  }

  return Object.values(currValue)
    .map((innerVal) => {
      const res = walkDir(innerVal, currPath);
      expect(res).toBe(true);
      return res;
    })
    .every((v) => v);
};

const gitRoot = getGitRoot();
const appPath = path.join(gitRoot, "src/typescript/frontend/src/app");
describe("verifies that the router structure indicated by the `ROUTES` const is valid", () => {
  it("ensures that all routes in `ROUTES` exist as a filepath", () => {
    expect(walkDir(ROUTES, appPath)).toBe(true);
  });
});
