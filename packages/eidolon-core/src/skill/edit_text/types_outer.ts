export interface EditTextOuterInput {
  path: string;
  action: "insert" | "replace" | "delete_range";
  insertAfter?: number;
  newText?: string;
  find?: string;
  replace?: string;
  range?: [number, number];
}

export type EditTextOuterOutput = string;
