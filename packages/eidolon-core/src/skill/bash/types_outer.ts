
export interface BashOuterInput {
    // Shell command to run
    /** @minLength 1 */
    command: string;
    // Timeout in milliseconds
    /** @minimum 1000 */
    /** @maximum 120000 */
    timeoutMs: number;
}
export type BashOuterOutput = string;
export type bash = (input: BashOuterInput) => BashOuterOutput;