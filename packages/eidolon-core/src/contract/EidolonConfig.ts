
export type AiClientApiKind = "openai" | "anthropic";

export interface ModelProfile {
  name?: string;
  provider: "siliconflow";
  model: string;
  apiKey?: string;
  baseUrl?: string;
  apiKind?: AiClientApiKind;
  maxOutputTokens?: number;
  maxInputChars?: number;
}

export interface EidolonConfig {
  active?: string;
  profiles?: ModelProfile[];
  activeProfile?: ModelProfile;
}

export type Logger = (line: string) => void;

