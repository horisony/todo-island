import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  created_at: number;
}

interface TodoStore {
  todos: TodoItem[];
  refresh: () => Promise<void>;
  add: (text: string) => Promise<void>;
  toggle: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],

  refresh: async () => {
    try {
      const todos = await invoke<TodoItem[]>("get_todos");
      set({ todos });
    } catch (e) {
      console.error("Failed to load todos:", e);
    }
  },

  add: async (text) => {
    try {
      await invoke<TodoItem>("add_todo", { text });
      await get().refresh();
    } catch (e) {
      console.error("Failed to add todo:", e);
    }
  },

  toggle: async (id) => {
    try {
      await invoke<TodoItem>("toggle_todo", { id });
      await get().refresh();
    } catch (e) {
      console.error("Failed to toggle todo:", e);
    }
  },

  remove: async (id) => {
    try {
      await invoke("delete_todo", { id });
      await get().refresh();
    } catch (e) {
      console.error("Failed to delete todo:", e);
    }
  },

  clearCompleted: async () => {
    try {
      await invoke("clear_completed");
      await get().refresh();
    } catch (e) {
      console.error("Failed to clear todos:", e);
    }
  },
}));

export const initTodoStore = () => {
  useTodoStore.getState().refresh();
  listen("todo-update", () => useTodoStore.getState().refresh());
};