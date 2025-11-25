import { runEditText } from "./logic";
import brief from "./edit_text.brief.xnl";
import detail from "./edit_text.detail.xnl";

export const namespace = "SysBuiltIn";
export const name = "edit_text";
export { brief, detail };
export const handler = runEditText;
