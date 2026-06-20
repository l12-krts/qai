import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import WindowDecorations from "./components/WindowDecorations";
import Chatbox from "./components/Chatbox";
import MessageList from "./components/MessageList";
import BlurEdge from "./components/BlurEdge";
import { useState } from "react";
import Sidebar from "./components/Sidebar";

function App() {
  // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);

  const makeId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const handleSend = (text) => {
    const userMessage = { id: makeId(), role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);

    // TODO: wire up to actual model call invoke/streaming response NIM API
    // Placeholder echo so bubbles and animations are visible end to end for now
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "assistant", content: `You said: ${text}` },
      ]);
    }, 600);
  };

  return (
    <main className="w-screen h-screen bg-background relative overflow-hidden">
      <MessageList messages={messages} />
      <Chatbox content={prompt} setContent={setPrompt} onSend={handleSend}></Chatbox>
      <Sidebar></Sidebar>
      <WindowDecorations></WindowDecorations>
    </main>
  );
}

export default App;