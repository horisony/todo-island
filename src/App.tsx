import { useEffect, useRef, useState } from "react";
import { TodoIsland } from "./components/notch/TodoIsland";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { initTodoStore } from "./store/useTodoStore";

interface UpdateInfo { version: string; body?: string; }

export default function App() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [installing, setInstalling] = useState(false);
  const [windowLabel] = useState(() => getCurrentWebviewWindow().label);

  useEffect(() => { initTodoStore(); }, []);

  useEffect(() => {
    if (windowLabel !== "notch") return;
    const win = getCurrentWindow();
    win.setSize(new LogicalSize(420, 48)).catch(() => {});
    win.center().catch(() => {});
    win.setShadow(false).catch(() => {});
  }, [windowLabel]);

  // Listen for background update check result
  useEffect(() => {
    const unlisten = listen<UpdateInfo>("update-available", (e) => setUpdate(e.payload));
    return () => { unlisten.then(fn => fn()); };
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await invoke("install_update");
    } catch (e) {
      console.error("Update failed:", e);
      setInstalling(false);
    }
  };

  if (windowLabel === "settings") {
    return (
      <div className="w-screen h-screen flex items-center justify-center" style={{ background: "#1a1a1a", color: "#fff" }}>
        Settings not available in todo mode
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex justify-center">
      <TodoIsland />
      {update && !installing && (
        <div
          style={{
            position: "fixed",
            top: 52,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.92)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 11,
            color: "rgba(255,255,255,0.8)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5), 0 0 12px rgba(6,182,212,0.1)",
            zIndex: 9999,
            whiteSpace: "nowrap",
          }}
          data-no-drag
        >
          <span style={{ color: "var(--vi-explore)", fontSize: 13 }}>↑</span>
          <span>
            <span style={{ color: "#fff", fontWeight: 500 }}>v{update.version}</span> available
          </span>
          <button
            onClick={handleInstall}
            style={{
              background: "rgba(255,255,255,0.9)",
              color: "#000",
              border: "none",
              borderRadius: 5,
              padding: "3px 10px",
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
            }}
            data-no-drag
          >
            Install &amp; Restart
          </button>
          <button
            onClick={() => setUpdate(null)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.35)",
              fontSize: 13,
              cursor: "pointer",
              padding: "0 2px",
            }}
            data-no-drag
          >
            ×
          </button>
        </div>
      )}

      {installing && (
        <div
          style={{
            position: "fixed",
            top: 52,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.92)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            padding: "8px 14px",
            fontSize: 11,
            color: "rgba(255,255,255,0.6)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            zIndex: 9999,
          }}
        >
          <span className="pulse-dot" style={{ color: "var(--vi-explore)", marginRight: 6 }}>●</span>
          Downloading update…
        </div>
      )}
    </div>
  );
}