import { ReadFileOuterInput } from "./types_outer";

export interface ReadFileInnerInput {
  id: string;
  name: string;
  input: ReadFileOuterInput;
}

export interface ReadFileInnerOutput {
  id: string;
  name: string;
  output: string;
}
