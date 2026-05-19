import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTodoStore } from "../../store/useTodoStore";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";

export function TodoIsland() {
  const { todos, refresh, add, toggle, remove, clearCompleted } = useTodoStore();
  const [hovering, setHovering] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, [refresh]);

  const completed = todos.filter((t) => t.completed).length;
  const total = todos.length;
  const pillLabel = total === 0
    ? "No tasks"
    : completed === total
    ? "All done! ✓"
    : `${completed}/${total} done`;

  const expandOnHover = hovering;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputVal.trim();
    if (!text) return;
    await add(text);
    setInputVal("");
    setAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setAdding(false);
      setInputVal("");
    }
  };

  return (
    <motion.div
      className="relative"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      layout
    >
      <motion.div
        className="notch-shell"
        animate={{
          width: expandOnHover ? 380 : 240,
          height: expandOnHover ? "auto" : 48,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        style={{
          maxWidth: 400,
          boxShadow: "0 2px 8px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.3)",
        }}
      >
        {/* Collapsed pill */}
        <div
          className="compact-pill"
          data-tauri-drag-region
          style={{ cursor: "pointer" }}
          onClick={() => {
            if (!expandOnHover) {
              // Only respond to click when collapsed (expands via hover otherwise)
            }
          }}
        >
          <span style={{ fontSize: 14 }}>📝</span>
          <span className="idle-text">{pillLabel}</span>
          {total > 0 && (
            <span className="idle-count">{total}</span>
          )}
          <button
            className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] opacity-40 hover:opacity-80 transition-opacity"
            data-no-drag
            style={{ color: "var(--notch-text)" }}
            onClick={(e) => { e.stopPropagation(); }}
          >
            {expandOnHover ? "▲" : "▼"}
          </button>
        </div>

        <AnimatePresence>
          {expandOnHover && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className="overflow-hidden"
            >
              <div className="mx-3" style={{ height: 1, background: "var(--notch-border)" }} />

              {/* Todo list */}
              <div className="max-h-72 overflow-y-auto py-1 px-1.5 space-y-0.5">
                {todos.length === 0 && !adding && (
                  <div className="text-center py-4" style={{ color: "var(--notch-muted)", fontSize: 11 }}>
                    No tasks yet. Add one below 👇
                  </div>
                )}

                {todos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/5 transition-colors group"
                  >
                    <button
                      data-no-drag
                      onClick={() => toggle(todo.id)}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 4,
                        border: `1.5px solid ${todo.completed ? "var(--vi-explore)" : "rgba(255,255,255,0.3)"}`,
                        background: todo.completed ? "var(--vi-explore)" : "transparent",
                        flexShrink: 0,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 9,
                      }}
                    >
                      {todo.completed ? "✓" : ""}
                    </button>
                    <span
                      data-no-drag
                      onClick={() => toggle(todo.id)}
                      style={{
                        fontSize: 11,
                        color: todo.completed ? "var(--notch-muted)" : "rgba(255,255,255,0.85)",
                        textDecoration: todo.completed ? "line-through" : "none",
                        cursor: "pointer",
                        flex: 1,
                      }}
                    >
                      {todo.text}
                    </span>
                    <button
                      data-no-drag
                      onClick={() => remove(todo.id)}
                      className="opacity-0 group-hover:opacity-60 transition-opacity"
                      style={{
                        background: "none",
                        border: "none",
                        color: "rgba(255,255,255,0.5)",
                        cursor: "pointer",
                        fontSize: 11,
                        padding: "0 2px",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* Add input */}
                <AnimatePresence>
                  {adding && (
                    <motion.form
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      onSubmit={handleAdd}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-2 px-2 py-1">
                        <input
                          ref={inputRef}
                          autoFocus
                          value={inputVal}
                          onChange={(e) => setInputVal(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Add a task..."
                          style={{
                            flex: 1,
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontSize: 11,
                            color: "#fff",
                            outline: "none",
                          }}
                        />
                        <button
                          type="submit"
                          data-no-drag
                          style={{
                            background: "var(--vi-explore)",
                            border: "none",
                            borderRadius: 5,
                            padding: "4px 8px",
                            fontSize: 10,
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div
                className="mx-3 mt-0.5 mb-1.5 pt-1.5 flex items-center justify-between"
                style={{ borderTop: "1px solid var(--notch-border)" }}
              >
                <div className="flex items-center gap-2">
                  <button
                    data-no-drag
                    onClick={() => setAdding(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--vi-explore)",
                      fontSize: 10,
                      cursor: "pointer",
                    }}
                  >
                    + Add
                  </button>
                  {completed > 0 && (
                    <button
                      data-no-drag
                      onClick={clearCompleted}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--notch-muted)",
                        fontSize: 10,
                        cursor: "pointer",
                      }}
                    >
                      Clear done
                    </button>
                  )}
                </div>
                <span className="text-[9px]" style={{ color: "var(--notch-muted)" }}>
                  {total} task{total !== 1 ? "s" : ""}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}