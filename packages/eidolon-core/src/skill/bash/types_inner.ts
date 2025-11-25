import { BashOuterInput } from "./types_outer";

export interface BashInnerInput {
    id: string;
    name: string;
    input: BashOuterInput;
}

export interface BashInnerOutput {
    id: string;
    name: string;
    output: string;
}

