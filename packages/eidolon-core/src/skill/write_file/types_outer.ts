export interface WriteFileOuterInput {
  path: string;
  content: string;
  mode?: "overwrite" | "append";
}

export type WriteFileOuterOutput = string;
