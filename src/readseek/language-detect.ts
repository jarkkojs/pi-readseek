import type { LanguageInfo } from "./types.js";

const EXTENSION_LANGUAGE_MAP: Record<string, LanguageInfo> = {
  ".rs": { id: "rust", name: "Rust" },
  ".c": { id: "cpp", name: "C" },
  ".cc": { id: "cpp", name: "C++" },
  ".cpp": { id: "cpp", name: "C++" },
  ".cxx": { id: "cpp", name: "C++" },
  ".hpp": { id: "c-header", name: "C/C++ Header" },
  ".h": { id: "c-header", name: "C/C++ Header" },
  ".hxx": { id: "c-header", name: "C/C++ Header" },
  ".java": { id: "java", name: "Java" },
};

export function detectLanguage(filePath: string): LanguageInfo | null {
  const normalized = filePath.toLowerCase();
  for (const [ext, language] of Object.entries(EXTENSION_LANGUAGE_MAP)) {
    if (normalized.endsWith(ext)) return language;
  }
  return null;
}

export function isSupported(filePath: string): boolean {
  return detectLanguage(filePath) !== null;
}

export function getSupportedExtensions(): string[] {
  return Object.keys(EXTENSION_LANGUAGE_MAP);
}
