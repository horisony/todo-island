// ─── Todo data types & state ─────────────────────────────────────────────────

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TodoItem {
    pub id: String,
    pub text: String,
    pub completed: bool,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TodoState {
    pub todos: Vec<TodoItem>,
}

pub type SharedTodoState = Arc<RwLock<TodoState>>;

pub fn get_todo_path() -> PathBuf {
    dirs::home_dir()
        .or_else(dirs::data_local_dir)
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".vibe-island/todos.json")
}

pub fn load_todos() -> TodoState {
    let path = get_todo_path();
    if path.exists() {
        fs::read_to_string(&path)
            .ok()
            .and_then(|c| serde_json::from_str(&c).ok())
            .unwrap_or_default()
    } else {
        TodoState::default()
    }
}

pub fn save_todos(state: &TodoState) -> Result<(), String> {
    let path = get_todo_path();
    if let Some(p) = path.parent() {
        fs::create_dir_all(p).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string_pretty(state).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}

pub fn make_todo_state() -> SharedTodoState {
    Arc::new(RwLock::new(load_todos()))
}