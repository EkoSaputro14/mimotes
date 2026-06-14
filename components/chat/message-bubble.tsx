"use client";

import { useState, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import CitationMarker from "./citation-marker";
import SourcePreview from "./source-preview";
import FeedbackBar from "./feedback-bar";
import { cn } from "@/lib/utils";

interface Source {
  documentId: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  createdAt: string;
}

function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}.${m}`;
  } catch {
    return "";
  }
}

/**
 * Check if text contains citation patterns like [1], [2], [1][2], [1,2,3]
 */
function hasCitations(text: string): boolean {
  return /\[\d+(?:,\s*\d+)*\]/.test(text);
}

/**
 * Parse text with inline citation markers into segments
 */
function parseContentWithCitations(
  text: string,
  onCitationClick: (index: number) => void,
  activeCitation: number | null
) {
  const parts: React.ReactNode[] = [];
  const regex = /\[(\d+(?:,\s*\d+)*)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before citation
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Parse citation numbers
    const nums = match[1].split(",").map((n) => parseInt(n.trim(), 10));
    parts.push(
      <span key={`cite-${match.index}`} className="inline-flex items-center gap-0.5 mx-0.5">
        {nums.map((num) => (
          <CitationMarker
            key={num}
            index={num}
            isActive={activeCitation === num}
            onClick={onCitationClick}
          />
        ))}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * Custom markdown components for better typography
 */
function createMarkdownComponents(
  onCitationClick: (index: number) => void,
  activeCitation: number | null
) {
  return {
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="mb-3 last:mb-0 leading-[1.7]" {...props}>
        {typeof children === "string" && hasCitations(children)
          ? parseContentWithCitations(children, onCitationClick, activeCitation)
          : children}
      </p>
    ),
    ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className="mb-3 ml-4 list-disc space-y-1.5 marker:text-muted-foreground/50" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className="mb-3 ml-4 list-decimal space-y-1.5 marker:text-muted-foreground/50 marker:text-xs" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
      <li className="leading-[1.6]" {...props}>
        {typeof children === "string" && hasCitations(children)
          ? parseContentWithCitations(children, onCitationClick, activeCitation)
          : children}
      </li>
    ),
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 className="text-base font-bold mb-2 mt-3 first:mt-0" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 className="text-sm font-semibold mb-1.5 mt-2.5 first:mt-0" {...props}>
        {children}
      </h3>
    ),
    blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
      <blockquote
        className="border-l-3 border-primary/30 pl-3 py-1 mb-3 text-muted-foreground italic"
        {...props}
      >
        {children}
      </blockquote>
    ),
    code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) => {
      const isInline = !className?.includes("language-");
      if (isInline) {
        return (
          <code
            className="bg-muted text-foreground px-1.5 py-0.5 rounded text-[0.85em] font-mono"
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <code className={cn("font-mono text-[13px]", className)} {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
      <pre
        className="bg-card border border-border rounded-lg p-4 overflow-x-auto mb-3 text-[13px] leading-[1.6]"
        {...props}
      >
        {children}
      </pre>
    ),
    a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline underline-offset-2"
        {...props}
      >
        {children}
      </a>
    ),
    table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
      <div className="overflow-x-auto mb-3">
        <table className="w-full text-sm border-collapse" {...props}>
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
      <th
        className="border border-border bg-muted px-3 py-2 text-left font-semibold text-xs"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
      <td className="border border-border px-3 py-2" {...props}>
        {children}
      </td>
    ),
    hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
      <hr className="border-border my-4" {...props} />
    ),
  };
}

export default function MessageBubble({
  message,
  onCitationClick,
  highlightedSource,
  isLastMessage = false,
  isStreaming = false,
  isLoading = false,
  onRegenerate,
}: {
  message: Message;
  onCitationClick?: (index: number) => void;
  highlightedSource?: number | null;
  isLastMessage?: boolean;
  isStreaming?: boolean;
  isLoading?: boolean;
  onRegenerate?: () => void;
}) {
  const isUser = message.role === "user";
  const [activeCitation, setActiveCitation] = useState<number | null>(null);

  const timestamp = formatTime(message.createdAt);
  const sources = message.sources || [];
  const hasSourceData = sources.length > 0;

  const handleCitationClick = useCallback(
    (index: number) => {
      setActiveCitation((prev) => (prev === index ? null : index));
      onCitationClick?.(index);
    },
    [onCitationClick]
  );

  const markdownComponents = useMemo(
    () => createMarkdownComponents(handleCitationClick, activeCitation ?? highlightedSource ?? null),
    [handleCitationClick, activeCitation, highlightedSource]
  );

  return (
    <div
      className={cn(
        "group relative flex flex-col",
        isUser ? "items-end" : "items-start"
      )}
    >
      <div
        className={cn(
          "flex items-start gap-3",
          isUser && "flex-row-reverse"
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0",
            isUser ? "bg-gray-600" : "bg-blue-600"
          )}
        >
          {isUser ? "U" : "AI"}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1 max-w-[85%] md:max-w-[80%]">
          <div
            className={cn(
              "relative px-4 py-3",
              isUser
                ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                : "bg-muted text-foreground rounded-2xl rounded-tl-sm"
            )}
          >
            {isUser ? (
              <div className="whitespace-pre-wrap break-words leading-[1.6]">
                {message.content}
              </div>
            ) : (
              <div className="markdown-body break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={markdownComponents}
                >
                  {message.content}
                </ReactMarkdown>
                {isStreaming && (
                  <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-text-bottom" />
                )}
              </div>
            )}
          </div>

          {/* FeedbackBar — for assistant messages only */}
          {!isUser && (
            <FeedbackBar
              content={message.content}
              isLastMessage={isLastMessage}
              isStreaming={isStreaming}
              isLoading={isLoading}
              onRegenerate={onRegenerate}
            />
          )}

          {/* Timestamp */}
          {timestamp && (
            <span className="text-[11px] text-muted-foreground px-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {timestamp}
            </span>
          )}
        </div>
      </div>

      {/* Sources — per-message, below the bubble */}
      {!isUser && hasSourceData && (
        <div className="mt-2 ml-11 space-y-1.5 max-w-[85%] md:max-w-[80%]">
          {sources.map((source, index) => (
            <SourcePreview
              key={`${message.id}-source-${index}`}
              source={source}
              index={index + 1}
              isHighlighted={activeCitation === index + 1 || highlightedSource === index + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
