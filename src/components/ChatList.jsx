import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, Input } from "@heroui/react";
import { IoSearch, IoTrashOutline, IoChatbubbleOutline } from "react-icons/io5";


function parseChatDate(dateStr) {
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function bucketLabel(date) {
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "Previous 7 days";
  if (diffDays <= 30) return "Previous 30 days";
  return "Older";
}

const BUCKET_ORDER = ["Today", "Yesterday", "Previous 7 days", "Previous 30 days", "Older"];

function groupChats(chats) {
  const groups = {};

  for (const chat of chats) {
    const parsed = parseChatDate(chat.date);
    const label = bucketLabel(parsed);
    if (!groups[label]) groups[label] = [];
    groups[label].push({ ...chat, _parsedDate: parsed });
  }

  // Sort within each bucket by date, newest first.
  for (const label of Object.keys(groups)) {
    groups[label].sort((a, b) => b._parsedDate - a._parsedDate);
  }

  return BUCKET_ORDER.filter((label) => groups[label]?.length).map((label) => ({
    label,
    chats: groups[label],
  }));
}

function ChatItem({ chat, openChat, onDeleteChat }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2 }}
      className="group relative"
    >
      <Button
        className="bg-transparent p-0 rounded-xl border-0 w-full justify-start h-auto hover:bg-white/5 transition-all"
        onClick={() => openChat(chat)}
      >
        <Card className="flex flex-row items-center gap-3 w-full bg-transparent shadow-none px-3 py-2.5">
          <span className="text-foreground/40 shrink-0">
            <IoChatbubbleOutline size={16} />
          </span>
          <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1">
            <span className="text-sm font-medium text-foreground truncate w-full text-left">
              {chat.name}
            </span>
            <span className="text-xs text-foreground/40">{chat.date}</span>
          </div>
        </Card>
      </Button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteChat?.(chat);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-lg text-foreground/40 hover:text-red-400 hover:bg-red-400/10"
        aria-label={`Delete ${chat.name}`}
      >
        <IoTrashOutline size={15} />
      </button>
    </motion.div>
  );
}

export default function ChatList({ chats, openChat, onDeleteChat }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return chats;
    const q = query.trim().toLowerCase();
    return chats.filter((chat) => chat.name.toLowerCase().includes(q));
  }, [chats, query]);

  const grouped = useMemo(() => groupChats(filtered), [filtered]);
  const isEmpty = chats.length === 0;
  const noResults = !isEmpty && filtered.length === 0;

  return (
    <div className="absolute inset-0 flex flex-col pt-16 pb-24 px-6">
      <div className="w-full max-w-md mx-auto flex flex-col flex-1 min-h-0">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chats..."
          startContent={<IoSearch className="text-foreground/40" size={16} />}
          className="mb-4 shrink-0"
          classNames={{
            inputWrapper: "bg-white/5 border border-white/10 hover:bg-white/10",
          }}
        />

        <div className="flex-1 min-h-0 overflow-y-auto -mx-2 px-2">
          {isEmpty && (
            <p className="text-sm text-foreground/40 text-center mt-10">
              No chats yet — start a new conversation.
            </p>
          )}

          {noResults && (
            <p className="text-sm text-foreground/40 text-center mt-10">
              No chats match "{query}".
            </p>
          )}

          <AnimatePresence initial={false}>
            {grouped.map((group) => (
              <div key={group.label} className="mb-4">
                <p className="text-xs font-medium text-foreground/40 px-3 mb-1.5 uppercase tracking-wide">
                  {group.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  <AnimatePresence initial={false}>
                    {group.chats.map((chat) => (
                      <ChatItem
                        key={chat.name + chat.date}
                        chat={chat}
                        openChat={openChat}
                        onDeleteChat={onDeleteChat}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}