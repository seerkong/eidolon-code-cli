import { WriteFileOuterInput } from "./types_outer";

export interface WriteFileInnerInput {
  id: string;
  name: string;
  input: WriteFileOuterInput;
}

export interface WriteFileInnerOutput {
  id: string;
  name: string;
  output: string;
}
