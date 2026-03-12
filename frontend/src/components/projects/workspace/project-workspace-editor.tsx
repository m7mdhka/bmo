"use client";

import Editor from "@monaco-editor/react";

export function ProjectWorkspaceEditor({
  value,
  language,
  onChange,
}: {
  value: string;
  language?: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="relative h-full w-full min-w-0 overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage={language ?? "plaintext"}
        value={value}
        theme="vs-dark"
        onChange={(v) => onChange(v ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
