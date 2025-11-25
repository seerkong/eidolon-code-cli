/**
 * Simple path matcher with path variable extraction support
 */
export class PathMatcher {
  private pattern: RegExp;
  private variableNames: string[];

  constructor(pathPattern: string) {
    // Convert path pattern to regular expression
    // Example: "/user/{username}" -> /^\/user\/([^/]+)$/
    const parts = pathPattern.split('/');
    let regexStr = '';
    const vars: string[] = [];

    for (const part of parts) {
      if (part !== '') {
        regexStr += '/';
        if (part.startsWith('{') && part.endsWith('}')) {
          // Path variable
          vars.push(part.substring(1, part.length - 1));
          regexStr += '([^/]+)';
        } else {
          // Literal
          regexStr += part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
      }
    }
    if (regexStr.length === 0) {
      regexStr = '/';
    }

    this.pattern = new RegExp(`^${regexStr}$`);
    this.variableNames = vars;
  }

  /**
   * Match path and extract path variables
   * @param path Actual path
   * @returns Path variable mapping, or null if no match
   */
  match(path: string): Record<string, string> | null {
    const result = this.pattern.exec(path);
    if (!result) {
      return null;
    }

    const variables: Record<string, string> = {};
    for (let i = 0; i < this.variableNames.length; i++) {
      variables[this.variableNames[i]] = result[i + 1];
    }
    return variables;
  }
}
