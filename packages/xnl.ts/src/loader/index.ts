import { AttributeMap, DataElementNode, ElementNode, ExtendBody, TextElementNode, XnlDocument, XnlNode } from "../types";
import { parseXnl } from "../parser";

export interface LoaderContext {
  prototypes: Record<string, Record<string, DataElementNode>>;
}

const SYSTEM_FIELDS = {
  proto: "proto",
  extendType: "extendType",
  exportFlag: "export",
  remove: "remove",
  name: "name",
  id: "id",
};

export function loadFromString(input: string): XnlDocument {
  const parsed = parseXnl(input);
  const ctx = buildPrototypeContext(parsed.nodes);
  const resolvedNodes = parsed.nodes.map((n) => (isDataElement(n) ? resolveNode(ctx, n) : n));
  return { nodes: resolvedNodes, warnings: parsed.warnings };
}

export function resolveNode(ctx: LoaderContext, node: DataElementNode): DataElementNode {
  const protoName = readStringMeta(node.metadata, SYSTEM_FIELDS.proto);
  const extendType = readStringMeta(node.metadata, SYSTEM_FIELDS.extendType) ?? "Override";

  let resolved = cloneDataElement(node);
  if (protoName) {
    const proto = lookupPrototype(ctx, node.tag, protoName);
    const merged = mergeNodes(ctx, proto, resolved, extendType);
    resolved = merged;
  } else {
    resolved = resolveChildren(ctx, resolved);
  }

  stripControlMetadata(resolved.metadata);
  if (resolved.attributes) stripControlMetadata(resolved.attributes as AttributeMap);
  return resolved;
}

export function batchLoad(batches: DataElementNode[][]): {
  resolved: DataElementNode[][];
  exports: Record<string, Record<string, DataElementNode>>;
} {
  const allNodes = batches.flat();
  const ctx = buildPrototypeContext(allNodes);
  const exportsMap: Record<string, Record<string, DataElementNode>> = {};
  const resolved = batches.map((batch) =>
    batch.map((node) => {
      if (!isDataElement(node)) return node;
      const rawExportName = readExportName(node.metadata);
      const resolvedNode = resolveNode(ctx, node);
      const exportName = rawExportName ?? readExportName(resolvedNode.metadata);
      if (exportName) {
        exportsMap[resolvedNode.tag] = exportsMap[resolvedNode.tag] ?? {};
        exportsMap[resolvedNode.tag][exportName] = resolvedNode;
      }
      collectExportsFromPrefabs(resolvedNode, exportsMap);
      return resolvedNode;
    })
  );
  return { resolved, exports: exportsMap };
}

function buildPrototypeContext(nodes: XnlNode[]): LoaderContext {
  const prototypes: Record<string, Record<string, DataElementNode>> = {};
  for (const node of nodes) {
    if (!isDataElement(node)) continue;
    collectPrefabs(node, prototypes);
  }
  return { prototypes };
}

function collectPrefabs(node: DataElementNode, store: Record<string, Record<string, DataElementNode>>) {
  if (node.extend && node.extend.children["Prefabs"]) {
    const prefabs = node.extend.children["Prefabs"];
    if (prefabs.kind === "DataElement" && Array.isArray(prefabs.body)) {
      for (const prefab of prefabs.body) {
        if (isDataElement(prefab)) {
          const type = prefab.tag;
          const name = readExportName(prefab.metadata);
          if (name) {
            store[type] = store[type] ?? {};
            if (!store[type][name]) {
              store[type][name] = cloneDataElement(prefab);
            }
          }
        }
      }
    }
  }
  if (node.body) {
    for (const child of node.body) {
      if (isDataElement(child)) collectPrefabs(child, store);
    }
  }
  if (node.extend) {
    for (const tag of node.extend.order) {
      const child = node.extend.children[tag];
      if (isDataElement(child)) collectPrefabs(child, store);
    }
  }
}

function collectExportsFromPrefabs(node: DataElementNode, exportsMap: Record<string, Record<string, DataElementNode>>) {
  if (!node.extend || !node.extend.children["Prefabs"]) return;
  const prefabs = node.extend.children["Prefabs"];
  if (prefabs.kind !== "DataElement" || !prefabs.body) return;
  for (const prefab of prefabs.body) {
    if (!isDataElement(prefab)) continue;
    const name = readExportName(prefab.metadata);
    if (!name) continue;
    exportsMap[prefab.tag] = exportsMap[prefab.tag] ?? {};
    exportsMap[prefab.tag][name] = prefab;
  }
}

function lookupPrototype(ctx: LoaderContext, type: string, name: string): DataElementNode {
  const found = ctx.prototypes[type]?.[name];
  if (!found) {
    throw new Error(`Prototype not found for type '${type}' name '${name}'`);
  }
  return found;
}

function mergeNodes(ctx: LoaderContext, base: DataElementNode, override: DataElementNode, extendType: string): DataElementNode {
  if (extendType !== "Override") {
    throw new Error(`Unsupported extendType '${extendType}'`);
  }
  const merged: DataElementNode = cloneDataElement(base);
  merged.metadata = mergeMaps(base.metadata, override.metadata);
  merged.attributes = mergeMaps(base.attributes ?? {}, override.attributes ?? {});
  merged.body = mergeBody(ctx, base.body ?? [], override.body ?? []);
  merged.extend = mergeExtend(ctx, base.extend, override.extend);

  stripControlMetadata(merged.metadata);
  if (merged.attributes) stripControlMetadata(merged.attributes as AttributeMap);
  return merged;
}

function resolveChildren(ctx: LoaderContext, node: DataElementNode): DataElementNode {
  const copy = cloneDataElement(node);
  if (copy.body) {
    copy.body = copy.body.map((item) => (isDataElement(item) ? resolveNode(ctx, item) : item));
  }
  if (copy.extend) {
    const nextChildren: Record<string, ElementNode> = {};
    for (const tag of copy.extend.order) {
      const child = copy.extend.children[tag];
      nextChildren[tag] = isDataElement(child) ? resolveNode(ctx, child) : child;
    }
    copy.extend = { order: [...copy.extend.order], children: nextChildren };
  }
  return copy;
}

function mergeBody(ctx: LoaderContext, baseBody: XnlNode[], overrideBody: XnlNode[]): XnlNode[] {
  const result: XnlNode[] = [];
  const baseById: Record<string, XnlNode> = {};
  for (const item of baseBody) {
    const id = readElementId(item);
    if (id) baseById[id] = item;
    result.push(cloneNode(item));
  }
  for (const item of overrideBody) {
    if (isDataElement(item) && isRemoveFlag(item)) {
      const id = readElementId(item);
      if (id && baseById[id]) {
        const index = result.findIndex((n) => readElementId(n) === id);
        if (index >= 0) {
          result.splice(index, 1);
        }
      }
      continue;
    }
    const id = readElementId(item);
    if (id && baseById[id] && isDataElement(baseById[id]) && isDataElement(item)) {
      const merged = mergeNodes(ctx, baseById[id] as DataElementNode, item, "Override");
      const idx = result.findIndex((n) => readElementId(n) === id);
      if (idx >= 0) {
        result[idx] = merged;
        continue;
      }
    }
    result.push(isDataElement(item) ? resolveNode(ctx, item) : cloneNode(item));
  }
  return result;
}

function mergeExtend(
  ctx: LoaderContext,
  baseExtend: ExtendBody | undefined,
  overrideExtend: ExtendBody | undefined
): ExtendBody | undefined {
  if (!baseExtend && !overrideExtend) return undefined;
  if (!baseExtend) return resolveExtend(ctx, overrideExtend);
  if (!overrideExtend) return resolveExtend(ctx, baseExtend);

  const order: string[] = [...baseExtend.order];
  const children: Record<string, ElementNode> = { ...baseExtend.children };

  for (const tag of overrideExtend.order) {
    const child = overrideExtend.children[tag];
    const existing = children[tag];
    if (isDataElement(child) && isRemoveFlag(child)) {
      delete children[tag];
      const idx = order.indexOf(tag);
      if (idx >= 0) order.splice(idx, 1);
      continue;
    }
    if (existing && isDataElement(existing) && isDataElement(child)) {
      children[tag] = mergeNodes(ctx, existing, child, "Override");
    } else {
      children[tag] = isDataElement(child) ? resolveNode(ctx, child) : child;
    }
    if (!order.includes(tag)) order.push(tag);
  }
  return { order, children };
}

function resolveExtend(ctx: LoaderContext, extend: ExtendBody | undefined): ExtendBody | undefined {
  if (!extend) return undefined;
  const children: Record<string, ElementNode> = {};
  for (const tag of extend.order) {
    const child = extend.children[tag];
    children[tag] = isDataElement(child) ? resolveNode(ctx, child) : child;
  }
  return { order: [...extend.order], children };
}

function cloneDataElement(node: DataElementNode): DataElementNode {
  return {
    kind: "DataElement",
    tag: node.tag,
    metadata: cloneMap(node.metadata),
    attributes: node.attributes ? cloneMap(node.attributes) : undefined,
    body: node.body ? node.body.map((n) => cloneNode(n)) : undefined,
    extend: node.extend ? cloneExtend(node.extend) : undefined,
  };
}

function cloneExtend(extend: ExtendBody): ExtendBody {
  const children: Record<string, ElementNode> = {};
  for (const tag of extend.order) {
    children[tag] = cloneNode(extend.children[tag]) as ElementNode;
  }
  return { order: [...extend.order], children };
}

function cloneNode<T extends XnlNode>(node: T): T {
  if (Array.isArray(node)) {
    return node.map((n) => cloneNode(n)) as unknown as T;
  }
  if (isPlainObject(node)) {
    const out: Record<string, any> = {};
    for (const key of Object.keys(node)) {
      out[key] = cloneNode((node as any)[key]);
    }
    return out as T;
  }
  if (isDataElement(node)) return cloneDataElement(node) as unknown as T;
  return node;
}

function cloneMap(map: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const key of Object.keys(map || {})) {
    out[key] = cloneNode(map[key]);
  }
  return out;
}

function mergeMaps(base: Record<string, any>, override: Record<string, any>): Record<string, any> {
  const result = cloneMap(base || {});
  for (const key of Object.keys(override || {})) {
    const value = override[key];
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = mergeMaps(result[key], value);
    } else {
      result[key] = cloneNode(value);
    }
  }
  return result;
}

function stripControlMetadata(meta: AttributeMap) {
  delete (meta as any)[SYSTEM_FIELDS.proto];
  delete (meta as any)[SYSTEM_FIELDS.extendType];
  delete (meta as any)[SYSTEM_FIELDS.exportFlag];
  delete (meta as any)[SYSTEM_FIELDS.remove];
}

function readExportName(meta: AttributeMap): string | undefined {
  if (!meta) return undefined;
  const exported = meta[SYSTEM_FIELDS.exportFlag];
  if (exported !== true && exported !== "true") return undefined;
  const name = (meta[SYSTEM_FIELDS.name] as any) ?? (meta[SYSTEM_FIELDS.id] as any);
  if (typeof name === "string" && name.length > 0) return name;
  return undefined;
}

function readElementId(node: XnlNode): string | undefined {
  if (isDataElement(node) || isTextElement(node)) {
    const val = (node.metadata as any)?.[SYSTEM_FIELDS.id];
    if (typeof val === "string" && val.length > 0) return val;
  }
  return undefined;
}

function readStringMeta(meta: AttributeMap, key: string): string | undefined {
  const val = meta?.[key];
  if (typeof val === "string") return val;
  return undefined;
}

function isRemoveFlag(node: DataElementNode): boolean {
  return node.metadata?.[SYSTEM_FIELDS.remove] === true || node.metadata?.[SYSTEM_FIELDS.remove] === "true";
}

function isDataElement(node: any): node is DataElementNode {
  return node && node.kind === "DataElement";
}

function isTextElement(node: any): node is TextElementNode {
  return node && node.kind === "TextElement";
}

function isPlainObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value) && !isDataElement(value);
}
