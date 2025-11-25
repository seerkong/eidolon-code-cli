import { runTodoWrite } from "./logic";
import brief from "./todo_write.brief.xnl";
import detail from "./todo_write.detail.xnl";

export const namespace = "SysBuiltIn";
export const name = "todo_write";
export { brief, detail };
export const handler = runTodoWrite;
