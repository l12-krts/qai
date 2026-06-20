import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  IoAdd,
  IoChevronForward,
  IoHomeOutline,
  IoHome,
  IoChatbubbleOutline,
  IoChatbubble,
  IoSettingsOutline,
  IoSettings,
} from "react-icons/io5";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: IoHomeOutline, iconFilled: IoHome },
  { id: "chats", label: "Chats", icon: IoChatbubbleOutline, iconFilled: IoChatbubble },
  { id: "settings", label: "Settings", icon: IoSettingsOutline, iconFilled: IoSettings },
];

export default function Sidebar({ active, setActive, onNewChat }) {
  const [opened, setOpened] = useState(false);

  return (
    <motion.div
      initial={false}
      animate={{
        width: opened ? 188 : 64,
        backgroundColor: opened ? "var(--sidebar-bg, rgba(20,20,24,0.8))" : "rgba(0,0,0,0)",
      }}
      transition={{ type: "spring", mass: 1.2, stiffness: 320, damping: 32 }}
      className={`absolute top-0 left-0 z-20 h-full pt-14 pb-4 px-2 flex flex-col border-r ${
        opened ? "backdrop-blur-xl border-white/5" : "border-transparent"
      }`}
    >
      {/* Toggle */}
      <button
        onClick={() => setOpened((v) => !v)}
        className="flex items-center justify-center w-10 h-10 mb-4 rounded-xl text-white/60 hover:text-white active:scale-70 duration-250 transition-all shrink-0"
      >
        <motion.span
          animate={{ rotate: opened ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <IoChevronForward size={16} />
        </motion.span>
      </button>

      {/* Nav items */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          const Icon = !isActive ? item.icon : item.iconFilled;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`relative flex items-center h-10 rounded-xl px-3 active:scale-70 duration-250 transition-all ${
                isActive
                  ? "text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <span className="relative z-10 w-[18px] h-[18px] flex items-center justify-center shrink-0">
                <Icon size={18}/>
              </span>
              <motion.span
                animate={{
                  width: opened ? "auto" : 0,
                  marginLeft: opened ? 12 : 0,
                  opacity: opened ? 1 : 0,
                }}
                transition={{ duration: 0.18 }}
                className="relative z-10 text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* New chat */}
      <button className="flex items-center h-10 rounded-xl px-3 text-white/50 hover:text-white active:scale-70 duration-250 transition-all" onClick={() => onNewChat()}>
        <span className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
          <IoAdd size={18} />
        </span>
        <motion.span
          animate={{
            width: opened ? "auto" : 0,
            marginLeft: opened ? 12 : 0,
            opacity: opened ? 1 : 0,
          }}
          transition={{ duration: 0.18 }}
          className="text-sm font-medium whitespace-nowrap overflow-hidden"
        >
          New chat
        </motion.span>
      </button>
    </motion.div>
  );
}