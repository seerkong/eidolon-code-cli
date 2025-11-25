/**
 * Simple Ant-style path matcher supporting '?', '*', and '**'
 *
 * - '?' matches one character
 * - '*' matches zero or more characters within a path segment
 * - '**' matches zero or more path segments
 * - '{name}' captures a path variable
 */

import { PathMatchResult } from './DispatchRequest';

export class AntPathMatcher {
  private readonly pathSeparator: string;

  constructor(pathSeparator: string = '/') {
    this.pathSeparator = pathSeparator || '/';
  }

  /**
   * Check if a path matches the given pattern
   */
  match(pattern: string, path: string): boolean {
    return this.doMatch(pattern, path, null);
  }

  /**
   * Match and extract path variables
   */
  matchAndExtract(pattern: string, path: string): PathMatchResult | null {
    const variables: Record<string, string> = {};
    if (this.doMatch(pattern, path, variables)) {
      return { pattern, path, variables };
    }
    return null;
  }

  private doMatch(
    pattern: string,
    path: string,
    variables: Record<string, string> | null
  ): boolean {
    const pattDirs = this.tokenize(pattern);
    const pathDirs = this.tokenize(path);

    let pattIdxStart = 0;
    let pattIdxEnd = pattDirs.length - 1;
    let pathIdxStart = 0;
    let pathIdxEnd = pathDirs.length - 1;

    // Match all elements up to the first **
    while (pattIdxStart <= pattIdxEnd && pathIdxStart <= pathIdxEnd) {
      const patDir = pattDirs[pattIdxStart];
      if (patDir === '**') {
        break;
      }
      if (!this.matchStrings(patDir, pathDirs[pathIdxStart], variables)) {
        return false;
      }
      pattIdxStart++;
      pathIdxStart++;
    }

    if (pathIdxStart > pathIdxEnd) {
      for (let i = pattIdxStart; i <= pattIdxEnd; i++) {
        if (pattDirs[i] !== '**') {
          return false;
        }
      }
      return true;
    }

    if (pattIdxStart > pattIdxEnd) {
      return false;
    }

    // Match all elements up to the last **
    while (pattIdxStart <= pattIdxEnd && pathIdxStart <= pathIdxEnd) {
      const patDir = pattDirs[pattIdxEnd];
      if (patDir === '**') {
        break;
      }
      if (!this.matchStrings(patDir, pathDirs[pathIdxEnd], variables)) {
        return false;
      }
      pattIdxEnd--;
      pathIdxEnd--;
    }

    if (pathIdxStart > pathIdxEnd) {
      for (let i = pattIdxStart; i <= pattIdxEnd; i++) {
        if (pattDirs[i] !== '**') {
          return false;
        }
      }
      return true;
    }

    while (pattIdxStart !== pattIdxEnd && pathIdxStart <= pathIdxEnd) {
      let patIdxTmp = -1;
      for (let i = pattIdxStart + 1; i <= pattIdxEnd; i++) {
        if (pattDirs[i] === '**') {
          patIdxTmp = i;
          break;
        }
      }
      if (patIdxTmp === pattIdxStart + 1) {
        pattIdxStart++;
        continue;
      }
      const patLength = patIdxTmp - pattIdxStart - 1;
      const strLength = pathIdxEnd - pathIdxStart + 1;
      let foundIdx = -1;

      outer: for (let i = 0; i <= strLength - patLength; i++) {
        for (let j = 0; j < patLength; j++) {
          const subPat = pattDirs[pattIdxStart + j + 1];
          const subStr = pathDirs[pathIdxStart + i + j];
          if (!this.matchStrings(subPat, subStr, variables)) {
            continue outer;
          }
        }
        foundIdx = pathIdxStart + i;
        break;
      }

      if (foundIdx === -1) {
        return false;
      }

      pattIdxStart = patIdxTmp;
      pathIdxStart = foundIdx + patLength;
    }

    for (let i = pattIdxStart; i <= pattIdxEnd; i++) {
      if (pattDirs[i] !== '**') {
        return false;
      }
    }
    return true;
  }

  private matchStrings(
    pattern: string,
    str: string,
    variables: Record<string, string> | null
  ): boolean {
    // Handle path variable extraction
    if (pattern.startsWith('{') && pattern.endsWith('}')) {
      if (variables !== null) {
        const variableName = pattern.substring(1, pattern.length - 1);
        variables[variableName] = str;
      }
      return true;
    }

    let patIdx = 0;
    let strIdx = 0;
    const patLen = pattern.length;
    const strLen = str.length;
    let starIdx = -1;
    let strTmpIdx = -1;

    while (strIdx < strLen) {
      if (
        patIdx < patLen &&
        (pattern.charAt(patIdx) === '?' || pattern.charAt(patIdx) === str.charAt(strIdx))
      ) {
        patIdx++;
        strIdx++;
      } else if (patIdx < patLen && pattern.charAt(patIdx) === '*') {
        starIdx = patIdx++;
        strTmpIdx = strIdx;
      } else if (starIdx !== -1) {
        patIdx = starIdx + 1;
        strIdx = ++strTmpIdx;
      } else {
        return false;
      }
    }

    while (patIdx < patLen && pattern.charAt(patIdx) === '*') {
      patIdx++;
    }

    return patIdx === patLen;
  }

  private tokenize(path: string): string[] {
    if (!path) {
      return [];
    }

    let trimmed = path;
    if (trimmed.startsWith(this.pathSeparator)) {
      trimmed = trimmed.substring(this.pathSeparator.length);
    }
    if (trimmed.endsWith(this.pathSeparator)) {
      trimmed = trimmed.substring(0, trimmed.length - this.pathSeparator.length);
    }
    if (!trimmed) {
      return [''];
    }

    const result: string[] = [];
    const sepLen = this.pathSeparator.length;
    let index: number;
    let start = 0;

    while ((index = trimmed.indexOf(this.pathSeparator, start)) !== -1) {
      result.push(trimmed.substring(start, index));
      start = index + sepLen;
    }
    result.push(trimmed.substring(start));

    return result;
  }
}
