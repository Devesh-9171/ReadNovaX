import { useEffect, useMemo, useRef } from 'react';
import { plainTextToRichHtml, sanitizeRichHtml } from '../utils/html';

const TOOLBAR_BUTTON = 'rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:hover:border-sky-400 dark:hover:text-sky-300';

function normalizeEditorValue(value) {
  if (!value) return '<p></p>';
  return sanitizeRichHtml(value || plainTextToRichHtml('')) || '<p></p>';
}

export default function RichTextEditor({ label, value, onChange, placeholder = 'Write here...', minHeight = 240 }) {
  const editorRef = useRef(null);
  const normalizedValue = useMemo(() => normalizeEditorValue(value), [value]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== normalizedValue) {
      editorRef.current.innerHTML = normalizedValue;
    }
  }, [normalizedValue]);

  const emitChange = () => {
    if (!editorRef.current) return;
    onChange(sanitizeRichHtml(editorRef.current.innerHTML));
  };

  const applyCommand = (command, commandValue = null) => {
    if (typeof document === 'undefined') return;
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  };

  const insertLink = () => {
    if (typeof window === 'undefined') return;
    const url = window.prompt('Enter a URL or internal path (for example /blog/my-post)');
    if (!url) return;
    const safeUrl = sanitizeRichHtml(`<a href="${url}">link</a>`).match(/href="([^"]+)"/)?.[1] || '';
    if (!safeUrl) return;

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    const anchorText = window.prompt('Anchor text', selectedText || 'Read more');
    if (!anchorText) return;

    applyCommand('insertHTML', `<a href="${safeUrl}">${anchorText}</a>`);
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" className={TOOLBAR_BUTTON} onClick={() => applyCommand('bold')} aria-label="Bold text">
          <strong>B</strong>
        </button>
        <button type="button" className={TOOLBAR_BUTTON} onClick={() => applyCommand('italic')} aria-label="Italic text">
          <em>I</em>
        </button>
        <button type="button" className={TOOLBAR_BUTTON} onClick={() => applyCommand('insertUnorderedList')} aria-label="Bullet list">
          • List
        </button>
        <button type="button" className={TOOLBAR_BUTTON} onClick={insertLink} aria-label="Insert link">
          🔗 Link
        </button>
      </div>
      <div
        ref={editorRef}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus-within:border-sky-400 dark:focus-within:ring-sky-400/10"
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        data-placeholder={placeholder}
        style={{ minHeight }}
      />
    </div>
  );
}
