import { deleteAtPath, parsePath, resolvePath, setPathValue, XnlPath, XnlPathError, PathItem } from "../path";
import { DataElementNode, ElementNode, TextElementNode, XnlNode } from "../types";

export type MutationType =
  | "TREE_ADD"
  | "TREE_DELETE"
  | "TREE_MOVE"
  | "TREE_UPDATE"
  | "OBJECT_ADD"
  | "OBJECT_DELETE"
  | "OBJECT_UPDATE";

export interface XnlMutation {
  type: MutationType;
  path: string | XnlPath;
  pathBefore?: string | XnlPath;
  valueBefore?: XnlNode;
  valueAfter?: XnlNode;
  metadata?: Record<string, unknown>;
}

export function applyMutations(root: XnlNode, mutations: XnlMutation[]): XnlNode {
  let current = root;
  for (const mutation of mutations) {
    current = applySingle(current, mutation);
  }
  return current;
}

export function diffNodes(oldNode: XnlNode, newNode: XnlNode, basePath: string | XnlPath = []): XnlMutation[] {
  const pathItems = Array.isArray(basePath) ? basePath : parsePath(basePath);
  if (!sameKind(oldNode, newNode)) {
    throw new XnlPathError("Root kinds must match to diff");
  }
  if (isValueLiteral(oldNode) || isComment(oldNode)) {
    return oldNode === newNode ? [] : [{ type: "OBJECT_UPDATE", path: pathItems, valueAfter: newNode }];
  }
  if (Array.isArray(oldNode) && Array.isArray(newNode)) {
    return diffArray(oldNode, newNode, pathItems);
  }
  if (isPlainObject(oldNode) && isPlainObject(newNode)) {
    return diffMap(oldNode as Record<string, any>, newNode as Record<string, any>, pathItems);
  }
  if (isTextElement(oldNode) && isTextElement(newNode)) {
    return diffTextElement(oldNode, newNode, pathItems);
  }
  if (isDataElement(oldNode) && isDataElement(newNode)) {
    return diffDataElement(oldNode, newNode, pathItems);
  }
  return [];
}

function applySingle(root: XnlNode, mutation: XnlMutation): XnlNode {
  const { type, path, valueAfter } = mutation;
  const pathItems = Array.isArray(path) ? path : parsePath(path);

  if (type === "TREE_MOVE") {
    if (!mutation.pathBefore) throw new XnlPathError("TREE_MOVE requires pathBefore");
    const from = Array.isArray(mutation.pathBefore) ? mutation.pathBefore : parsePath(mutation.pathBefore);
    const moved = resolvePath(root, from);
    deleteAtPath(root, from);
    return applySingle(root, { ...mutation, type: "TREE_ADD", path, valueAfter: moved });
  }

  switch (type) {
    case "TREE_ADD":
      setPathValue(root, pathItems, valueAfter, { mode: "insert" });
      return root;
    case "TREE_DELETE":
      deleteAtPath(root, pathItems);
      return root;
    case "TREE_UPDATE":
      setPathValue(root, pathItems, valueAfter, { mode: "replace" });
      return root;
    case "OBJECT_ADD":
    case "OBJECT_UPDATE":
      setPathValue(root, pathItems, valueAfter, { mode: "replace" });
      return root;
    case "OBJECT_DELETE":
      deleteAtPath(root, pathItems);
      return root;
    default:
      throw new XnlPathError(`Unknown mutation type ${type}`);
  }
}

function diffTextElement(oldNode: TextElementNode, newNode: TextElementNode, basePath: XnlPath): XnlMutation[] {
  const mutations: XnlMutation[] = [];
  mutations.push(...diffMap(oldNode.metadata, newNode.metadata, [...basePath, ip("metadata")]));
  if (oldNode.attributes || newNode.attributes) {
    mutations.push(...diffMap(oldNode.attributes ?? {}, newNode.attributes ?? {}, [...basePath, ip("attributes")]));
  }
  if (oldNode.text !== newNode.text) {
    mutations.push({
      type: "TREE_UPDATE",
      path: [...basePath, ip("text")],
      valueAfter: newNode.text,
    });
  }
  if (oldNode.textMarker !== newNode.textMarker) {
    mutations.push({
      type: "TREE_UPDATE",
      path: [...basePath, ip("textMarker")],
      valueAfter: newNode.textMarker,
    });
  }
  return mutations;
}

function diffDataElement(oldNode: DataElementNode, newNode: DataElementNode, basePath: XnlPath): XnlMutation[] {
  const mutations: XnlMutation[] = [];
  const metaPath = [...basePath, ip("metadata")];
  mutations.push(...diffMap(oldNode.metadata, newNode.metadata, metaPath));
  const attrPath = [...basePath, ip("attributes")];
  mutations.push(...diffMap(oldNode.attributes ?? {}, newNode.attributes ?? {}, attrPath));

  if (oldNode.body || newNode.body) {
    mutations.push(...diffArray(oldNode.body ?? [], newNode.body ?? [], [...basePath, ip("body")]));
  }
  if (oldNode.extend || newNode.extend) {
    mutations.push(...diffExtend(oldNode.extend, newNode.extend, [...basePath, ip("extend")]));
  }
  return mutations;
}

function diffArray(oldArr: XnlNode[], newArr: XnlNode[], basePath: XnlPath): XnlMutation[] {
  const mutations: XnlMutation[] = [];
  const max = Math.max(oldArr.length, newArr.length);
  for (let i = 0; i < max; i++) {
    const oldItem = oldArr[i];
    const newItem = newArr[i];
    const path = [...basePath, li(i)];
    if (oldItem === undefined && newItem !== undefined) {
      mutations.push({ type: "TREE_ADD", path, valueAfter: newItem });
      continue;
    }
    if (oldItem !== undefined && newItem === undefined) {
      mutations.push({ type: "TREE_DELETE", path });
      continue;
    }
    if (oldItem !== undefined && newItem !== undefined) {
      if (isEqual(oldItem, newItem)) {
        continue;
      }
      const nested = diffNodes(oldItem, newItem, path);
      if (nested.length === 0) {
        mutations.push({ type: "TREE_UPDATE", path, valueAfter: newItem });
      } else {
        mutations.push(...nested);
      }
    }
  }
  return mutations;
}

function diffMap(oldMap: Record<string, any>, newMap: Record<string, any>, basePath: XnlPath): XnlMutation[] {
  const mutations: XnlMutation[] = [];
  const keys = new Set([...Object.keys(oldMap || {}), ...Object.keys(newMap || {})]);
  for (const key of keys) {
    const oldVal = (oldMap || {})[key];
    const newVal = (newMap || {})[key];
    const path = [...basePath, mk(key)];
    if (oldVal === undefined && newVal !== undefined) {
      mutations.push({ type: "OBJECT_ADD", path, valueAfter: newVal });
      continue;
    }
    if (oldVal !== undefined && newVal === undefined) {
      mutations.push({ type: "OBJECT_DELETE", path, valueBefore: oldVal });
      continue;
    }
    if (!isEqual(oldVal, newVal)) {
      const nested = diffNodes(oldVal, newVal, path);
      if (nested.length === 0) {
        mutations.push({ type: "OBJECT_UPDATE", path, valueAfter: newVal });
      } else {
        mutations.push(...nested);
      }
    }
  }
  return mutations;
}

function diffExtend(
  oldExtend: DataElementNode["extend"] | undefined,
  newExtend: DataElementNode["extend"] | undefined,
  basePath: XnlPath
): XnlMutation[] {
  const mutations: XnlMutation[] = [];
  const oldChildren = oldExtend?.children ?? {};
  const newChildren = newExtend?.children ?? {};
  const allTags = new Set([...Object.keys(oldChildren), ...Object.keys(newChildren)]);
  for (const tag of allTags) {
    const oldChild = oldChildren[tag];
    const newChild = newChildren[tag];
    const childPath = [...basePath, mk(tag)];
    if (!oldChild && newChild) {
      mutations.push({ type: "TREE_ADD", path: childPath, valueAfter: newChild });
      continue;
    }
    if (oldChild && !newChild) {
      mutations.push({ type: "TREE_DELETE", path: childPath });
      continue;
    }
    if (oldChild && newChild) {
      const nested = diffNodes(oldChild, newChild, childPath);
      if (nested.length === 0) {
        if (!isEqual(oldChild, newChild)) {
          mutations.push({ type: "TREE_UPDATE", path: childPath, valueAfter: newChild });
        }
      } else {
        mutations.push(...nested);
      }
    }
  }

  const oldOrder = oldExtend?.order ?? [];
  const newOrder = newExtend?.order ?? [];
  if (!isEqual(oldOrder, newOrder)) {
    mutations.push({
      type: "TREE_UPDATE",
      path: [...basePath, ip("order")],
      valueAfter: newOrder,
    });
  }
  return mutations;
}

function sameKind(a: XnlNode, b: XnlNode): boolean {
  if (isDataElement(a) && isDataElement(b)) return true;
  if (isTextElement(a) && isTextElement(b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) return true;
  if (isPlainObject(a) && isPlainObject(b)) return true;
  if (isValueLiteral(a) && isValueLiteral(b)) return true;
  return typeof a === typeof b;
}

function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, idx) => isEqual(item, b[idx]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => isEqual(a[key], (b as any)[key]));
  }
  return false;
}

function isPlainObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value) && !isDataElement(value) && !isTextElement(value);
}

function isDataElement(node: any): node is DataElementNode {
  return node && node.kind === "DataElement";
}

function isTextElement(node: any): node is TextElementNode {
  return node && node.kind === "TextElement";
}

function isValueLiteral(node: any): boolean {
  return (
    typeof node === "string" ||
    typeof node === "number" ||
    typeof node === "boolean" ||
    node === null
  );
}

function isComment(node: any): boolean {
  return node && node.kind === "Comment";
}

const ip = (value: string): PathItem => ({ type: "InstanceProperty", value });
const mk = (value: string): PathItem => ({ type: "MapKey", value });
const li = (value: number | string): PathItem => ({ type: "ListIndex", value: String(value) });
