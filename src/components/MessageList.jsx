import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";

export default function MessageList({ messages }) {
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const stickToBottomRef = useRef(true);

  // TODO: Fix the autoscroll (its ass)
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 80;
  };


  useEffect(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content) return;

    const observer = new ResizeObserver(() => {
      if (stickToBottomRef.current) {
        el.scrollTop = el.scrollHeight;
      }
    });

    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    stickToBottomRef.current = true;
  }, [messages.length]);

  if (!messages.length) return null;

  const lastId = messages[messages.length - 1].id;

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="absolute top-0 left-0 right-0 bottom-20 overflow-y-auto pt-16"
    >
      <div ref={contentRef} className="flex flex-col gap-3 max-w-2xl mx-auto">
        <AnimatePresence mode="popLayout" initial={false}>
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              status={msg.status}
              isLast={msg.id === lastId}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}