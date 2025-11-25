import { runReadFile } from "./logic";
import brief from "./read_file.brief.xnl";
import detail from "./read_file.detail.xnl";

export const namespace = "SysBuiltIn";
export const name = "read_file";
export { brief, detail };
export const handler = runReadFile;
