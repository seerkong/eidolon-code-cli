import { TodoWriteOuterInput } from "./types_outer";

export interface TodoWriteInnerInput {
  id: string;
  name: string;
  input: TodoWriteOuterInput;
}

export interface TodoWriteInnerOutput {
  id: string;
  name: string;
  output: string;
}
