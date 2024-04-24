import findGitRoot from "find-git-root";
import path from "path";

// findGitRoot returns the path to the closest .git directory.
// We return the path to the root of the repository by removing
// the .git directory from the path.
export function getGitRoot(): string {
  const gitRoot = findGitRoot(process.cwd());
  return path.dirname(gitRoot);
}
