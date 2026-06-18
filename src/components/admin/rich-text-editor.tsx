"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ToolbarAction =
  | "bold"
  | "italic"
  | "underline"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "createLink"
  | "formatBlock"
  | "removeFormat";

const TOOLBAR_BUTTONS: { action: ToolbarAction; label: string; title: string; arg?: string }[] = [
  { action: "bold", label: "B", title: "Bold" },
  { action: "italic", label: "I", title: "Italic" },
  { action: "underline", label: "U", title: "Underline" },
  { action: "insertUnorderedList", label: "•", title: "Bullet list" },
  { action: "insertOrderedList", label: "1.", title: "Numbered list" },
  { action: "formatBlock", label: "H", title: "Heading", arg: "h2" },
  { action: "formatBlock", label: "P", title: "Paragraph", arg: "p" },
  { action: "createLink", label: "Link", title: "Insert link" },
  { action: "removeFormat", label: "Clear", title: "Clear formatting" },
];

function ToolbarButton({
  label,
  title,
  active,
  onClick,
}: {
  label: string;
  title: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded-md px-2 py-1 text-xs font-medium transition ${
        active
          ? "bg-brand-600 text-white"
          : "bg-surface-muted text-text-muted hover:bg-surface-raised hover:text-text"
      } ${label === "I" ? "italic" : ""} ${label === "B" ? "font-bold" : ""} ${label === "U" ? "underline" : ""}`}
    >
      {label}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = "180px",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder: string;
  minHeight?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || focused) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || "";
    }
  }, [value, focused]);

  const exec = useCallback(
    (command: string, arg?: string) => {
      document.execCommand(command, false, arg);
      const el = editorRef.current;
      if (el) onChange(el.innerHTML);
    },
    [onChange]
  );

  const handleInput = () => {
    const el = editorRef.current;
    if (el) onChange(el.innerHTML);
  };

  const handleLink = () => {
    const url = window.prompt("Link URL");
    if (!url) return;
    exec("createLink", url);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-muted">
      <div className="flex flex-wrap gap-1 border-b border-border bg-surface-raised px-2 py-1.5">
        {TOOLBAR_BUTTONS.map((btn) => (
          <ToolbarButton
            key={`${btn.action}-${btn.arg ?? ""}`}
            label={btn.label}
            title={btn.title}
            onClick={() => {
              if (btn.action === "createLink") {
                handleLink();
                return;
              }
              exec(btn.action, btn.arg);
            }}
          />
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline
        data-placeholder={placeholder}
        onInput={handleInput}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          handleInput();
        }}
        style={{ minHeight }}
        className="rich-text-editor px-3 py-2 text-sm text-text outline-none [&:empty]:before:pointer-events-none [&:empty]:before:text-text-muted [&:empty]:before:content-[attr(data-placeholder)] [&_a]:text-brand-400 [&_a]:underline [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold [&_li]:ml-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-2 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-surface [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_ul]:list-disc [&_ul]:pl-4"
        suppressContentEditableWarning
      />
    </div>
  );
}