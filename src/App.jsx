import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import WindowDecorations from "./components/WindowDecorations";
import Chatbox from "./components/Chatbox";
import MessageList from "./components/MessageList";
import BlurEdge from "./components/BlurEdge";
import { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";

function App() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const activeStreamId = useRef(null);

  const makeId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Register listeners ONCE per mount. Setup is async (listen() returns a
  // Promise), but useEffect's cleanup is synchronous — under StrictMode's
  // mount -> cleanup -> mount double-invoke in dev, cleanup can run before
  // the listeners have resolved. isMounted + the late-arrival branch below
  // make sure we never end up with two live subscriptions.
  useEffect(() => {
    let isMounted = true;
    let unlistenFns = [];

    const setup = async () => {
      const fns = await Promise.all([
        listen("llm-token", (event) => {
          const { streamId, token } = event.payload;
          if (streamId !== activeStreamId.current) return;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamId ? { ...m, content: m.content + token } : m
            )
          );
        }),
        listen("llm-done", (event) => {
          const { streamId } = event.payload;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamId ? { ...m, status: "done" } : m
            )
          );
          if (streamId === activeStreamId.current) {
            activeStreamId.current = null;
          }
        }),
        listen("llm-error", (event) => {
          const { streamId, message } = event.payload;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamId
                ? { ...m, content: `Error: ${message}`, status: "done" }
                : m
            )
          );
          if (streamId === activeStreamId.current) {
            activeStreamId.current = null;
          }
        }),
      ]);

      if (isMounted) {
        unlistenFns = fns;
      } else {
        // Component already unmounted before listeners resolved — clean up immediately.
        fns.forEach((fn) => fn());
      }
    };

    setup();

    return () => {
      isMounted = false;
      unlistenFns.forEach((fn) => fn());
    };
  }, []);

  const handleSend = (text) => {
    const userMessage = { id: makeId(), role: "user", content: text };

    setMessages((prev) => {
      const history = [...prev, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const assistantId = makeId();
      activeStreamId.current = assistantId;

      invoke("llm_chat_stream", { streamId: assistantId, messages: history }).catch(
        (err) => {
          console.error("LLM stream error:", err);
          setMessages((p) =>
            p.map((m) =>
              m.id === assistantId
                ? { ...m, content: `Error: ${err}`, status: "done" }
                : m
            )
          );
          if (activeStreamId.current === assistantId) {
            activeStreamId.current = null;
          }
        }
      );

      return [
        ...prev,
        userMessage,
        { id: assistantId, role: "assistant", content: "", status: "streaming" },
      ];
    });
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