import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";
import { IoCopyOutline, IoCheckmark, IoRefresh, IoThumbsUpOutline, IoThumbsDownOutline } from "react-icons/io5";

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

function MiniControls({ content, role }) {
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
}

export default function MessageBubble({ role, content, isLast }) {
  const isUser = role === "user";

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
        className={`max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? "bg-foreground text-background rounded-2xl rounded-br-md px-4 py-2.5"
            : "text-foreground"
        }`}
      >
        {content}
      </div>

      {isLast && <MiniControls content={content} role={role} />}
    </motion.div>
  );
}