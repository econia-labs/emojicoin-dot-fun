import path from "path";
import fs from "fs";

export const ensureWriteFileSync = (filePath: string, contents: string) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
};
