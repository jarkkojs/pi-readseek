import {
  renderStaleContextPlaceholder,
  type ContextHygieneReport,
  type ContextHygieneStaleRecord,
} from "./context-hygiene.js";

type ContextToolResultMessage = {
  role?: unknown;
  toolCallId?: unknown;
  toolName?: unknown;
  content?: unknown;
  details?: unknown;
  [key: string]: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function isMaskableStaleTool(tool: string): boolean {
  return tool === "read" || tool === "grep" || tool === "search";
}

function staleRecordsByResultId(report: ContextHygieneReport): Map<string, ContextHygieneStaleRecord> {
  const records = new Map<string, ContextHygieneStaleRecord>();
  for (const candidate of report.staleCandidates) {
    for (const record of candidate.staleResults) {
      if (!record.originalResultId || !isMaskableStaleTool(record.originalTool)) continue;
      const existing = records.get(record.originalResultId);
      if (!existing || existing.invalidatingMutationEventId < record.invalidatingMutationEventId) {
        records.set(record.originalResultId, record);
      }
    }
  }
  return records;
}

function maskStaleToolResultMessage<T extends ContextToolResultMessage>(message: T, record: ContextHygieneStaleRecord): T {
  const details = isRecord(message.details) ? message.details : {};
  return {
    ...message,
    content: [{ type: "text" as const, text: renderStaleContextPlaceholder(record) }],
    details: {
      ...details,
      contextHygieneStale: record,
    },
  };
}

export function applyContextHygieneStaleContext<T extends ContextToolResultMessage>(
  messages: readonly T[],
  report: ContextHygieneReport,
): T[] {
  const staleByResultId = staleRecordsByResultId(report);
  if (staleByResultId.size === 0) return messages as T[];

  let changed = false;
  const nextMessages = messages.map((message) => {
    if (message.role !== "toolResult" || typeof message.toolCallId !== "string") return message;
    const staleRecord = staleByResultId.get(message.toolCallId);
    if (staleRecord) {
      if (message.toolName !== staleRecord.originalTool) return message;
      changed = true;
      return maskStaleToolResultMessage(message, staleRecord);
    }
    return message;
  });

  return changed ? nextMessages : (messages as T[]);
}
