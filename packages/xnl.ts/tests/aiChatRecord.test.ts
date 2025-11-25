import { describe, expect, it } from "vitest";
import { XNL } from "../src";
import { ArrayValue, ObjectValue, ValueLiteral, NumericKind, XnlNode } from "../src/types";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonArray | JsonObject;
type JsonArray = JsonValue[];
type JsonObject = { [key: string]: JsonValue };

interface AiChatRecord extends Record<string, JsonValue> {
  role: string;
}

function toNumberValue(value: number): ValueLiteral {
  const numericKind: NumericKind = Number.isInteger(value) ? "Integer" : "Float";
  return { kind: "Number", value, numericKind, raw: String(value) };
}

function toValueLiteral(value: JsonValue): ValueLiteral {
  if (value === null) return { kind: "Null" };
  if (typeof value === "string") return { kind: "String", value };
  if (typeof value === "boolean") return { kind: "Boolean", value };
  if (typeof value === "number") return toNumberValue(value);

  if (Array.isArray(value)) {
    return {
      kind: "Array",
      items: value.map((item) => toValueLiteral(item)),
    } as ArrayValue;
  }

  const entries: Record<string, ValueLiteral> = {};
  for (const [k, v] of Object.entries(value)) {
    entries[k] = toValueLiteral(v);
  }
  return { kind: "Object", entries } as ObjectValue;
}

function aiChatRecordToNode(record: AiChatRecord): XnlNode {
  const attrEntries: Record<string, ValueLiteral> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key === "role") continue;
    attrEntries[key] = toValueLiteral(value);
  }
  return {
    kind: "Element",
    tag: record.role,
    metadata: {},
    attributes: attrEntries,
  };
}

describe("aiChatRecordToNode", () => {
  it("builds node and pretty-prints to XNL", () => {
    const record: AiChatRecord = {
      role: "assistant",
      content: "\n\n我来帮您为当前项目中的脚本编写一个README.md文件。首先让我查看一下项目的结构，了解有哪些脚本。\n",
      toolCalls: [
        {
          id: "019abbf4e8c5b19442ae1eacc72b1eb0",
          name: "bash",
          input: { command: "ls -la" },
        },
      ],
    };

    const node = aiChatRecordToNode(record);
    const output = XNL.stringify(node, { pretty: true, indent: 2 });

    const expected = `<assistant {
  content = "\\n\\n我来帮您为当前项目中的脚本编写一个README.md文件。首先让我查看一下项目的结构，了解有哪些脚本。\\n"
  toolCalls = [
    {
      id = "019abbf4e8c5b19442ae1eacc72b1eb0"
      name = "bash"
      input = {
        command = "ls -la"
      }
    }
  ]
}>`;

    expect(output).toBe(expected);
  });
});
