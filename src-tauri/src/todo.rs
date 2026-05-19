use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

use tauri::{Emitter, AppHandle, State};
use tokio::sync::RwLock;
use std::sync::Arc;

pub type SharedTodoState = Arc<RwLock<TodoState>>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TodoItem {
    pub id: String,
    pub text: String,
    pub completed: bool,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TodoState {
    pub todos: Vec<TodoItem>,
}

impl Default for TodoState {
    fn default() -> Self {
        TodoState { todos: Vec::new() }
    }
}

fn get_todo_path() -> PathBuf {
    let base = dirs::home_dir()
        .or_else(dirs::data_local_dir)
        .unwrap_or_else(|| PathBuf::from("."));
    base.join(".vibe-island/todos.json")
}

fn load_todos() -> TodoState {
    let path = get_todo_path();
    if path.exists() {
        match fs::read_to_string(&path) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => TodoState::default(),
        }
    } else {
        TodoState::default()
    }
}

fn save_todos(state: &TodoState) -> Result<(), String> {
    let path = get_todo_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string_pretty(state).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}

pub async fn get_todos(state: State<'_, SharedTodoState>) -> Result<Vec<TodoItem>, String> {
    let s = state.read().await;
    Ok(s.todos.clone())
}

pub async fn add_todo(
    state: State<'_, SharedTodoState>,
    app: AppHandle,
    text: String,
) -> Result<TodoItem, String> {
    let todo = TodoItem {
        id: uuid::Uuid::new_v4().to_string(),
        text,
        completed: false,
        created_at: chrono::Utc::now().timestamp_millis(),
    };
    {
        let mut s = state.write().await;
        s.todos.push(todo.clone());
        save_todos(&s)?;
    }
    let _ = app.emit("todo-update", ());
    Ok(todo)
}

pub async fn toggle_todo(
    state: State<'_, SharedTodoState>,
    app: AppHandle,
    id: String,
) -> Result<TodoItem, String> {
    let mut updated = None;
    {
        let mut s = state.write().await;
        if let Some(todo) = s.todos.iter_mut().find(|t| t.id == id) {
            todo.completed = !todo.completed;
            updated = Some(todo.clone());
        }
        save_todos(&s)?;
    }
    let _ = app.emit("todo-update", ());
    updated.ok_or_else(|| "Todo not found".to_string())
}

pub async fn delete_todo(
    state: State<'_, SharedTodoState>,
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    {
        let mut s = state.write().await;
        s.todos.retain(|t| t.id != id);
        save_todos(&s)?;
    }
    let _ = app.emit("todo-update", ());
    Ok(())
}

pub async fn clear_completed(
    state: State<'_, SharedTodoState>,
    app: AppHandle,
) -> Result<usize, String> {
    let before = {
        let mut s = state.write().await;
        let count = s.todos.iter().filter(|t| t.completed).count();
        s.todos.retain(|t| !t.completed);
        save_todos(&s)?;
        count
    };
    let _ = app.emit("todo-update", ());
    Ok(before)
}

pub fn make_state() -> SharedTodoState {
    Arc::new(RwLock::new(load_todos()))
}