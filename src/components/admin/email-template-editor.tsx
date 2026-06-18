"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import type { EmailTemplateKey } from "@/types/config";
import { DEFAULT_EMAIL_TEMPLATES, EMAIL_TEMPLATE_META } from "@/lib/email-templates";

type EmailTemplateValue = {
  subject: string;
  bodyHtml: string;
};

function TokenChip({
  token,
  onInsert,
}: {
  token: { key: string; label: string; description: string };
  onInsert: (token: string) => void;
}) {
  return (
    <button
      type="button"
      title={token.description}
      onClick={() => onInsert(`{{${token.key}}}`)}
      className="rounded-full border border-border bg-surface px-2.5 py-0.5 font-mono text-xs text-brand-400 transition hover:border-brand-500 hover:bg-surface-raised"
    >
      {`{{${token.key}}}`}
    </button>
  );
}

export function EmailTemplateEditor({
  templateKey,
  value,
  onChange,
}: {
  templateKey: EmailTemplateKey;
  value: EmailTemplateValue;
  onChange: (value: EmailTemplateValue) => void;
}) {
  const meta = EMAIL_TEMPLATE_META[templateKey];

  function insertToken(token: string) {
    const subjectEl = document.getElementById(`subject-${templateKey}`) as HTMLInputElement | null;
    if (document.activeElement === subjectEl && subjectEl) {
      const start = subjectEl.selectionStart ?? subjectEl.value.length;
      const end = subjectEl.selectionEnd ?? start;
      const next =
        subjectEl.value.slice(0, start) + token + subjectEl.value.slice(end);
      onChange({ ...value, subject: next });
      requestAnimationFrame(() => {
        subjectEl.focus();
        const pos = start + token.length;
        subjectEl.setSelectionRange(pos, pos);
      });
      return;
    }

    const editor = document.querySelector(
      `[data-template-editor="${templateKey}"] [contenteditable]`
    ) as HTMLDivElement | null;

    if (editor) {
      editor.focus();
      document.execCommand("insertText", false, token);
      onChange({ ...value, bodyHtml: editor.innerHTML });
      return;
    }

    onChange({ ...value, bodyHtml: value.bodyHtml + token });
  }

  return (
    <div className="space-y-4" data-template-editor={templateKey}>
      <div>
        <label htmlFor={`subject-${templateKey}`}>Subject</label>
        <input
          id={`subject-${templateKey}`}
          value={value.subject}
          onChange={(e) => onChange({ ...value, subject: e.target.value })}
          placeholder="Email subject line"
        />
      </div>

      <div>
        <label>Body</label>
        <RichTextEditor
          value={value.bodyHtml}
          onChange={(bodyHtml) => onChange({ ...value, bodyHtml })}
          placeholder="Write your email content..."
        />
      </div>

      <div className="rounded-lg border border-border bg-surface px-3 py-3">
        <p className="mb-2 text-xs font-medium text-text-muted">Insert tokens</p>
        <p className="mb-3 text-xs text-text-muted">
          Click a token to insert it at the cursor. Tokens are replaced with real values when the
          email is sent.
        </p>
        <div className="flex flex-wrap gap-2">
          {meta.tokens.map((token) => (
            <TokenChip key={token.key} token={token} onInsert={insertToken} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function EmailTemplatesSection({
  templates,
  onChange,
}: {
  templates: Record<EmailTemplateKey, EmailTemplateValue>;
  onChange: (templates: Record<EmailTemplateKey, EmailTemplateValue>) => void;
}) {
  const keys = Object.keys(EMAIL_TEMPLATE_META) as EmailTemplateKey[];
  const [activeKey, setActiveKey] = useState<EmailTemplateKey>(keys[0]);

  function updateTemplate(key: EmailTemplateKey, next: EmailTemplateValue) {
    onChange({ ...templates, [key]: next });
  }

  function resetTemplate(key: EmailTemplateKey) {
    onChange({ ...templates, [key]: { ...DEFAULT_EMAIL_TEMPLATES[key] } });
  }

  const activeMeta = EMAIL_TEMPLATE_META[activeKey];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex shrink-0 flex-col gap-1 sm:w-56">
          {keys.map((key) => {
            const meta = EMAIL_TEMPLATE_META[key];
            const isActive = key === activeKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveKey(key)}
                className={`rounded-lg px-3 py-2 text-left text-sm transition ${
                  isActive
                    ? "bg-brand-600/20 font-medium text-brand-400"
                    : "text-text-muted hover:bg-surface-muted hover:text-text"
                }`}
              >
                {meta.label}
              </button>
            );
          })}
        </div>

        <div className="min-w-0 flex-1 space-y-4 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-medium text-text">{activeMeta.label}</h3>
              <p className="mt-1 text-sm text-text-muted">{activeMeta.description}</p>
            </div>
            <button
              type="button"
              onClick={() => resetTemplate(activeKey)}
              className="shrink-0 text-xs text-text-muted transition hover:text-brand-400"
            >
              Reset to default
            </button>
          </div>

          <EmailTemplateEditor
            key={activeKey}
            templateKey={activeKey}
            value={templates[activeKey]}
            onChange={(next) => updateTemplate(activeKey, next)}
          />
        </div>
      </div>
    </div>
  );
}