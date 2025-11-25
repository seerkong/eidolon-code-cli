export interface ReadFileOuterInput {
  path: string;
  startLine?: number;
  endLine?: number;
  maxBytes?: number;
}

export type ReadFileOuterOutput = string;
