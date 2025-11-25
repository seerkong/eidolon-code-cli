/**
 * Example API Request Object
 */
export interface ApiRequest {
  path: string;
  method: string;
  pathVariables?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: string;
}
