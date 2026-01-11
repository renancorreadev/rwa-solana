import { FC, useState } from 'react';
import { Check, Copy, FileCode } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  code: string;
  language: string;
  filename?: string;
}

// Simple syntax highlighting - process line by line to avoid breaking HTML
const highlightCode = (code: string, language: string): string => {
  const lines = code.split('\n');

  return lines.map(line => {
    // Escape HTML first
    let escaped = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Check if entire line is a comment (for bash/yaml)
    if ((language === 'bash' || language === 'yaml' || language === 'text') && escaped.trim().startsWith('#')) {
      return `<span class="text-gray-500 italic">${escaped}</span>`;
    }

    // Check for // comments (JS, TS, Rust, Go)
    if (escaped.includes('//')) {
      const parts = escaped.split('//');
      const codePart = highlightLine(parts[0], language);
      const commentPart = '//' + parts.slice(1).join('//');
      return `${codePart}<span class="text-gray-500 italic">${commentPart}</span>`;
    }

    return highlightLine(escaped, language);
  }).join('\n');
};

const highlightLine = (line: string, language: string): string => {
  const keywords: Record<string, string[]> = {
    rust: ['pub', 'fn', 'let', 'mut', 'const', 'struct', 'impl', 'enum', 'use', 'mod', 'self', 'Self', 'return', 'if', 'else', 'match', 'for', 'while', 'loop', 'break', 'continue', 'async', 'await', 'true', 'false', 'Result', 'Ok', 'Err', 'Some', 'None'],
    typescript: ['import', 'export', 'from', 'const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'for', 'while', 'class', 'interface', 'type', 'extends', 'implements', 'new', 'this', 'true', 'false', 'null', 'undefined', 'try', 'catch', 'throw'],
    javascript: ['import', 'export', 'from', 'const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'for', 'while', 'class', 'new', 'this', 'true', 'false', 'null', 'undefined'],
    go: ['package', 'import', 'func', 'var', 'const', 'type', 'struct', 'interface', 'map', 'chan', 'go', 'defer', 'return', 'if', 'else', 'for', 'range', 'switch', 'case', 'default', 'true', 'false', 'nil'],
    bash: ['if', 'then', 'else', 'fi', 'for', 'do', 'done', 'while', 'case', 'esac', 'function', 'return', 'export', 'source', 'echo', 'curl', 'docker', 'git', 'npm', 'cd', 'mkdir', 'cp', 'mv', 'rm', 'anchor', 'solana'],
    sql: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'ON', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'AND', 'OR', 'NOT', 'NULL', 'DEFAULT', 'CASCADE'],
    python: ['import', 'from', 'def', 'class', 'return', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'finally', 'with', 'as', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'lambda', 'async', 'await'],
  };

  const types: Record<string, string[]> = {
    rust: ['u8', 'u16', 'u32', 'u64', 'u128', 'i8', 'i16', 'i32', 'i64', 'i128', 'f32', 'f64', 'bool', 'String', 'str', 'Vec', 'Option', 'Context', 'Pubkey', 'Account', 'Program'],
    typescript: ['string', 'number', 'boolean', 'void', 'any', 'never', 'unknown', 'Promise', 'Array', 'Record', 'Partial', 'Required'],
    go: ['string', 'int', 'int8', 'int16', 'int32', 'int64', 'uint', 'float32', 'float64', 'bool', 'byte', 'error'],
  };

  let highlighted = line;

  // Highlight strings (but not inside already-highlighted spans)
  highlighted = highlighted.replace(
    /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,
    '<span class="text-green-400">$&</span>'
  );

  // Highlight keywords
  const langKeywords = keywords[language] || [];
  langKeywords.forEach((keyword) => {
    const regex = new RegExp(`(?<![\\w-])(${keyword})(?![\\w-])`, 'g');
    highlighted = highlighted.replace(
      regex,
      '<span class="text-purple-400">$1</span>'
    );
  });

  // Highlight types
  const langTypes = types[language] || [];
  langTypes.forEach((type) => {
    const regex = new RegExp(`(?<![\\w-])(${type})(?![\\w-])`, 'g');
    highlighted = highlighted.replace(
      regex,
      '<span class="text-cyan-400">$1</span>'
    );
  });

  return highlighted;
};

export const CodeBlock: FC<Props> = ({ code, language, filename }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightedCode = highlightCode(code.trim(), language);
  const lines = highlightedCode.split('\n');

  return (
    <div className="group relative rounded-xl overflow-hidden bg-gray-950 border border-gray-800 my-6">
      {/* Header */}
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-400 font-mono">{filename}</span>
          </div>
          <span className="text-xs text-gray-600 uppercase">{language}</span>
        </div>
      )}

      {/* Code */}
      <div className="relative overflow-x-auto">
        <pre className="p-4 text-sm leading-relaxed whitespace-pre">
          <code className="font-mono block">
            <div className="table w-full">
              {lines.map((line, i) => (
                <div key={i} className="table-row">
                  <span className="table-cell pr-4 text-right text-gray-600 select-none w-8 align-top">
                    {i + 1}
                  </span>
                  <span
                    className="table-cell text-gray-300 whitespace-pre"
                    dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }}
                  />
                </div>
              ))}
            </div>
          </code>
        </pre>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={clsx(
            'absolute top-3 right-3 p-2 rounded-lg transition-all duration-200',
            'opacity-0 group-hover:opacity-100',
            copied
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
          )}
          title="Copiar código"
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};
