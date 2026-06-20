import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import WindowDecorations from "./components/WindowDecorations";
import Chatbox from "./components/Chatbox";
import MessageList from "./components/MessageList";
import BlurEdge from "./components/BlurEdge";
import { useState, useRef } from "react";
import Sidebar from "./components/Sidebar";

function App() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const unlistenRefs = useRef([]);

  const makeId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const handleSend = async (text) => {
    const userMessage = { id: makeId(), role: "user", content: text };

    // Build conversation history for the API (current messages + the new one)
    const history = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMessage]);

    const assistantId = makeId();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    const streamId = assistantId;

    // Clean up any previous listeners (defensive, in case of overlap)
    unlistenRefs.current.forEach((fn) => fn());
    unlistenRefs.current = [];

    const unlistenToken = await listen(`llm-token-${streamId}`, (event) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: m.content + event.payload }
            : m
        )
      );
    });

    const unlistenDone = await listen(`llm-done-${streamId}`, () => {
      unlistenToken();
      unlistenDone();
    });

    unlistenRefs.current = [unlistenToken, unlistenDone];

    try {
      await invoke("llm_chat_stream", {
        streamId,
        messages: history,
      });
    } catch (err) {
      console.error("LLM stream error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Error: ${err}` }
            : m
        )
      );
    }
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