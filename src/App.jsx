import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import WindowDecorations from "./components/WindowDecorations";
import Chatbox from "./components/Chatbox";
import MessageList from "./components/MessageList";
import BlurEdge from "./components/BlurEdge";
import { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import SettingsMenu from "./components/SettingsMenu";
import ChatList from "./components/ChatList";

function App() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([{ name: "Python Code Problems", date: "10/5/2026" }, { name: "SQL Query", date: "8/5/2026" }])
  const [active, setActive] = useState("home");
  const activeStreamId = useRef(null);
  
  const [apiUrl, setApiUrl] = useState("https://integrate.api.nvidia.com/v1/chat/completions");
  const [apiKey, setApiKey] = useState("nvapi-xxxxxxxxxxxxxxxx");
  const [setting1, setSetting1] = useState(false);
  const settings = {
    apiUrl: apiUrl,
    setApiUrl: setApiUrl,
    apiKey: apiKey,
    setApiKey: setApiKey,
    setting1: setting1,
    setSetting1: setSetting1
  }

  const onNewChat = () => {
    setMessages([]);
    setActive("home");
  }

  const openChat = (chat) => {
    // TODO: load this chat's real message history into `messages`
    // (e.g. setMessages(chat.messages) once chats carry stored history).
    console.log("Opening chat:", chat);
    setActive("home");
  }

  const onDeleteChat = (chat) => {
    // TODO: also delete any persisted history for this chat once chats are
    // backed by real storage, not just this in-memory dummy list.
    setChats((prev) => prev.filter((c) => c !== chat));
  }

  const makeId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;


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
    if (active == "chats") {setActive("home");}
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
      { active == "home" ? <MessageList messages={messages} /> : "" }
      { active == "home" || active == "chats" ? <Chatbox content={prompt} setContent={setPrompt} onSend={handleSend} placeholder={ active == "home" ? "Ask Me Anything..." : "Type for a new chat..." }/> : "" }
      { active == "settings" ? <SettingsMenu settings={settings} openChat={() => {}}/> : "" }
      { active == "chats" ? <ChatList chats={chats} openChat={openChat} onDeleteChat={onDeleteChat} /> : "" }
      <Sidebar active={active} setActive={setActive} onNewChat={onNewChat}/>
      <WindowDecorations/>
    </main>
  );
}

export default App;