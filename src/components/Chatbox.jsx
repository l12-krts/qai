import { Card, Button, Input } from "@heroui/react";
import { IoAdd, IoArrowUp } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";

export default function Chatbox({ content, setContent, onSend, placeholder }) {
  const handleSend = () => {
    if (!(content.length > 0)) return;
    onSend(content);
    setContent("");
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 flex flex-row justify-center bg-transparent h-20 pb-4 pl-4 pr-4">
      <Card className="bg-surface shadow-[0_0_5px] flex flex-row h-16 w-96 p-3 shadow-black/20">
        {/* TODO: Add dropdown menu with upload file/image capability */}
        <Button className={"w-10 h-10 bg-surface active:scale-90 text-white text-xl focus:ring-0 focus:outline-none focus:ring-transparent"}>
          <IoAdd className="scale-120"></IoAdd>
        </Button>
        <Input
          placeholder={placeholder}
          className={"bg-surface focus:ring-0 focus:outline-none focus:ring-transparent focus:outline-transparent w-64 -translate-x-3.5"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        ></Input>
        <Button
          className={"w-10 h-10 ml-auto transition-all active:scale-90 focus:ring-0 focus:outline-none focus:ring-transparent"}
          isDisabled={!(content.length > 0)}
          onClick={handleSend}
        >
          <IoArrowUp className="scale-120"></IoArrowUp>
        </Button>
      </Card>
    </div>
  );
}