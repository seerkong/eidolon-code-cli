import { describe, expect, it } from "vitest";
import { parseUniqueChildren, parseXnl, parseXnlSingleNode } from "../src/parser";
import { XnlParseError } from "../src/errors";
import { XnlNode } from "../src/types";

describe("parseXnl", () => {
  it("parses mixed short-form content with metadata, attributes, array, extend, and text", () => {
    const input = `<doc [
  <no_body_node1>
  <no_body_node2 a=[1] b={c=3}>
  <metadata_demo1 xx=1 {
    a = 'abc'
    b = "tt\\t\\n"
    c = { inner = 2 }
    "string as key" = 2.3
    'string as key2' = 3.4
  }>
  <list_body1 [
    1 2 <item id="x" count=3 active=true note="hi">
  ]>
  <extend_demo1 (
    <abc {
      a = [1 2]
      b = {c = 3}
    }>
    <efg [
      1
      <b>
    ]>
  )>
  <text1#>
    在纯文本内部，无需转义，例如 & < > #
    这样的话可以包含形如 <notatag 的内容，均按文本处理
  <#>
]>`;

    const doc = parseXnl(input);
    expect(doc.nodes).toHaveLength(1);
    const root = doc.nodes[0] as XnlNode;
    expect(root.body).toBeDefined();
    expect(root.extend).toBeUndefined();
    expect(root.text).toBeUndefined();
    const list = (root.body as any[]).find((n) => (n as any).tag === "list_body1") as XnlNode;
    expect(list.body).toHaveLength(3);
    const ext = (root.body as any[]).find((n) => (n as any).tag === "extend_demo1") as XnlNode;
    expect(ext.extend?.order).toEqual(["abc", "efg"]);
    const textNode = (root.body as any[]).find((n) => (n as any).text !== undefined) as XnlNode;
    expect(textNode.text).toContain("纯文本");
  });

  it("overwrites duplicate children in extend blocks (warn only)", () => {
    const input = `<wrap ( <a {v=1}> <a {v=2}> )>`;
    const { nodes, warnings = [] } = parseXnl(input);
    const wrap = nodes[0] as XnlNode;
    expect(wrap.extend?.children.a?.attributes?.v).toMatchObject({ kind: "Number", value: 2 });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.code).toBe("DUPLICATE_CHILD");
  });

  it("parses metadata and attribute literals with quoted keys and numeric kinds", () => {
    const input = `<node a=[1] b={c=3} { s = 'abc' "quoted key" = 2.3 bool = false arr = [1 "x"] }> `;
    const doc = parseXnl(input);
    const node = doc.nodes[0] as XnlNode;
    expect(node.metadata.a).toMatchObject({ kind: "Array" });
    expect(node.metadata.b).toMatchObject({ kind: "Object" });
    expect(node.attributes?.s).toMatchObject({ kind: "String", value: "abc" });
    expect(node.attributes?.["quoted key"]).toMatchObject({ kind: "Number", numericKind: "Float", value: 2.3 });
    expect(node.attributes?.bool).toMatchObject({ kind: "Boolean", value: false });
  });

  it("errors on mismatched text marker or mixed text with array/extend", () => {
    expect(() => parseXnl(`<t #flag>hi<#other>`)).toThrowError(/expected 'flag' but found 'other'/i);
    expect(() => parseXnl(`<t [ 1 ] #>hi<#>`)).toThrowError(/text block not allowed with array\/extend/i);
    expect(() => parseXnl(`<t ( <a> ) #>hi<#>`)).toThrowError(/text block not allowed with array\/extend/i);
  });

  it("reports missing closing delimiters with tag context", () => {
    expect(() => parseXnl(`<a [ 1 2`)).toThrowError(/Missing closing text tag|Missing closing .*<a>/i);
    expect(() => parseXnl(`<note#>hi`)).toThrowError(/Missing closing text tag <#> for <note>/i);
  });

  it("dedents text blocks based on closing indent", () => {
    const input = `<note#>
      line1
        line2
    <#>`;
    const { nodes } = parseXnl(input);
    const note = nodes[0] as XnlNode;
    expect(note.text).toBe("  line1\n    line2\n");
  });

  it("parses a single node with parseXnlSingleNode", () => {
    const { node, warnings = [] } = parseXnlSingleNode(`<item a=1 {b=2} [3]>`);
    expect((node as any).tag).toBe("item");
    expect(node.metadata.a).toMatchObject({ kind: "Number", value: 1 });
    expect(node.body).toBeDefined();
    expect(warnings).toHaveLength(0);
  });

  it("builds extend body with override on duplicate using parseUniqueChildren", () => {
    const { node, warnings = [] } = parseUniqueChildren("root", `<a {x=1}> <a {x=2}> <b>`);
    expect(node.extend?.order).toEqual(["a", "b"]);
    expect(node.extend?.children.a?.attributes?.x).toMatchObject({ kind: "Number", value: 2 });
    expect(warnings).toHaveLength(1);
  });
});
