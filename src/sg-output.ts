import type { ReadseekLine, ReadseekRange } from "./readseek-value.js";
import {
  buildContextHygieneMetadata,
  buildFileResource,
  buildSymbolResource,
  type ContextHygieneMetadata,
  type ContextHygieneRehydrateDescriptor,
  type ContextHygieneResource,
} from "./context-hygiene.js";

export interface SgOutputFile {
  displayPath: string;
  path: string;
  ranges: ReadseekRange[];
  lines: ReadseekLine[];
  symbols?: Array<{ name: string; kind?: string }>;
}

export interface BuildSgOutputInput {
  pattern: string;
  files: SgOutputFile[];
  rehydrate?: ContextHygieneRehydrateDescriptor | null;
}

export interface SgOutputResult {
  text: string;
  readseekValue: {
    tool: "search";
    files: Array<{
      path: string;
      ranges: ReadseekRange[];
      lines: ReadseekLine[];
    }>;
  };
  contextHygiene: ContextHygieneMetadata;
}

export function buildSgOutput(input: BuildSgOutputInput): SgOutputResult {
  if (input.files.length === 0) {
    return {
      text: `No matches found for pattern: ${input.pattern}`,
      readseekValue: {
        tool: "search",
        files: [],
      },
      contextHygiene: buildContextHygieneMetadata({
        tool: "search",
        classification: "search-context",
        resources: [],
        rehydrate: input.rehydrate ?? undefined,
      }),
    };
  }

  const blocks: string[] = [];
  for (const file of input.files) {
    blocks.push(`--- ${file.displayPath} ---`);
    for (const line of file.lines) {
      blocks.push(`>>${line.anchor}|${line.display}`);
    }
  }

  const contextHygieneResources: ContextHygieneResource[] = [];
  for (const file of input.files) {
    contextHygieneResources.push(buildFileResource(file.path));
    for (const symbol of file.symbols ?? []) {
      contextHygieneResources.push(buildSymbolResource(file.path, symbol.name, symbol.kind));
    }
  }

  return {
    text: blocks.join("\n"),
    readseekValue: {
      tool: "search",
      files: input.files.map((file) => ({
        path: file.path,
        ranges: file.ranges.map((range) => ({ ...range })),
        lines: file.lines.map((line) => ({ ...line })),
      })),
    },
    contextHygiene: buildContextHygieneMetadata({
      tool: "search",
      classification: "search-context",
      resources: contextHygieneResources,
      rehydrate: input.rehydrate ?? undefined,
    }),
  };
}
