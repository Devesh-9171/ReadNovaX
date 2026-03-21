import { useMemo } from 'react';
import { plainTextToRichHtml, sanitizeRichHtml } from '../utils/html';

export default function BlogContent({ content, html }) {
  const sanitizedHtml = useMemo(() => {
    const richSource = html || plainTextToRichHtml(content || '');
    return sanitizeRichHtml(richSource);
  }, [content, html]);

  return (
    <div
      className="rich-content text-base leading-8 text-slate-700 dark:text-slate-200"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml || '<p>Content preview will appear here.</p>' }}
    />
  );
}
