import path from "path";
import { getGitRoot } from "../utils/helpers";

describe("ensures find git root works as expected", () => {
  it("should find the correct git root", () => {
    const gitRoot = getGitRoot();
    const cwd = process.cwd();
    const gitRootWithCurrentDirectory = path.join(gitRoot, "src/typescript/sdk");
    expect(path.resolve(gitRootWithCurrentDirectory)).toBe(cwd);
  });
});
