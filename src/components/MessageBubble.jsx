import { useState, useEffect, useRef, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";
import {
  IoCopyOutline,
  IoCheckmark,
  IoRefresh,
  IoThumbsUpOutline,
  IoThumbsDownOutline,
} from "react-icons/io5";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const spring = { type: "spring", stiffness: 380, damping: 34, mass: 1.3 };

const bubbleVariants = {
  initial: { opacity: 0, y: 60, scaleX: 0.7, filter: "blur(8px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0)",
    scaleX: 1,
    transition: {
      default: spring,
      scaleX: { type: "spring", stiffness: 200, damping: 18, mass: 0.4 },
    },
  },
};

const REMARK_PLUGINS = [remarkGfm];

const CodeBlock = memo(function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <div className="relative my-1 rounded-xl overflow-hidden border border-white/10 bg-[#1e1e1e] text-left">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10">
        <span
          className="text-xs text-foreground/50 lowercase"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {language || "text"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-foreground/50 hover:text-foreground transition-colors"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={copied ? "check" : "copy"}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex"
            >
              {copied ? <IoCheckmark /> : <IoCopyOutline />}
            </motion.span>
          </AnimatePresence>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "0.75rem 1rem",
          background: "transparent",
          fontSize: "0.8125rem",
          fontFamily: "'JetBrains Mono', monospace",
        }}
        codeTagProps={{
          style: { fontFamily: "'JetBrains Mono', monospace" },
        }}
        wrapLongLines
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
});

function makeMarkdownComponents(isUser) {
  return {
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    ul: ({ children }) => (
      <ul className="mb-2 last:mb-0 list-disc pl-5 space-y-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-2 last:mb-0 list-decimal pl-5 space-y-1">{children}</ol>
    ),
    li: ({ children }) => <li>{children}</li>,
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline underline-offset-2 ${
          isUser ? "text-background/80 hover:text-background" : "text-blue-400 hover:text-blue-300"
        }`}
      >
        {children}
      </a>
    ),
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    blockquote: ({ children }) => (
      <blockquote
        className={`border-l-2 pl-3 my-2 ${
          isUser ? "border-background/30 text-background/80" : "border-white/20 text-foreground/70"
        }`}
      >
        {children}
      </blockquote>
    ),
    h1: ({ children }) => <h1 className="text-base font-semibold mt-3 mb-1.5">{children}</h1>,
    h2: ({ children }) => <h2 className="text-[15px] font-semibold mt-3 mb-1.5">{children}</h2>,
    h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
    hr: () => <hr className="my-3 border-white/10" />,
    table: ({ children }) => (
      <div className="overflow-x-auto my-2 rounded-lg border border-white/10">
        <table className="w-full text-xs">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
    th: ({ children }) => (
      <th className="px-2.5 py-1.5 text-left font-medium border-b border-white/10">
        {children}
      </th>
    ),
    td: ({ children }) => <td className="px-2.5 py-1.5 border-b border-white/5">{children}</td>,

    pre: ({ children }) => {
      const codeEl = children?.props;
      const className = codeEl?.className || "";
      const match = /language-(\w+)/.exec(className);
      const value = String(codeEl?.children ?? "").replace(/\n$/, "");
      return <CodeBlock language={match?.[1]} value={value} />;
    },

    code: ({ className, children }) => (
      <code
        className={`px-1.5 py-0.5 rounded-md text-[0.85em] whitespace-pre-wrap ${
          isUser ? "bg-background/15" : "bg-white/10"
        }`}
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {children}
      </code>
    ),
  };
}

const USER_MD_COMPONENTS = makeMarkdownComponents(true);
const ASSISTANT_MD_COMPONENTS = makeMarkdownComponents(false);

const Markdown = memo(function Markdown({ content, isUser }) {
  return (
    <div
      className={`text-sm leading-relaxed break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_pre]:my-1 ${
        isUser ? "" : "prose-invert-ish"
      }`}
    >
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        components={isUser ? USER_MD_COMPONENTS : ASSISTANT_MD_COMPONENTS}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

const ThinkingIndicator = memo(function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-1.5 text-sm text-foreground/50 py-1"
    >
      <motion.span
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        Thinking...
      </motion.span>
    </motion.div>
  );
});


function tokenize(text) {
  return text.match(/\S+|\s+/g) || [];
}


function StreamingText({ content, isUser, settled }) {
  const seenCountRef = useRef(0);
  const prevContentRef = useRef("");


  if (!content.startsWith(prevContentRef.current)) {
    seenCountRef.current = 0;
  }
  prevContentRef.current = content;

  const tokens = useMemoTokens(content);

  const revealCount = settled ? tokens.length : Math.max(seenCountRef.current, tokens.length - 4);
  const stableTokens = tokens.slice(0, revealCount);
  const freshTokens = tokens.slice(revealCount);

  seenCountRef.current = revealCount;

  const stableText = stableTokens.join("");

  return (
    <>
      <Markdown content={stableText} isUser={isUser} />
      {freshTokens.length > 0 && (
        <span className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          <AnimatePresence initial={false}>
            {freshTokens.map((token, i) => (
              <motion.span
                key={`${revealCount + i}-${token}`}
                initial={{ opacity: 0, filter: "blur(4px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                style={{ display: "inline" }}
              >
                {token}
              </motion.span>
            ))}
          </AnimatePresence>
        </span>
      )}
    </>
  );
}

function useMemoTokens(text) {
  const cache = useRef({ text: "", tokens: [] });
  if (cache.current.text !== text) {
    cache.current = { text, tokens: tokenize(text) };
  }
  return cache.current.tokens;
}

const MiniControls = memo(function MiniControls({ content, role }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut", delay: 0.1 }}
      className={`flex items-center gap-1 mt-1 ${role === "user" ? "justify-end" : "justify-start"}`}
    >
      <Button
        isIconOnly
        size="sm"
        variant="light"
        className="w-7 h-7 min-w-7 text-foreground/50 hover:text-foreground transition-colors"
        onClick={handleCopy}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={copied ? "check" : "copy"}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="flex"
          >
            {copied ? <IoCheckmark className="text-sm" /> : <IoCopyOutline className="text-sm" />}
          </motion.span>
        </AnimatePresence>
      </Button>

      {role === "assistant" && (
        <>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="w-7 h-7 min-w-7 text-foreground/50 hover:text-foreground transition-colors"
          >
            <IoRefresh className="text-sm" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="w-7 h-7 min-w-7 text-foreground/50 hover:text-foreground transition-colors"
          >
            <IoThumbsUpOutline className="text-sm" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="w-7 h-7 min-w-7 text-foreground/50 hover:text-foreground transition-colors"
          >
            <IoThumbsDownOutline className="text-sm" />
          </Button>
        </>
      )}
    </motion.div>
  );
});


function useThrottledValue(value, intervalMs = 100) {
  const [throttled, setThrottled] = useState(value);
  const lastFlush = useRef(0);
  const pendingValue = useRef(value);
  const timeoutRef = useRef(null);

  pendingValue.current = value;

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastFlush.current;

    if (elapsed >= intervalMs) {
      lastFlush.current = now;
      setThrottled(value);
      return;
    }

    if (timeoutRef.current) return; 

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      lastFlush.current = Date.now();
      setThrottled(pendingValue.current);
    }, intervalMs - elapsed);

    return () => {

    };
  }, [value, intervalMs]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return throttled;
}

function MessageBubble({ role, content, status, isLast }) {
  const isUser = role === "user";
  const isThinking = !isUser && status === "streaming" && content === "";
  const isDone = isUser || status === "done" || status === undefined;

  const displayContent = useThrottledValue(content, isUser ? 0 : 100);

  return (
    <motion.div
      layout="position"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={bubbleVariants}
      className={`flex flex-col w-full px-16 ${isUser ? "items-end" : "items-start"}`}
    >
      <div
        className={`max-w-[80%] whitespace-pre-wrap break-words ${
          isUser
            ? "bg-foreground text-background rounded-2xl rounded-br-md px-4 py-2.5"
            : "text-foreground"
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isThinking ? (
            <ThinkingIndicator key="thinking" />
          ) : isUser ? (
            <Markdown key="content" content={displayContent} isUser={isUser} />
          ) : (
            <StreamingText
              key="content"
              content={displayContent}
              isUser={isUser}
              settled={isDone}
            />
          )}
        </AnimatePresence>
      </div>

      {isLast && isDone && <MiniControls content={content} role={role} />}
    </motion.div>
  );
}

export default memo(MessageBubble, (prev, next) =>
  prev.role === next.role &&
  prev.content === next.content &&
  prev.status === next.status &&
  prev.isLast === next.isLast
);