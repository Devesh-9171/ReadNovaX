function renderInlineFormatting(line) {
  const tokens = String(line).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);

  return tokens.map((token, index) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={`${token}-${index}`}>{token.slice(2, -2)}</strong>;
    }

    if (token.startsWith('*') && token.endsWith('*')) {
      return <em key={`${token}-${index}`}>{token.slice(1, -1)}</em>;
    }

    return token;
  });
}

export default function BlogContent({ content }) {
  const blocks = String(content || '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-5 text-base leading-8 text-slate-700 dark:text-slate-200">
      {blocks.map((block, index) => {
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
        const isBulletList = lines.length > 1 && lines.every((line) => /^[-*]\s+/.test(line));

        if (isBulletList) {
          return (
            <ul key={`${block.slice(0, 24)}-${index}`} className="list-disc space-y-2 pl-6">
              {lines.map((line) => (
                <li key={line}>{renderInlineFormatting(line.replace(/^[-*]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`${block.slice(0, 24)}-${index}`}>
            {lines.map((line, lineIndex) => (
              <span key={`${line}-${lineIndex}`}>
                {lineIndex > 0 ? <br /> : null}
                {renderInlineFormatting(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
