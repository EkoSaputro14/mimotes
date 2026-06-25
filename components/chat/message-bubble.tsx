"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import CitationMarker from "./citation-marker";
import SourcePreview from "./source-preview";
import FeedbackBar from "./feedback-bar";
import { cn } from "@/lib/utils";
import { Bot, BookOpen } from "lucide-react";

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
  isStreaming?: boolean;
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

function hasCitations(text: string): boolean {
  return /\[\d+(?:,\s*\d+)*\](?!\()/g.test(text);
}

function parseContentWithCitations(
  text: string,
  onCitationClick: (index: number) => void,
  activeCitation: number | null
) {
  const parts: React.ReactNode[] = [];
  const regex = /\[(\d+(?:,\s*\d+)*)\](?!\()/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

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

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function processMarkdownChildren(
  children: React.ReactNode,
  onCitationClick: (index: number) => void,
  activeCitation: number | null
): React.ReactNode {
  if (typeof children === "string") {
    return hasCitations(children)
      ? parseContentWithCitations(children, onCitationClick, activeCitation)
      : children;
  }
  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === "string" && hasCitations(child)) {
        return (
          <span key={i}>
            {parseContentWithCitations(child, onCitationClick, activeCitation)}
          </span>
        );
      }
      return child;
    });
  }
  return children;
}

function createMarkdownComponents(
  onCitationClick: (index: number) => void,
  activeCitationRef: React.RefObject<number | null>
) {
  const withCitations = (children: React.ReactNode) =>
    processMarkdownChildren(children, onCitationClick, activeCitationRef.current);

  return {
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="mb-3 last:mb-0 leading-[1.75]" {...props}>
        {withCitations(children)}
      </p>
    ),
    ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className="mb-3 ml-4 list-disc space-y-1 marker:text-muted-foreground/40" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className="mb-3 ml-4 list-decimal space-y-1 marker:text-muted-foreground/40 marker:text-xs" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
      <li className="leading-[1.65]" {...props}>
        {withCitations(children)}
      </li>
    ),
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 className="text-lg font-semibold mb-2 mt-4 first:mt-0 text-foreground" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0 text-foreground" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 className="text-sm font-semibold mb-1.5 mt-2.5 first:mt-0 text-foreground" {...props}>
        {children}
      </h3>
    ),
    blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
      <blockquote
        className="border-l-2 border-primary/20 pl-3 py-1 mb-3 text-muted-foreground italic"
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
            className="bg-muted/60 text-foreground px-1.5 py-0.5 rounded text-[0.85em] font-mono"
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
        className="bg-muted/30 border border-border/50 rounded-xl p-4 overflow-x-auto mb-3 text-[13px] leading-[1.6]"
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
        className="border border-border bg-muted/40 px-3 py-2 text-left font-semibold text-xs"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
      <td className="border border-border/50 px-3 py-2" {...props}>
        {children}
      </td>
    ),
    hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
      <hr className="border-border/50 my-4" {...props} />
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

  const activeCitationRef = useRef<number | null>(null);
  activeCitationRef.current = activeCitation;

  const timestamp = formatTime(message.createdAt);
  const fullTimestamp = (() => {
    try {
      const d = new Date(message.createdAt);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  })();
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
    () => createMarkdownComponents(handleCitationClick, activeCitationRef),
    [handleCitationClick]
  );

  return (
    <div
      className={cn(
        "group relative flex flex-col",
        isUser ? "items-end" : "items-start"
      )}
      role="article"
      aria-label={isUser ? "Anda" : "Mimotes"}
    >
      {/* AI label */}
      {!isUser && (
        <div className="flex items-center gap-2 px-1 mb-1.5 ml-1">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Bot className="h-3 w-3 text-primary" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Mimotes
          </span>
        </div>
      )}

      <div
        className={cn(
          "flex items-start gap-3 w-full",
          isUser && "flex-row-reverse"
        )}
      >
        {/* Message content */}
        <div
          className={cn(
            "flex flex-col gap-1",
            isUser ? "max-w-[85%] md:max-w-[70%]" : "max-w-[85%] md:max-w-[80%]"
          )}
        >
          <div
            className={cn(
              "relative px-4 py-3 pb-4",
              isUser
                ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md"
                : "bg-muted/40 text-foreground border border-border/40 rounded-2xl rounded-tl-md"
            )}
          >
            {isUser ? (
              <div className="whitespace-pre-wrap break-words leading-[1.65] text-[14px]">
                {message.content}
              </div>
            ) : (
              <div className="markdown-body break-words text-[14px]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={markdownComponents}
                >
                  {message.content}
                </ReactMarkdown>
                {isStreaming && (
                  <span className="inline-block w-[3px] h-4 bg-primary rounded-full animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            )}
          </div>

          {/* FeedbackBar */}
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
            <span className="text-[11px] text-muted-foreground/60 px-1">
              <span className="sr-only">{fullTimestamp}</span>
              <span aria-hidden="true">{timestamp}</span>
            </span>
          )}
        </div>
      </div>

      {/* Sources */}
      {!isUser && hasSourceData && (
        <div className="mt-2 pl-9 space-y-1.5 w-full max-w-full">
          <div className="flex items-center gap-1.5 mt-1 mb-1.5">
            <BookOpen className="h-3.5 w-3.5 text-primary/70" />
            <span className="text-xs font-medium text-primary/70">Sumber</span>
          </div>
          {sources.map((source, index) => (
            <SourcePreview
              key={`${message.id}-source-${index}`}
              source={source}
              index={index + 1}
              isHighlighted={
                activeCitation === index + 1 ||
                highlightedSource === index + 1
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
