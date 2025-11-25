export type ValueLiteral = string | boolean | null | number;

export type AttributeMap = Record<string, XnlNode>;

export interface ExtendBody {
  order: string[];
  children: Record<string, ElementNode>;
}

export type ElementNode = DataElementNode | TextElementNode;
export type ElementNodeKind = 'DataElement' | 'TextElement';

export interface DataElementNode {
  kind: "DataElement";
  tag: string;
  metadata: AttributeMap;
  attributes?: AttributeMap;
  body?: XnlNode[];
  extend?: ExtendBody;
}

export interface TextElementNode {
  kind: "TextElement";
  tag: string;
  metadata: AttributeMap;
  attributes?: AttributeMap;
  text?: string;
  textMarker?: string;
}

export interface CommentNode {
  kind: "Comment";
  value: string;
}

export type ContainerNode = Array<XnlNode> | Object | ElementNode;

export type XnlNode = ValueLiteral | ContainerNode | CommentNode;


export type ParseWarningCode = "DUPLICATE_CHILD";

export interface ParseWarning {
  code: ParseWarningCode;
  message: string;
  parentName: string;
  childName: string;
}

export interface XnlDocument {
  nodes: XnlNode[];
  warnings?: ParseWarning[];
}

export interface SingleNodeResult {
  node: XnlNode;
  warnings: ParseWarning[];
}

export interface UniqueChildrenResult {
  node: XnlNode;
  warnings: ParseWarning[];
}
