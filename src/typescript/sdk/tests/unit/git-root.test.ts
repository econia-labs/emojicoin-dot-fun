import { getGitRoot } from "@econia-labs/emojicoin-test-utils";
import path from "path";

describe("ensures find git root works as expected", () => {
  it("should find the correct git root", () => {
    const gitRoot = getGitRoot();
    const cwd = process.cwd();
    const gitRootWithCurrentDirectory = path.join(gitRoot, "src/typescript/sdk");
    expect(path.resolve(gitRootWithCurrentDirectory)).toBe(cwd);
  });
});
