import type { AnchorHTMLAttributes } from "react";
import "katex/dist/katex.min.css";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

const markdownComponents = {
  a: ({ href, children, ...anchorAttributes }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-sky-400 underline-offset-2 hover:underline"
      {...anchorAttributes}
    >
      {children}
    </a>
  ),
};

export function MarkdownBlock({ text }: { text: string }) {
  if (!text.trim()) return null;

  return (
    <div
      className="prose prose-invert prose-sm max-w-none
        prose-headings:font-display prose-headings:tracking-tight
        prose-pre:bg-zinc-900/80 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-lg
        prose-code:text-sky-300 prose-code:before:content-none prose-code:after:content-none
        prose-a:text-sky-400
        [&_.katex]:text-zinc-100
        [&_.katex-display]:overflow-x-auto [&_.katex-display]:py-1"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
        components={markdownComponents}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
