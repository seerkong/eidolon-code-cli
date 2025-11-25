import { EditTextOuterInput } from "./types_outer";

export interface EditTextInnerInput {
  id: string;
  name: string;
  input: EditTextOuterInput;
}

export interface EditTextInnerOutput {
  id: string;
  name: string;
  output: string;
}
