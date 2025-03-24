import fs from "fs";
import path from "path";

export const ensureWriteFileSync = (filePath: string, contents: string) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
};
