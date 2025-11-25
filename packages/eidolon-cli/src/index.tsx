#!/usr/bin/env bun
import { render, useTerminalDimensions } from "@opentui/solid";
import type { KeyEvent, SelectOption, TextareaRenderable } from "@opentui/core";
import { createEffect, createMemo, createSignal, For, Show, onCleanup } from "solid-js";
import { appendFile, mkdir, readdir } from "fs/promises";
import fsSync from "fs";
import os from "os";
import path from "path";
import {
  AgentRunner,
  FileStoreActorImpl,
  createLLMClient,
  parseXnlToolCalls,
  StubLLMClientActor,
  EidolonCoreRuntime,
  EidolonConfig,
  ModelProfile,
  ToolResult,
  ToolCall,
  CliHistoryEntry,
  cliRoleToSymbol,
  ulid,
  NoIdCliHistoryEntry,
  fillCliHistoryId
} from "@eidolon/core";
import {
  loadConfig
} from './ConfigHelper';
import { LocalFileSystem } from "@eidolon/fs-local";
import { getAgentByName, loadAgents } from "./agentLoader";
import {
  loadSlashCommandContent,
  loadSlashCommandLists,
  SlashCommand,
  SlashCommandLists,
} from "./slashCommands";
import { FileSystemApi, deriveProjectId } from "@eidolon/fs-api";

type FileOption = SelectOption & { path: string };

type SessionLogger = {
  log: (line: string) => Promise<void>;
  paths: { projectId: string; sessionId: string; logFile: string };
};

type StreamFilterState = { inUnquote: boolean; hidden: string };

type CompletionContext =
  | { kind: "file"; basePrefix: string; partial: string; startIdx: number }
  | { kind: "agent"; basePrefix: string; partial: string; startIdx: number }
  | null;

const UnquoteStartMark = "!unquote_start";
const UnquoteEndMark = "!unquote_end";

function truncate(text: string, max = 120): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

async function createSessionLogger(workspace: string): Promise<SessionLogger> {
  const projectId = deriveProjectId(workspace);
  const sessionId = new Date().toISOString().replace(/[:.]/g, "-");
  const logDir = path.join(os.homedir(), ".eidolon", "projects", projectId, "sessions", sessionId);
  const logFile = path.join(logDir, "app.log");
  await mkdir(logDir, { recursive: true });
  const log = async (line: string) => {
    try {
      const stamp = new Date().toISOString();
      await appendFile(logFile, `[${stamp}] ${line}\n`, "utf-8");
    } catch (error: any) {
      console.error(`Log write failed: ${error?.message || error}`);
    }
  };
  return { log, paths: { projectId, sessionId, logFile } };
}

async function listPathChoices(rawPath: string, workspace: string): Promise<string[]> {
  const timeout = new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 2000));
  const task = (async () => {
    const pathPart = rawPath.replace(/^@file:/, "").trim();
    const isAbsolute = path.isAbsolute(pathPart);
    const targetPath = isAbsolute ? pathPart || workspace : path.join(workspace, pathPart || ".");
    const dir =
      pathPart === ""
        ? workspace
        : pathPart.endsWith(path.sep)
        ? targetPath
        : path.dirname(targetPath || workspace);
    try {
      const entries = await readdir(dir || ".", { withFileTypes: true });
      return entries.map((entry) => {
        const candidate = path.join(dir, entry.name);
        return isAbsolute ? candidate : path.relative(workspace, candidate) || ".";
      });
    } catch {
      return [];
    }
  })();
  return Promise.race([timeout, task]);
}

function extractAgentName(line: string): string | undefined {
  const matches = [...line.matchAll(/@agent:([^\s]+)/g)];
  if (!matches.length) return undefined;
  return matches[matches.length - 1][1];
}

function normalizeFileRefs(input: string, workspace: string): string {
  return input.replace(/@file:([^\s]+)/g, (_match, p1) => {
    const raw = String(p1 || "").trim();
    if (path.isAbsolute(raw)) return `@file:${raw}`;
    const abs = path.resolve(workspace, raw);
    return `@file:${abs}`;
  });
}

function extractFileRefs(text: string): string[] {
  return [...text.matchAll(/@file:([^\s]+)/g)].map((m) => m[1]);
}

function guessRouteFromCode(code: string): string {
  const match = code.match(/SysBuiltIn\.([A-Za-z0-9_]+)/);
  if (match?.[1]) return `SysBuiltIn.${match[1]}`;
  return "tool_call";
}

function stripToolcallBlocks(text: string): string {
  return text.replace(/!unquote_start[\s\S]*?!unquote_end/gi, "").trim();
}

function filterStreamChunk(state: StreamFilterState, chunk: string): { visible: string; triggers: string[] } {
  let rest = chunk;
  let visible = "";
  const triggers: string[] = [];


  while (rest.length > 0) {
    if (state.inUnquote) {
      const endIdx = rest.indexOf(UnquoteEndMark);
      if (endIdx === -1) {
        state.hidden += rest;
        rest = "";
      } else {
        state.hidden += rest.slice(0, endIdx);
        const parsed = parseXnlToolCalls(state.hidden);
        for (const call of parsed) {
          triggers.push(`# trigger tool call: ${guessRouteFromCode(call.code ?? "")}`);
        }
        state.hidden = "";
        state.inUnquote = false;
        rest = rest.slice(endIdx + UnquoteEndMark.length);
      }
    } else {
      const startIdx = rest.indexOf(UnquoteStartMark);
      if (startIdx === -1) {
        visible += rest;
        rest = "";
      } else {
        visible += rest.slice(0, startIdx);
        state.inUnquote = true;
        state.hidden = "";
        rest = rest.slice(startIdx + UnquoteStartMark.length);
      }
    }
  }

  return { visible, triggers };
}

function readWorkingDirectory(workspace: string): FileOption[] {
  try {
    return fsSync
      .readdirSync(workspace, { withFileTypes: true })
      .filter((entry) => entry.isFile() || entry.isDirectory())
      .slice(0, 50)
      .map((entry) => {
        const isDir = entry.isDirectory();
        const name = isDir ? `${entry.name}/` : entry.name;
        return {
          name,
          description: isDir ? "directory" : "file",
          value: name,
          path: path.join(workspace, entry.name),
        };
      });
  } catch {
    return [];
  }
}

function buildSuggestion(
  value: string,
  ctx: CompletionContext,
  candidates: string[],
  selectedIndex: number
): string {
  if (!ctx) return "";
  if (candidates.length === 0) return "";

  const index = Math.min(Math.max(0, selectedIndex), candidates.length - 1);
  const candidate = candidates[index];
  if (!candidate) return "";
  const suggestionValue = `${ctx.basePrefix}${candidate}`;
  if (suggestionValue === value) return "";
  return suggestionValue;
}

type AppProps = {
  workspace: string;
  logger: SessionLogger;
  llm: any;
  fsApi: LocalFileSystem;
  stateStore: FileStoreActorImpl;
  initialSlashLists: SlashCommandLists;
  loadSlashLists: () => Promise<SlashCommandLists>;
  configInfo: { provider?: string; apiKind?: string; hasApiKey: boolean };
};

const App = (props: AppProps) => {
  const [history, setHistory] = createSignal<CliHistoryEntry[]>([
    { id: ulid(), role: "assistant", text: "Welcome to the Eidolon CLI." },
  ]);
  const [inputValue, setInputValue] = createSignal("");
  const [historyIndex, setHistoryIndex] = createSignal<number | null>(null);
  const [files, setFiles] = createSignal<FileOption[]>(readWorkingDirectory(props.workspace));
  const [pickerOpen, setPickerOpen] = createSignal(false);
  const [selectedFileIndex, setSelectedFileIndex] = createSignal(0);
  const [selectedCompletionIndex, setSelectedCompletionIndex] = createSignal(0);
  const [cursorOffset, setCursorOffset] = createSignal(0);
  const [slashIndex, setSlashIndex] = createSignal(0);
  const [slashLists, setSlashLists] = createSignal<SlashCommandLists>(props.initialSlashLists);
  const [completionOptions, setCompletionOptions] = createSignal<string[]>([]);
  const [completionKind, setCompletionKind] = createSignal<CompletionContext>(null);
  const [completionHidden, setCompletionHidden] = createSignal(false);
  const [suppressedCompletionStart, setSuppressedCompletionStart] = createSignal<number | null>(null);
  const [isRunning, setIsRunning] = createSignal(false);
  const [activeAgentName, setActiveAgentName] = createSignal<string | undefined>(undefined);
  const [slashMenuOpen, setSlashMenuOpen] = createSignal(false);
  let suppressNextSubmit = false;
  let swallowNextKey = false;
  let suppressSlashAutoOpen = false;
  let lastSlashActive = false;

  let promptRef: TextareaRenderable | undefined;
  const terminal = useTerminalDimensions();
  const appendHistory = (entry: NoIdCliHistoryEntry) => {
    let hasIdHistory = fillCliHistoryId(entry);
    return appendHasIdHistory(hasIdHistory);
  };
  const appendHasIdHistory = (entry: CliHistoryEntry) => {
    setHistory((prev) => [...prev, entry]);
    return entry.id;
  };

  const updateHistory = (id: string, text: string) => {
    setHistory((prev) => prev.map((item) => (item.id === id ? { ...item, text } : item)));
  };
  let agentRuntime : EidolonCoreRuntime = new EidolonCoreRuntime(
    {
      fs: props.fsApi as FileSystemApi,
    },
    {
      fileStore: props.stateStore,
      llmClient: props.llm
    },
    {
      appLogger: (line: string) => props.logger.log(line),
      toolCallbacks: {
        // onStart: async (call: CliHistoryEntry) => {
        //   await props.logger.log(`[toolCallbacks] onStart: ${JSON.stringify(call)}`);
  
        //   const id = appendHasIdHistory(call);
        //   return id;
        // },
        // onResult: async (result: CliHistoryEntry) => {
        //   await props.logger.log(`[toolCallbacks] onResult: ${JSON.stringify(result)}`);
  
        //   appendHasIdHistory(result);
        // },

      },
    },
    {}
  );
  const runner = new AgentRunner(agentRuntime);

  const setPromptValue = (value: string, moveCursorToEnd = false) => {
    setInputValue(value);
    queueMicrotask(() => {
      if (promptRef) {
        promptRef.setText(value, { history: false });
      }
      if (moveCursorToEnd) {
        const applyCursor = () => {
          const displayLen = Bun.stringWidth(promptRef?.plainText ?? value);
          if (promptRef) {
            promptRef.cursorOffset = displayLen;
            promptRef.editorView?.setCursorByOffset?.(displayLen);
          }
          setCursorOffset(displayLen);
        };
        applyCursor();
        setTimeout(applyCursor, 0);
      }
    });
  };

  const completionContext = createMemo<CompletionContext>(() => {
    const value = inputValue();
    const cursor = cursorOffset();
    const markers = [
      { kind: "file" as const, token: "@file:" },
      { kind: "agent" as const, token: "@agent:" },
    ];
    let closest: CompletionContext = null;
    let bestIdx = -1;
    for (const marker of markers) {
      const idx = value.lastIndexOf(marker.token, cursor);
      if (idx !== -1 && idx >= bestIdx) {
        bestIdx = idx;
        const basePrefix = value.slice(0, idx + marker.token.length);
        const partial = value.slice(idx + marker.token.length);
        closest = { kind: marker.kind, basePrefix, partial, startIdx: idx };
      }
    }
    return closest;
  });

  let completionRequestId = 0;
  createEffect(() => {
    const ctx = completionContext();
    if (!ctx) {
      setCompletionOptions([]);
      setCompletionKind(null);
      setSelectedCompletionIndex(0);
      setCompletionHidden(false);
      setSuppressedCompletionStart(null);
      return;
    }
    const suppressed = suppressedCompletionStart();
    if (suppressed !== null && suppressed === ctx.startIdx) {
      setCompletionOptions([]);
      setCompletionKind(ctx);
      setCompletionHidden(true);
      return;
    }
    setCompletionKind(ctx);
    setCompletionHidden(false);
    if (ctx.kind === "file") {
      const current = ++completionRequestId;
      listPathChoices(`@file:${ctx.partial}`, props.workspace).then((choices) => {
        if (current === completionRequestId) {
          const filtered = ctx.partial
            ? choices.filter((choice) => choice.toLowerCase().startsWith(ctx.partial.toLowerCase()))
            : choices;
          setCompletionOptions(filtered.length ? filtered : choices);
          setSelectedCompletionIndex(0);
        }
      });
    } else {
      const agents = loadAgents(props.workspace)
        .map((a) => a.name)
        .filter((name) => name.startsWith(ctx.partial));
      setCompletionOptions(agents);
      setSelectedCompletionIndex(0);
    }
  });

  const suggestion = createMemo(() =>
    buildSuggestion(inputValue(), completionKind(), completionOptions(), selectedCompletionIndex())
  );

  const slashActive = createMemo(() => inputValue().trimStart().startsWith("/"));

  createEffect(() => {
    const active = slashActive();
    if (!active) {
      suppressSlashAutoOpen = false;
      setSlashMenuOpen(false);
      lastSlashActive = false;
      return;
    }
    const transitioned = !lastSlashActive && active;
    lastSlashActive = active;
    if (pickerOpen()) {
      setSlashMenuOpen(false);
      return;
    }
    if (transitioned) {
      suppressSlashAutoOpen = false;
    }
    if (!suppressSlashAutoOpen) {
      setSlashMenuOpen(true);
    }
  });

  const layoutHeights = createMemo(() => {
    const dims = terminal();
    const totalHeight = Math.max(4, dims.height);
    const available = Math.max(1, totalHeight - 2);
    const desiredContentLines = Math.max(1, inputValue().split("\n").length);
    const minInputHeight = 3;
    const maxInputHeight = available;
    const desiredInputHeight = desiredContentLines + 2;
    let inputH = Math.max(minInputHeight, Math.min(maxInputHeight, desiredInputHeight));
    let historyH = available - inputH;

    if (historyH < 0) {
      inputH = available;
      historyH = 0;
    }
    if (available >= minInputHeight + 1 && historyH === 0) {
      inputH = Math.max(minInputHeight, available - 1);
      historyH = 1;
    }
    return { totalHeight, available, inputH, historyH };
  });

  const innerInputHeight = () => Math.max(1, layoutHeights().inputH - 2);

  const normalizePromptScroll = () => {
    if (!promptRef) return;
    const current = promptRef.cursorOffset ?? 0;
    promptRef.editorView?.setCursorByOffset(0);
    promptRef.editorView?.setCursorByOffset(current);
  };

  const normalizePromptScrollDelayed = () => {
    queueMicrotask(normalizePromptScroll);
    setTimeout(normalizePromptScroll, 0);
  };

  createEffect(() => {
    layoutHeights().inputH;
    normalizePromptScrollDelayed();
  });

  const paletteEntries = createMemo(() => [
    ...slashLists().execute.map((cmd) => ({ mode: "execute" as const, cmd })),
    ...slashLists().insert.map((cmd) => ({ mode: "insert" as const, cmd })),
  ]);

  const slashFilter = createMemo(() => {
    const trimmed = inputValue().trimStart();
    if (!trimmed.startsWith("/")) return "";
    const firstToken = trimmed.split(/\s+/)[0];
    return firstToken.toLowerCase();
  });

  const filteredPaletteEntries = createMemo(() => {
    const entries = paletteEntries();
    const filter = slashFilter();
    if (!filter || filter === "/") return entries;
    return entries.filter((entry) => entry.cmd.name.toLowerCase().startsWith(filter));
  });

  createEffect(() => {
    const list = filteredPaletteEntries();
    if (!list.length) {
      setSlashIndex(0);
      return;
    }
    const clamped = Math.max(0, Math.min(slashIndex(), list.length - 1));
    if (clamped !== slashIndex()) {
      setSlashIndex(clamped);
    }
  });

  const selectedSlash = createMemo(() => filteredPaletteEntries()[slashIndex()] ?? null);

  const statusLineText = createMemo(() => {
    const agentLabel = activeAgentName() ? `agent: ${activeAgentName()}` : "agent: default";
    const modelLabel = props.configInfo.provider
      ? `model: ${props.configInfo.provider}/${props.configInfo.apiKind || "openai"}`
      : "model: stub";
    return `workspace: ${props.workspace} • ${agentLabel} • ${modelLabel}`;
  });

  const shortcutLineText = createMemo(
    () =>
      "Keys: Enter=submit • Ctrl+Enter=newline • Tab=accept completion/palette • / for slash menu • Ctrl+F=open files • Arrow keys=history or completion"
  );

  const createTicker = (content: () => string) => {
    const [offset, setOffset] = createSignal(0);

    createEffect(() => {
      content(); // reset on content change
      setOffset(0);
    });

    createEffect(() => {
      const timer = setInterval(() => setOffset((v) => v + 1), 300);
      onCleanup(() => clearInterval(timer));
    });

    return createMemo(() => {
      const padded = `${content()}   `;
      const width = Math.max(1, terminal().width - 2);
      const doubled = padded + padded;
      const start = offset() % padded.length;
      const slice = doubled.slice(start, start + width);
      return slice.padEnd(width, " ");
    });
  };

  const statusTicker = createTicker(statusLineText);
  const shortcutTicker = createTicker(shortcutLineText);

  const acceptSlashCommand = async () => {
    const selection = selectedSlash();
    if (!selection) return;
    if (selection.mode === "insert") {
      const base = selection.cmd.name;
      const spacer = inputValue() && !inputValue().endsWith(" ") ? " " : "";
      setPromptValue(`${base}${spacer}`, true);
      setSlashMenuOpen(false);
      suppressSlashAutoOpen = true;
      return;
    }
    await runSlash(selection.cmd, "");
    setSlashMenuOpen(false);
    suppressSlashAutoOpen = true;
  };

  const refreshSlashLists = async () => {
    const lists = await props.loadSlashLists();
    setSlashLists(lists);
    if (slashIndex() >= filteredPaletteEntries().length) {
      setSlashIndex(0);
    }
  };

  createEffect(() => {
    if (slashActive()) {
      void refreshSlashLists();
    }
  });

  const submitCommand = (value: string) => {
    if (suppressNextSubmit) {
      suppressNextSubmit = false;
      return;
    }
    if (isRunning()) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    if (slashActive()) {
      const selection = selectedSlash();
      if (selection) {
        if (selection.mode === "insert") {
          const base = selection.cmd.name;
          const rest = trimmed.slice(1);
          const spacer = inputValue() && !inputValue().endsWith(" ") ? " " : "";
          setPromptValue(`${base}${spacer}${rest ? rest : ""}`, true);
          setSlashMenuOpen(false);
          suppressSlashAutoOpen = true;
          return;
        }
        void runSlash(selection.cmd, trimmed.slice(selection.cmd.name.length).trim());
        setSlashMenuOpen(false);
        suppressSlashAutoOpen = true;
        return;
      }
    }

    if (trimmed.startsWith("/")) {
      const first = trimmed.split(/\s+/)[0];
      const found =
        slashLists().execute.find((c) => c.name === first) || slashLists().insert.find((c) => c.name === first);
      if (found && found.mode === "insert") {
        const spacer = trimmed.endsWith(" ") ? "" : " ";
        setPromptValue(`${found.name}${spacer}`, true);
        setSlashMenuOpen(false);
        suppressSlashAutoOpen = true;
        return;
      }
      if (found) {
        void runSlash(found, trimmed.slice(first.length).trim());
        setSlashMenuOpen(false);
        suppressSlashAutoOpen = true;
        return;
      }
    }
    void runChat(trimmed);
  };

  const resetHistoryIndex = () => setHistoryIndex(null);

  const stepHistory = (direction: -1 | 1) => {
    const entries = history().filter((h) => h.role === "user");
    if (!entries.length) return;
    const lastIndex = entries.length - 1;
    let nextIndex = historyIndex();
    if (nextIndex === null) {
      nextIndex = direction === -1 ? lastIndex : entries.length;
    } else {
      nextIndex += direction;
    }
    if (nextIndex < 0) nextIndex = 0;
    if (nextIndex > lastIndex) {
      resetHistoryIndex();
      setPromptValue("");
      return;
    }
    setHistoryIndex(nextIndex);
    const selected = entries[nextIndex];
    if (selected) {
      setPromptValue(selected.text.replace(/^>\s*/, ""));
    }
  };

  const acceptSuggestion = () => {
    const next = suggestion();
    if (next && next !== inputValue()) {
      const needsSpace = completionKind()?.kind === "file";
      setPromptValue(needsSpace ? `${next} ` : next, true);
      resetHistoryIndex();
    }
  };

  const openPicker = () => {
    setFiles(readWorkingDirectory(props.workspace));
    setSelectedFileIndex(0);
    setSlashMenuOpen(false);
    setCompletionHidden(true);
    suppressSlashAutoOpen = true;
    setPickerOpen(true);
  };

  const closePicker = () => {
    setPickerOpen(false);
    if (promptRef) {
      promptRef.focus();
    }
  };

  const handleFileSelect = (_index: number, option: SelectOption | null) => {
    if (!option) return;
    const filePath = "path" in option ? (option as FileOption).path : option.name;
    const base = promptRef?.plainText ?? inputValue();
    const spacer = base && !base.endsWith(" ") ? " " : "";
    setPromptValue(`${base}${spacer}@file:${filePath} `, true);
    suppressNextSubmit = true;
    swallowNextKey = true;
    setSlashMenuOpen(false);
    const newText = `${base}${spacer}@file:${filePath} `;
    const startIdx = newText.lastIndexOf("@file:");
    if (startIdx !== -1) {
      setSuppressedCompletionStart(startIdx);
      setCompletionHidden(true);
    } else {
      setCompletionHidden(false);
    }
    closePicker();
  };

  const handlePromptKey = (key: KeyEvent) => {
    if (swallowNextKey) {
      swallowNextKey = false;
      key.preventDefault();
      return;
    }
    if (key.name === "escape") {
      if (pickerOpen()) {
        key.preventDefault();
        closePicker();
        return;
      }
      if (completionContext()?.kind === "file") {
        key.preventDefault();
        setCompletionHidden(true);
        setCompletionOptions([]);
        const ctx = completionContext();
        if (ctx?.kind === "file") {
          setSuppressedCompletionStart(ctx.startIdx);
        }
        return;
      }
      if (slashMenuOpen()) {
        key.preventDefault();
        setSlashMenuOpen(false);
        suppressSlashAutoOpen = true;
        return;
      }
    }
    if (key.name === "linefeed" || key.sequence === "\n") {
      key.preventDefault();
      promptRef?.newLine();
      normalizePromptScrollDelayed();
      return;
    }

    if (key.name === "return") {
      key.preventDefault();
      if (key.shift || key.ctrl) {
        promptRef?.newLine();
        normalizePromptScrollDelayed();
        return;
      }
      if (slashActive()) {
        void acceptSlashCommand();
        return;
      }
      if (completionContext() && completionOptions().length > 0) {
        acceptSuggestion();
        return;
      }
      submitCommand(inputValue());
      normalizePromptScrollDelayed();
      return;
    }

    const isMultilineInput = inputValue().includes("\n") || layoutHeights().inputH > 3;
    const inCompletion =
      completionContext() && completionOptions().length > 0 && !pickerOpen() && !completionHidden();
    const inSlashMenu = slashMenuOpen() && slashActive() && filteredPaletteEntries().length > 0;

    if (key.name === "up") {
      if (inSlashMenu) {
        key.preventDefault();
        const total = filteredPaletteEntries().length;
        if (total > 0) {
          setSlashIndex((prev) => (prev - 1 + total) % total);
        }
        return;
      }
      if (!isMultilineInput || inCompletion) {
        key.preventDefault();
        if (inCompletion) {
          setSelectedCompletionIndex((prev) => {
            const total = completionOptions().length || 1;
            return (prev - 1 + total) % total;
          });
        } else {
          stepHistory(-1);
        }
      }
      return;
    }

    if (key.name === "down") {
      if (inSlashMenu) {
        key.preventDefault();
        const total = filteredPaletteEntries().length;
        if (total > 0) {
          setSlashIndex((prev) => (prev + 1) % total);
        }
        return;
      }
      if (!isMultilineInput || inCompletion) {
        key.preventDefault();
        if (inCompletion) {
          setSelectedCompletionIndex((prev) => {
            const total = completionOptions().length || 1;
            return (prev + 1) % total;
          });
        } else {
          stepHistory(1);
        }
      }
      return;
    }

    if (key.name === "tab") {
      key.preventDefault();
      if (inSlashMenu) {
        void acceptSlashCommand();
      } else {
        acceptSuggestion();
      }
      return;
    }

    if (key.ctrl && key.name === "f") {
      key.preventDefault();
      openPicker();
    }
  };

  createEffect(() => {
    if (!pickerOpen() && promptRef) {
      promptRef.focus();
    }
    normalizePromptScrollDelayed();
  });


  const runSlash = async (cmd: SlashCommand, extra: string) => {
    const content = await loadSlashCommandContent(cmd);
    if (!content && cmd.source === "builtin") {
      if (cmd.name === "/status") {
        appendHistory({
          role: "info",
          text: `Workspace ${props.workspace}; log ${props.logger.paths.logFile}; agent ${activeAgentName() || "default"}`,
        });
        return;
      }
      if (cmd.name === "/models") {
        const modelText = props.configInfo.provider
          ? `Provider ${props.configInfo.provider} apiKind=${props.configInfo.apiKind || "openai"}`
          : "Using stub LLM (no API key)";
        appendHistory({ role: "info", text: modelText });
        return;
      }
    }
    if (!content) {
      appendHistory({ role: "info", text: `No content for ${cmd.name}` });
      return;
    }
    const merged = extra ? `${content.trim()}\n\n${extra}` : content;
    setPromptValue("");
    await props.logger.log(`slash exec name=${cmd.name} path=${cmd.filePath || "builtin"} extra=${Boolean(extra)}`);
    await runChat(merged, { fromSlash: cmd.name });
  };

  const runChat = async (input: string, meta?: { fromSlash?: string }) => {
    if (isRunning()) return;
    setIsRunning(true);
    setPromptValue("");
    resetHistoryIndex();
    // TODO 未来改为通过core项目统一调度，在cli日志文件中记录日志
    appendHistory({ role: "user", text: input });
    await props.logger.log(`user: ${input}`);

    const agentName = extractAgentName(input);
    const processedInput = input.includes("@file:") ? normalizeFileRefs(input, props.workspace) : input;
    const fileRefs = extractFileRefs(processedInput);
    const agent = agentName ? getAgentByName(agentName, props.workspace) : undefined;
    if (agent) {
      setActiveAgentName(agent.name);
      await props.logger.log(`agent selected name=${agent.name} location=${agent.location}`);
    } else if (agentName) {
      await props.logger.log(`agent not found name=${agentName}`);
    }

    try {
      const extraSystems: string[] = [];
      if (agent?.systemPrompt) {
        extraSystems.push(agent.systemPrompt);
      }
      if (fileRefs.length) {
        for (const ref of fileRefs) {
          try {
            const content = await props.fsApi.readFile(ref);
            extraSystems.push(`@file:${content.path}\n${content.content}`);
          } catch (err: any) {
            await props.logger.log(`file preload failed path=${ref} error=${err?.message || err}`);
          }
        }
      }

      const streamState = { inUnquote: false, hidden: "" };

      let streamed = "";
      let lastMsgId: string = '';
      let assistantId: string = '';
      let assistantVisible = true;
      const result = await runner.kick(
        processedInput,
        {
          onToken: (msgId: string, chunk) => {
            if (!chunk) return;
            if (lastMsgId !== msgId) {
              // init
              lastMsgId = msgId;
              streamed = "";
              assistantId = appendHistory({ role: "assistant", text: "" });
            }
            streamed += chunk;

            let unquoteStartCnt = countOccurrences(streamed, UnquoteStartMark);
            let unquoteEndCnt = countOccurrences(streamed, UnquoteEndMark);
            // naive判断实现：unquote start end成对，则认为可以输出
            let newVisibleState = (unquoteStartCnt == unquoteEndCnt);
            let isStateSwitch = (assistantVisible != newVisibleState)
            assistantVisible = newVisibleState;

            if (assistantVisible) {
              let activeCliEntry = history().find((h) => h.id === assistantId);
              
              if (isStateSwitch) {
                // 从!unquote_end后产生的新消息，创建一个新的cli history记录
                // 使用!unquote_end后的内容作为初始消息
                let textAfterUnquoteEnd = getStringAfterLastUnquoteEnd(streamed);
                assistantId = appendHistory({ role: "assistant", text: textAfterUnquoteEnd });
              } else {
                let current = activeCliEntry?.text || "";
                let historyContent = `${current}${chunk}`;
                let noToolcallBlocksContent = stripToolcallBlocks(historyContent)
                updateHistory(assistantId, noToolcallBlocksContent);
              }
            }

            // let activeCliEntry = history().find((h) => h.id === assistantId);
            // if (activeCliEntry) {
            //   let current = activeCliEntry?.text || "";
            //   updateHistory(assistantId, `${current}${chunk}`);
            // }
          },
          onDone: () => undefined,

          onStart: async (call: CliHistoryEntry) => {
            await props.logger.log(`[toolCallbacks] onStart: ${JSON.stringify(call)}`);
    
            const id = appendHasIdHistory(call);
          },
          onResult: async (result: CliHistoryEntry) => {
            await props.logger.log(`[toolCallbacks] onResult: ${JSON.stringify(result)}`);
    
            appendHasIdHistory(result);
          },
        },
        extraSystems.length ? extraSystems : undefined
      );

      // appendHistory({ role: "assistant", text: streamed });

      if (!streamed) {
        // const cleaned = stripToolcallBlocks(result.assistantText);
        // if (cleaned.trim()) {
        //   updateHistory(assistantId, cleaned.trim());
        // }
      }
      await props.logger.log(
        `assistant summary textLen=${result.assistantText.trim().length} tools=${result.toolResults.length}`
      );
      if (result.todos.items.length) {
        const stats = result.todos.stats;
        appendHistory({
          role: "info",
          text: `todos total ${stats.total}, in_progress ${stats.inProgress}, completed ${stats.completed}`,
        });
        await props.logger.log(`todos total=${stats.total} in_progress=${stats.inProgress} completed=${stats.completed}`);
      }
    } catch (error: any) {
      appendHistory({ role: "info", text: `Error: ${error?.message || String(error)}` });
      await props.logger.log(`error: ${error?.message || String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  function countOccurrences(str: string, pattern: string) {
      const matches = str.match(new RegExp(pattern, 'g'));
      return matches ? matches.length : 0;
  }

  function getStringAfterLastUnquoteEnd(str: string) {
      const index = str.lastIndexOf(UnquoteEndMark);
      return index === -1 ? '' : str.substring(index + UnquoteEndMark.length);
  }

  const fileCompletionActive = createMemo(
    () => completionContext() && completionContext()!.kind === "file" && completionOptions().length > 0
  );

  const agentCompletionActive = createMemo(
    () => completionContext() && completionContext()!.kind === "agent" && completionOptions().length > 0
  );

  const paletteVisible = createMemo(() => {
    const list = filteredPaletteEntries();
    const maxEntries = 5; // keep visible window small so selected item stays within the viewport
    if (!list.length) return { start: 0, items: [] as typeof list, visibleCount: 0 };
    const visibleCount = Math.min(maxEntries, list.length);
    const clampedIndex = Math.max(0, Math.min(slashIndex(), list.length - 1));
    const start = Math.max(0, Math.min(list.length - visibleCount, clampedIndex - Math.floor(visibleCount / 2)));
    return { start, items: list.slice(start, start + visibleCount), visibleCount };
  });

  return (
    <box width="100%" height="100%" flexDirection="column" padding={0} gap={0} backgroundColor="#000000">
      <box height={1} paddingLeft={1} paddingRight={1}>
        <text fg="#9ca3af" content={statusTicker()} />
      </box>

      <box flexDirection="column" flexGrow={1} position="relative" gap={0} paddingLeft={1} paddingRight={1}>
        <Show when={layoutHeights().historyH > 0}>
          <scrollbox
            height={layoutHeights().historyH}
            padding={0}
            stickyScroll
            stickyStart="bottom"
            scrollY
            viewportOptions={{ padding: 0 }}
            contentOptions={{ gap: 0.25 }}
          >
            <For each={history()}>
              {(entry) => (
                <text wrapMode="word" content={`${cliRoleToSymbol(entry.role)}: ${entry.text}`} fg="#e5e7eb" />
              )}
            </For>
          </scrollbox>
        </Show>

        <box
          height={layoutHeights().inputH}
          border
          borderStyle="single"
          borderColor="#cbd5e1"
          flexDirection="column"
          padding={0}
          backgroundColor="#1f2937"
        >
          <box
            flexDirection="row"
            alignItems="flex-start"
            gap={1}
            paddingLeft={1}
            paddingRight={1}
            height={innerInputHeight()}
            width="100%"
            backgroundColor="#1f2937"
            flexGrow={1}
          >
            <text fg="#a855f7" content=">" />
            <textarea
              ref={promptRef}
              initialValue={inputValue()}
              placeholder={isRunning() ? "Running..." : "Type a command..."}
              onContentChange={() => {
                setInputValue(promptRef?.plainText ?? "");
                normalizePromptScrollDelayed();
              }}
              onCursorChange={() => setCursorOffset(promptRef?.cursorOffset ?? 0)}
              onKeyDown={handlePromptKey}
              wrapMode="none"
              scrollMargin={0}
              width="100%"
              height={innerInputHeight()}
              flexGrow={1}
              backgroundColor="#1f2937"
            />
          </box>
        </box>

        <Show
          when={
            !pickerOpen() &&
            !completionHidden() &&
            (fileCompletionActive() || agentCompletionActive()) &&
            completionOptions().length > 0
          }
        >
          <box
            position="absolute"
            right={1}
            top={1}
            width={32}
            padding={1}
            backgroundColor="#0b0b0b"
            border
            borderStyle="single"
            zIndex={20}
            flexDirection="column"
            gap={0}
          >
            <text
              fg="#9ca3af"
              content={completionContext()?.kind === "agent" ? "Agent suggestions" : "File suggestions"}
            />
            <For each={completionOptions().slice(0, 5)}>
              {(option, idx) => (
                <text
                  fg={idx() === selectedCompletionIndex() ? "#fbbf24" : "#cbd5e1"}
                  content={`${idx() === selectedCompletionIndex() ? "▶ " : "  "}${option}`}
                  wrapMode="word"
                />
              )}
            </For>
            <Show when={completionOptions().length > 5}>
              <text fg="#6b7280" content={`+${completionOptions().length - 5} more (use ↑/↓)`} />
            </Show>
          </box>
        </Show>

        <Show
          when={
            slashMenuOpen() && !pickerOpen() && slashActive() && filteredPaletteEntries().length > 0
          }
        >
          <box
            position="absolute"
            left={1}
            right={1}
            bottom={layoutHeights().inputH}
            padding={1}
            backgroundColor="#0b0b0b"
            border
            borderStyle="single"
            gap={0}
            zIndex={25}
          >
            <text fg="#9ca3af" content="Slash commands" />
            <scrollbox
              height={Math.min(12, Math.max(3, paletteVisible().visibleCount * 2 + 2))}
              flexGrow={0}
              padding={0}
              scrollY
            >
              <box flexDirection="column" gap={0}>
                <For each={paletteVisible().items}>
                  {(entry, idx) => {
                    const globalIdx = paletteVisible().start + idx();
                    const prev = filteredPaletteEntries()[globalIdx - 1];
                    const showHeader = globalIdx === 0 || prev?.mode !== entry.mode;
                    return (
                      <box flexDirection="column" gap={0}>
                        <Show when={showHeader}>
                          <text
                            fg="#6b7280"
                            content={entry.mode === "execute" ? "Run immediately" : "Insert into input"}
                          />
                        </Show>
                        <text
                          fg={globalIdx === slashIndex() ? "#fbbf24" : "#cbd5e1"}
                          content={`${globalIdx === slashIndex() ? "▶ " : "  "}${entry.cmd.name} (${
                            entry.mode === "execute" ? "run" : "insert"
                          })`}
                          wrapMode="word"
                        />
                        <text fg="#9ca3af" content={`   ${entry.cmd.description || entry.cmd.source}`} wrapMode="word" />
                      </box>
                    );
                  }}
                </For>
              </box>
            </scrollbox>
          </box>
        </Show>

        <Show when={pickerOpen()}>
          <box
            position="absolute"
            left={1}
            right={1}
            bottom={1}
            height={12}
            border
            borderStyle="double"
            padding={1}
            backgroundColor="#111827"
            flexDirection="column"
            gap={1}
            zIndex={10}
          >
            <text fg="#fbbf24" content="File picker • Enter to insert, Esc to close" />
            <select
              options={files()}
              selectedIndex={selectedFileIndex()}
              focused
              height={8}
              wrapSelection
              onChange={(index) => setSelectedFileIndex(index)}
              onSelect={handleFileSelect}
              onKeyDown={(key) => {
                if (key.name === "escape") {
                  key.preventDefault();
                  closePicker();
                }
              }}
            />
          </box>
        </Show>
      </box>

      <box height={1} paddingLeft={1} paddingRight={1}>
        <text fg="#9ca3af" wrapMode="word" content={shortcutTicker()} />
      </box>
    </box>
  );
};

async function main() {
  const workspace = process.cwd();
  const logger = await createSessionLogger(workspace);
  await logger.log(`session start workspace=${workspace}`);

  const activeModel: ModelProfile = await loadConfig(workspace);
  const hasApiKey = Boolean(activeModel.apiKey);
  const llm = hasApiKey ? createLLMClient(activeModel, logger.log) : new StubLLMClientActor();
  if (!hasApiKey) {
    await logger.log("using stub LLM (no api key)");
  } else {
    await logger.log(`llm initialized provider=${activeModel.provider} apiKind=${activeModel.apiKind || "openai"}`);
  }

  const fsApi = new LocalFileSystem(workspace);
  const stateStore = new FileStoreActorImpl(workspace, logger.paths.sessionId);
  const initialSlashLists = await loadSlashCommandLists(workspace);

  await render(() => (
    <App
      workspace={workspace}
      logger={logger}
      llm={llm}
      fsApi={fsApi}
      stateStore={stateStore}
      initialSlashLists={initialSlashLists}
      loadSlashLists={() => loadSlashCommandLists(workspace)}
      configInfo={{ provider: activeModel.provider, apiKind: activeModel.apiKind, hasApiKey }}
    />
  ));
}

main().catch((error) => {
  console.error("Fatal error", error);
  process.exitCode = 1;
});
