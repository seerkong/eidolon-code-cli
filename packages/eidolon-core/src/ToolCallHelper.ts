import { XNL, ElementNodeKind, DataElementNode, TextElementNode } from "xnl.ts";
import { Logger } from "./contract";

export interface ParsedXnlToolCall {
  id: string;
  lang: string;
  code: string;
  funcId: string;
}

// 按照出现顺序返回解析后的 ParsedXnlToolCall
// 如果id重复，则使用后面的。
// 如果没有id，则忽略
export function parseXnlToolCalls(text: string, logger?: Logger): ParsedXnlToolCall[] {
    let contents = parseUnquoteContents(text);
    let idToResultMap: { [id: string]: ParsedXnlToolCall } = {};
    let idOrder: string[] = [];
    if (logger != null) {
      logger(`[parseXnlToolCalls] ${JSON.stringify(contents)}`)
    }

    for (let i = 0; i < contents.length; i++) {
        const { nodes } = XNL.parseMany(contents[i]);
        for (let j = 0; j < nodes.length; j++) {
            let node = nodes[j];
            let nodeKind: ElementNodeKind = node.kind;
            if (nodeKind != 'TextElement') {
                continue;
            }
            let dataElement = node as TextElementNode;
            let id = dataElement.metadata['id'];
            let lang = dataElement.metadata['lang'];
            let code = dataElement.text;
            let funcId = guessRouteFromCode(code);
            let call = {
                id, lang, code, funcId
            }

            if (!(id in idToResultMap)) {
                idOrder.push(id);
            }
            idToResultMap[id] = call;
        }
    }

    return idOrder.map(id => idToResultMap[id]);
}

// 解析一个字符串中!unquote_start !unquote_end中的内容
// 例如：
// "!unquote_start\nabc!unquote_end\n!unquote_start\nefg!unquote_end"
// 需要解析为 ["abc", "efg"]
// TODO 如果没有闭合的!unquote_end，则返回能够解析后的结果，和错误提示message
function parseUnquoteContents(input : string) : string[] {
  const result: string[] = [];
  let currentIndex = 0;

  while (currentIndex < input.length) {
    const startMarker = "!unquote_start";
    const endMarker = "!unquote_end";

    const startIndex = input.indexOf(startMarker, currentIndex);
    if (startIndex === -1) {
      break;
    }

    const contentStart = startIndex + startMarker.length;
    const endIndex = input.indexOf(endMarker, contentStart);

    if (endIndex === -1) {
      break;
    }

    const content = input.slice(contentStart, endIndex);
    result.push(content);

    currentIndex = endIndex + endMarker.length;
  }

  return result;
}

function guessRouteFromCode(code: string): string {
  const match = code.match(/SysBuiltIn\.([A-Za-z0-9_]+)/);
  if (match?.[1]) {
      return `SysBuiltIn.${match[1]}`;
  }
  return "tool_call";
}

export function makeToolRespStr(toolResults: any[]) : string | null {
    if (toolResults.length) {
        const respBlocks = toolResults
            .map(
            (r) => {
              let text = (typeof r.output === "string" ? r.output : JSON.stringify(r.output));
              let node = {
                kind: "TextElement",
                tag: 'tool_resp',
                metadata: {id: r.id},
                text: text,
                textMarker: r.id
              }         
              return XNL.stringify(node, { pretty: true, indent: 2 })
            }
            )
            .join("\n");
        const toolContent = `!unquote_start\n${respBlocks}\n!unquote_end`;
        return toolContent;
    }
    return null;
}