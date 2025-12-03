import { describe, expect, it } from "vitest";
import { parseXnl } from "../src/parser";
import { parsePath, resolvePath, setPathValue, XnlPathError } from "../src/path";

describe("path protocol", () => {
  it("parses path strings", () => {
    const parsed = parsePath("#root:metadata::'id'");
    expect(parsed).toEqual([
      { type: "UniqueName", value: "root" },
      { type: "InstanceProperty", value: "metadata" },
      { type: "MapKey", value: "id" },
    ]);
  });

  it("resolves metadata and extend children", () => {
    const input = `<root id="container" {title="Root"} [
      <child id="c1">
      <child id="c2">
    ] (
      <header id="header" title="Hello">
    )>`;
    const { nodes } = parseXnl(input);
    const title = resolvePath(nodes[0], "#container:extend::'header':metadata::'title'");
    expect(title).toBe("Hello");
    const missing = () => resolvePath(nodes[0], "#missing:metadata::'id'");
    expect(missing).toThrow(XnlPathError);
  });

  it("inserts into body arrays via setPathValue", () => {
    const input = `<root id="container" [ <a id="a1"> ]>`;
    const { nodes } = parseXnl(input);
    const newChild = parseXnl(`<b id="a2">`).nodes[0];
    setPathValue(nodes[0], "#container:body::1", newChild, { mode: "insert" });
    const ids = (resolvePath(nodes[0], "#container:body") as any[]).map((n) => (n as any).metadata.id);
    expect(ids).toEqual(["a1", "a2"]);
  });
});
