import { runWriteFile } from "./logic";
import brief from "./write_file.brief.xnl";
import detail from "./write_file.detail.xnl";

export const namespace = "SysBuiltIn";
export const name = "write_file";
export { brief, detail };
export const handler = runWriteFile;
