import { runBash } from "./logic";
import brief from "./bash.brief.xnl";
import detail from "./bash.detail.xnl";

export const namespace = "SysBuiltIn";
export const name = "bash";
export { brief, detail };
export const handler = runBash;
