export { parseXnl } from "./parser";
export { parseXnlSingleNode, parseUniqueChildren } from "./parser";
export { XnlParseError, XnlErrorCode } from "./errors";
import * as Parser from "./parser";
import { stringify as xnlStringify } from "./formatter";
export type {
  AttributeMap,
  ValueLiteral,
  XnlDocument,
  XnlNode,
  CommentNode,
  ParseWarning,
  SingleNodeResult,
  UniqueChildrenResult,
  ExtendBody,
  ElementNode,
  DataElementNode,
  TextElementNode,
  ElementNodeKind
} from "./types";

export const XNL = {
  parseMany: Parser.parseXnl,
  parseSingle: Parser.parseXnlSingleNode,
  parseUnique: Parser.parseUniqueChildren,
  stringify: xnlStringify,
};
